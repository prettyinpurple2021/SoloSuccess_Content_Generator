/**
 * Production Monitoring Service
 *
 * Provides comprehensive monitoring and alerting for critical failures
 * in production environment.
 */

interface MonitoringConfig {
  healthCheckInterval: number;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  alertChannels: {
    console: boolean;
    webhook: boolean;
    email: boolean;
  };
  retentionPeriod: number; // days
}

interface HealthMetrics {
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  activeConnections: number;
  uptime: number;
  version: string;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, unknown>;
}

interface SystemError {
  id: string;
  type: 'database' | 'ai_service' | 'authentication' | 'integration' | 'application';
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  requestId?: string;
  metadata: Record<string, unknown>;
}

class ProductionMonitoringService {
  private config: MonitoringConfig;
  private metrics: HealthMetrics[] = [];
  private alerts: Alert[] = [];
  private errors: SystemError[] = [];
  private isMonitoring = false;
  private healthCheckTimer?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      healthCheckInterval: 60000, // 1 minute
      alertThresholds: {
        errorRate: 0.05, // 5%
        responseTime: 5000, // 5 seconds
        memoryUsage: 0.85, // 85%
        cpuUsage: 0.8, // 80%
      },
      alertChannels: {
        console: true,
        webhook: false,
        email: false,
      },
      retentionPeriod: 7, // 7 days
      ...config,
    };
  }

  /**
   * Start monitoring system
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('🔍 Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting production monitoring...');

    // Start periodic health checks
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    // Initial health check
    this.performHealthCheck();

    // Set up error handlers
    this.setupErrorHandlers();

    console.log(
      `✅ Production monitoring started (interval: ${this.config.healthCheckInterval}ms)`
    );
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    console.log('🔍 Production monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();

      // Check all system components
      const [databaseHealth, aiServiceHealth, authHealth, integrationHealth, systemHealth] =
        await Promise.allSettled([
          this.checkDatabaseHealth(),
          this.checkAIServiceHealth(),
          this.checkAuthenticationHealth(),
          this.checkIntegrationHealth(),
          this.checkSystemHealth(),
        ]);

      const responseTime = Date.now() - startTime;

      // Calculate overall health status
      const healthChecks = [
        databaseHealth,
        aiServiceHealth,
        authHealth,
        integrationHealth,
        systemHealth,
      ];

      const failedChecks = healthChecks.filter((check) => check.status === 'rejected').length;
      const totalChecks = healthChecks.length;
      const errorRate = failedChecks / totalChecks;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (errorRate > 0.5) {
        status = 'unhealthy';
      } else if (errorRate > 0.2) {
        status = 'degraded';
      }

      // Create health metrics
      const metrics: HealthMetrics = {
        timestamp: new Date(),
        status,
        responseTime,
        errorRate,
        memoryUsage: this.getMemoryUsage(),
        activeConnections: this.getActiveConnections(),
        uptime: Date.now() - this.startTime,
        version: process.env.npm_package_version || '1.0.0',
      };

      this.metrics.push(metrics);
      this.cleanupOldMetrics();

      // Check for alerts
      this.checkAlertConditions(metrics);

      // Log health status
      if (status === 'healthy') {
        console.log(`✅ Health check passed (${responseTime}ms)`);
      } else if (status === 'degraded') {
        console.log(
          `⚠️ System degraded (${responseTime}ms, ${(errorRate * 100).toFixed(1)}% error rate)`
        );
      } else {
        console.log(
          `❌ System unhealthy (${responseTime}ms, ${(errorRate * 100).toFixed(1)}% error rate)`
        );
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.recordError('application', 'Health check failed', error);
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Dynamic import to avoid circular dependencies
      const { testConnection } = await import('./neonService.js');
      await testConnection();
      return true;
    } catch (error) {
      this.recordError('database', 'Database health check failed', error);
      throw error;
    }
  }

  /**
   * Check AI service health
   */
  private async checkAIServiceHealth(): Promise<boolean> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      // Simple configuration check - avoid making actual API calls
      // to prevent unnecessary costs and rate limiting
      return true;
    } catch (error) {
      this.recordError('ai_service', 'AI service health check failed', error);
      throw error;
    }
  }

  /**
   * Check authentication health
   */
  private async checkAuthenticationHealth(): Promise<boolean> {
    try {
      const requiredVars = [
        'VITE_STACK_PROJECT_ID',
        'VITE_STACK_PUBLISHABLE_CLIENT_KEY',
        'STACK_SECRET_SERVER_KEY',
      ];

      const missingVars = requiredVars.filter((varName) => !process.env[varName]);

      if (missingVars.length > 0) {
        throw new Error(`Missing authentication variables: ${missingVars.join(', ')}`);
      }

      return true;
    } catch (error) {
      this.recordError('authentication', 'Authentication health check failed', error);
      throw error;
    }
  }

  /**
   * Check integration health
   */
  private async checkIntegrationHealth(): Promise<boolean> {
    try {
      if (!process.env.INTEGRATION_ENCRYPTION_SECRET) {
        throw new Error('Integration encryption secret not configured');
      }

      if (process.env.INTEGRATION_ENCRYPTION_SECRET.length < 32) {
        throw new Error('Integration encryption secret too short');
      }

      return true;
    } catch (error) {
      this.recordError('integration', 'Integration health check failed', error);
      throw error;
    }
  }

  /**
   * Check system health (memory, etc.)
   */
  private async checkSystemHealth(): Promise<boolean> {
    try {
      const memoryUsage = this.getMemoryUsage();

      if (memoryUsage > this.config.alertThresholds.memoryUsage) {
        throw new Error(`High memory usage: ${(memoryUsage * 100).toFixed(1)}%`);
      }

      return true;
    } catch (error) {
      this.recordError('application', 'System health check failed', error);
      throw error;
    }
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      // Estimate based on heap used vs heap total
      return usage.heapUsed / usage.heapTotal;
    }
    return 0;
  }

  /**
   * Get active connections count (placeholder)
   */
  private getActiveConnections(): number {
    // In a real implementation, this would track actual connections
    return 0;
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(metrics: HealthMetrics): void {
    const { alertThresholds } = this.config;

    // Check error rate
    if (metrics.errorRate > alertThresholds.errorRate) {
      this.createAlert(
        'critical',
        'High Error Rate',
        `Error rate is ${(metrics.errorRate * 100).toFixed(1)}% (threshold: ${(alertThresholds.errorRate * 100).toFixed(1)}%)`,
        { errorRate: metrics.errorRate, threshold: alertThresholds.errorRate }
      );
    }

    // Check response time
    if (metrics.responseTime > alertThresholds.responseTime) {
      this.createAlert(
        'warning',
        'Slow Response Time',
        `Response time is ${metrics.responseTime}ms (threshold: ${alertThresholds.responseTime}ms)`,
        { responseTime: metrics.responseTime, threshold: alertThresholds.responseTime }
      );
    }

    // Check memory usage
    if (metrics.memoryUsage > alertThresholds.memoryUsage) {
      this.createAlert(
        'warning',
        'High Memory Usage',
        `Memory usage is ${(metrics.memoryUsage * 100).toFixed(1)}% (threshold: ${(alertThresholds.memoryUsage * 100).toFixed(1)}%)`,
        { memoryUsage: metrics.memoryUsage, threshold: alertThresholds.memoryUsage }
      );
    }

    // Check system status
    if (metrics.status === 'unhealthy') {
      this.createAlert('critical', 'System Unhealthy', 'Multiple system components are failing', {
        status: metrics.status,
        errorRate: metrics.errorRate,
      });
    } else if (metrics.status === 'degraded') {
      this.createAlert(
        'warning',
        'System Degraded',
        'Some system components are experiencing issues',
        { status: metrics.status, errorRate: metrics.errorRate }
      );
    }
  }

  /**
   * Create and send alert
   */
  private createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const alert: Alert = {
      id: this.generateId(),
      type,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata,
    };

    this.alerts.push(alert);
    this.sendAlert(alert);
    this.cleanupOldAlerts();
  }

  /**
   * Send alert through configured channels
   */
  private sendAlert(alert: Alert): void {
    const { alertChannels } = this.config;

    // Console logging
    if (alertChannels.console) {
      const icon =
        alert.type === 'critical'
          ? '🚨'
          : alert.type === 'error'
            ? '❌'
            : alert.type === 'warning'
              ? '⚠️'
              : 'ℹ️';

      console.log(`${icon} ALERT [${alert.type.toUpperCase()}] ${alert.title}: ${alert.message}`);

      if (Object.keys(alert.metadata).length > 0) {
        console.log('   Metadata:', JSON.stringify(alert.metadata, null, 2));
      }
    }

    // Webhook notifications
    if (alertChannels.webhook && process.env.MONITORING_WEBHOOK_URL) {
      this.sendWebhookAlert(alert);
    }

    // Email notifications (placeholder)
    if (alertChannels.email && process.env.MONITORING_EMAIL_ENDPOINT) {
      this.sendEmailAlert(alert);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
      if (!webhookUrl) return;

      const payload = {
        alert: {
          id: alert.id,
          type: alert.type,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          metadata: alert.metadata,
        },
        service: 'solosuccess-ai-content-factory',
        environment: process.env.NODE_ENV || 'development',
      };

      // Use fetch if available, otherwise skip
      if (typeof fetch !== 'undefined') {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send email alert (placeholder)
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      // Placeholder for email integration
      console.log(`📧 Email alert would be sent: ${alert.title}`);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Record system error
   */
  recordError(
    type: SystemError['type'],
    message: string,
    error: unknown,
    userId?: string,
    requestId?: string,
    metadata: Record<string, unknown> = {}
  ): void {
    const systemError: SystemError = {
      id: this.generateId(),
      type,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date(),
      userId,
      requestId,
      metadata: {
        ...metadata,
        originalError: error instanceof Error ? error.message : String(error),
      },
    };

    this.errors.push(systemError);
    this.cleanupOldErrors();

    // Create alert for critical errors
    if (type === 'database' || type === 'authentication') {
      this.createAlert('critical', `${type} Error`, message, {
        errorType: type,
        userId,
        requestId,
      });
    } else {
      this.createAlert('error', `${type} Error`, message, {
        errorType: type,
        userId,
        requestId,
      });
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10): SystemError[] {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get health metrics for time range
   */
  getHealthMetrics(hours = 24): HealthMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter((metric) => metric.timestamp >= cutoff);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alert.title}`);
      return true;
    }
    return false;
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        this.recordError(
          'application',
          'Unhandled Promise Rejection',
          reason,
          undefined,
          undefined,
          {
            promise: promise.toString(),
          }
        );
      });

      process.on('uncaughtException', (error) => {
        this.recordError('application', 'Uncaught Exception', error);
        // Don't exit the process in production monitoring
      });
    }

    // Handle window errors in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.recordError('application', 'JavaScript Error', event.error, undefined, undefined, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.recordError('application', 'Unhandled Promise Rejection', event.reason);
      });
    }
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter((metric) => metric.timestamp >= cutoff);
  }

  /**
   * Clean up old alerts
   */
  private cleanupOldAlerts(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((alert) => alert.timestamp >= cutoff);
  }

  /**
   * Clean up old errors
   */
  private cleanupOldErrors(): void {
    const cutoff = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    this.errors = this.errors.filter((error) => error.timestamp >= cutoff);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isActive: boolean;
    uptime: number;
    totalMetrics: number;
    totalAlerts: number;
    totalErrors: number;
    currentStatus: string;
  } {
    const currentHealth = this.getHealthStatus();

    return {
      isActive: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      totalMetrics: this.metrics.length,
      totalAlerts: this.alerts.length,
      totalErrors: this.errors.length,
      currentStatus: currentHealth?.status || 'unknown',
    };
  }
}

// Create singleton instance
const productionMonitoringService = new ProductionMonitoringService();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  productionMonitoringService.startMonitoring();
}

export { ProductionMonitoringService, productionMonitoringService };
export type { MonitoringConfig, HealthMetrics, Alert, SystemError };
