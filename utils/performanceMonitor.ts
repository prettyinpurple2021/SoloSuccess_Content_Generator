/**
 * Performance Monitor Utility
 *
 * Provides utilities to monitor and log performance metrics
 * for identifying slow components and potential memory leaks.
 */

interface PerformanceMetric {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

interface MemoryUsage {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics
  private slowRenderThreshold = 16; // 16ms for 60fps
  private memoryCheckInterval: number | null = null;

  /**
   * Track component render time
   */
  trackRender(componentName: string, startTime: number): void {
    const renderTime = performance.now() - startTime;

    this.metrics.push({
      componentName,
      renderTime,
      timestamp: Date.now(),
    });

    // Keep metrics array bounded
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > this.slowRenderThreshold) {
      console.warn(
        `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (threshold: ${this.slowRenderThreshold}ms)`
      );
    }
  }

  /**
   * Get average render time for a component
   */
  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.metrics.filter((m) => m.componentName === componentName);

    if (componentMetrics.length === 0) return 0;

    const sum = componentMetrics.reduce((acc, m) => acc + m.renderTime, 0);
    return sum / componentMetrics.length;
  }

  /**
   * Get slowest components
   */
  getSlowestComponents(count: number = 5): Array<{ name: string; avgTime: number }> {
    const componentTimes = new Map<string, number[]>();

    // Group render times by component
    this.metrics.forEach((metric) => {
      if (!componentTimes.has(metric.componentName)) {
        componentTimes.set(metric.componentName, []);
      }
      componentTimes.get(metric.componentName)!.push(metric.renderTime);
    });

    // Calculate averages
    const averages = Array.from(componentTimes.entries()).map(([name, times]) => ({
      name,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    }));

    // Sort by average time descending
    return averages.sort((a, b) => b.avgTime - a.avgTime).slice(0, count);
  }

  /**
   * Check memory usage (Chrome only)
   */
  checkMemoryUsage(): MemoryUsage | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Start monitoring memory usage
   */
  startMemoryMonitoring(intervalMs: number = 30000): void {
    if (this.memoryCheckInterval !== null) {
      return; // Already monitoring
    }

    this.memoryCheckInterval = window.setInterval(() => {
      const memory = this.checkMemoryUsage();
      if (memory && memory.usedJSHeapSize && memory.jsHeapSizeLimit) {
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        if (process.env.NODE_ENV === 'development' && usagePercent > 80) {
          console.warn(
            `⚠️ High memory usage detected: ${usagePercent.toFixed(1)}% (${(memory.usedJSHeapSize / 1048576).toFixed(1)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(1)}MB)`
          );
        }
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring memory usage
   */
  stopMemoryMonitoring(): void {
    if (this.memoryCheckInterval !== null) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    totalMetrics: number;
    slowestComponents: Array<{ name: string; avgTime: number }>;
    memoryUsage: MemoryUsage | null;
  } {
    return {
      totalMetrics: this.metrics.length,
      slowestComponents: this.getSlowestComponents(),
      memoryUsage: this.checkMemoryUsage(),
    };
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    const report = this.generateReport();

    console.group('📊 Performance Report');
    console.log(`Total metrics collected: ${report.totalMetrics}`);

    console.group('🐌 Slowest Components:');
    report.slowestComponents.forEach((comp, index) => {
      console.log(`${index + 1}. ${comp.name}: ${comp.avgTime.toFixed(2)}ms`);
    });
    console.groupEnd();

    if (report.memoryUsage) {
      console.group('💾 Memory Usage:');
      console.log(`Used: ${((report.memoryUsage.usedJSHeapSize || 0) / 1048576).toFixed(1)}MB`);
      console.log(`Total: ${((report.memoryUsage.totalJSHeapSize || 0) / 1048576).toFixed(1)}MB`);
      console.log(`Limit: ${((report.memoryUsage.jsHeapSizeLimit || 0) / 1048576).toFixed(1)}MB`);
      console.groupEnd();
    }

    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Track component render time manually
 * Call this at the start of your component function:
 * const renderStart = performance.now();
 * Then call this at the end or in useEffect:
 * performanceMonitor.trackRender('ComponentName', renderStart);
 */

// Expose performance monitor globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__PERF_MONITOR__ = performanceMonitor;
  console.log('💡 Performance monitor available at window.__PERF_MONITOR__');
  console.log('   Run __PERF_MONITOR__.logReport() to see performance metrics');
}
