// services/utils/monitoringService.ts
import { db } from '../supabaseService';

export interface MonitoringConfig {
  enabled: boolean;
  alertThresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    availability: number; // percentage
  };
  notificationChannels: string[];
}

export interface ApiMetrics {
  service: string;
  operation: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  availability: number;
  issues: string[];
}

export class MonitoringService {
  private static config: MonitoringConfig = {
    enabled: true,
    alertThresholds: {
      errorRate: 5, // 5%
      responseTime: 5000, // 5 seconds
      availability: 95 // 95%
    },
    notificationChannels: ['console', 'database']
  };

  /**
   * Record API metrics
   */
  static async recordMetrics(metrics: ApiMetrics): Promise<void> {
    if (!this.config.enabled) return;

    try {
      // Store in database
      const { error } = await db.supabase
        .from('api_metrics')
        .insert({
          service: metrics.service,
          operation: metrics.operation,
          timestamp: metrics.timestamp.toISOString(),
          duration: metrics.duration,
          success: metrics.success,
          status_code: metrics.statusCode,
          error_message: metrics.errorMessage,
          user_id: metrics.userId,
          metadata: metrics.metadata
        });

      if (error) {
        console.error('Failed to record API metrics:', error);
      }

      // Check for alerts
      await this.checkAlerts(metrics);
    } catch (error) {
      console.error('Error recording metrics:', error);
    }
  }

  /**
   * Perform health check for a service
   */
  static async performHealthCheck(service: string): Promise<HealthCheck> {
    const startTime = Date.now();
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let issues: string[] = [];

    try {
      // Get recent metrics for the service
      const { data: metrics, error } = await db.supabase
        .from('api_metrics')
        .select('*')
        .eq('service', service)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`);
      }

      const responseTime = Date.now() - startTime;
      const totalRequests = metrics?.length || 0;
      const successfulRequests = metrics?.filter(m => m.success).length || 0;
      const errorRate = totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;
      const availability = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

      // Determine status based on thresholds
      if (errorRate > this.config.alertThresholds.errorRate) {
        status = 'unhealthy';
        issues.push(`High error rate: ${errorRate.toFixed(2)}%`);
      }

      if (responseTime > this.config.alertThresholds.responseTime) {
        status = status === 'healthy' ? 'degraded' : status;
        issues.push(`Slow response time: ${responseTime}ms`);
      }

      if (availability < this.config.alertThresholds.availability) {
        status = 'unhealthy';
        issues.push(`Low availability: ${availability.toFixed(2)}%`);
      }

      const healthCheck: HealthCheck = {
        service,
        status,
        lastCheck: new Date(),
        responseTime,
        errorRate,
        availability,
        issues
      };

      // Store health check result
      await this.storeHealthCheck(healthCheck);

      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        service,
        status: 'unhealthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        errorRate: 100,
        availability: 0,
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };

      await this.storeHealthCheck(healthCheck);
      return healthCheck;
    }
  }

  /**
   * Get service status overview
   */
  static async getServiceStatus(): Promise<{
    services: HealthCheck[];
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    summary: {
      totalServices: number;
      healthyServices: number;
      degradedServices: number;
      unhealthyServices: number;
    };
  }> {
    const services = [
      'twitter', 'linkedin', 'facebook', 'instagram', 'reddit', 
      'pinterest', 'bluesky', 'google_analytics', 'openai', 'claude'
    ];

    const healthChecks = await Promise.all(
      services.map(service => this.performHealthCheck(service))
    );

    const healthyServices = healthChecks.filter(h => h.status === 'healthy').length;
    const degradedServices = healthChecks.filter(h => h.status === 'degraded').length;
    const unhealthyServices = healthChecks.filter(h => h.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyServices > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    return {
      services: healthChecks,
      overallStatus,
      summary: {
        totalServices: services.length,
        healthyServices,
        degradedServices,
        unhealthyServices
      }
    };
  }

  /**
   * Get metrics dashboard data
   */
  static async getDashboardData(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<{
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topErrors: { error: string; count: number }[];
    serviceBreakdown: { service: string; requests: number; errors: number }[];
  }> {
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(Date.now() - timeRanges[timeRange]);

    const { data: metrics, error } = await db.supabase
      .from('api_metrics')
      .select('*')
      .gte('timestamp', startTime.toISOString());

    if (error) {
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }

    const totalRequests = metrics?.length || 0;
    const successfulRequests = metrics?.filter(m => m.success).length || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageResponseTime = metrics?.reduce((sum, m) => sum + m.duration, 0) / totalRequests || 0;

    // Top errors
    const errorCounts: { [key: string]: number } = {};
    metrics?.filter(m => !m.success).forEach(m => {
      const error = m.error_message || 'Unknown error';
      errorCounts[error] = (errorCounts[error] || 0) + 1;
    });

    const topErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Service breakdown
    const serviceCounts: { [key: string]: { requests: number; errors: number } } = {};
    metrics?.forEach(m => {
      if (!serviceCounts[m.service]) {
        serviceCounts[m.service] = { requests: 0, errors: 0 };
      }
      serviceCounts[m.service].requests++;
      if (!m.success) {
        serviceCounts[m.service].errors++;
      }
    });

    const serviceBreakdown = Object.entries(serviceCounts)
      .map(([service, counts]) => ({ service, ...counts }))
      .sort((a, b) => b.requests - a.requests);

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      topErrors,
      serviceBreakdown
    };
  }

  /**
   * Check for alerts based on metrics
   */
  private static async checkAlerts(metrics: ApiMetrics): Promise<void> {
    // This would implement alerting logic
    // For now, just log significant issues
    if (!metrics.success && metrics.statusCode && metrics.statusCode >= 500) {
      console.error(`Service ${metrics.service} is experiencing server errors:`, {
        operation: metrics.operation,
        statusCode: metrics.statusCode,
        errorMessage: metrics.errorMessage
      });
    }
  }

  /**
   * Store health check result
   */
  private static async storeHealthCheck(healthCheck: HealthCheck): Promise<void> {
    try {
      const { error } = await db.supabase
        .from('health_checks')
        .upsert({
          service: healthCheck.service,
          status: healthCheck.status,
          last_check: healthCheck.lastCheck.toISOString(),
          response_time: healthCheck.responseTime,
          error_rate: healthCheck.errorRate,
          availability: healthCheck.availability,
          issues: healthCheck.issues
        });

      if (error) {
        console.error('Failed to store health check:', error);
      }
    } catch (error) {
      console.error('Error storing health check:', error);
    }
  }

  /**
   * Configure monitoring settings
   */
  static configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

export default MonitoringService;
