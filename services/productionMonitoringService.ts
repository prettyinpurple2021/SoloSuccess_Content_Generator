/**
 * Production Monitoring Service
 *
 * Comprehensive monitoring and alerting system for production environment.
 * Tracks performance metrics, errors, and system health.
 */

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  unit?: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  window: number; // in milliseconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minimum time between alerts in milliseconds
}

interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  cpuUsage: number;
  memoryUsage: number;
  databaseConnections: number;
  aiApiCalls: number;
  integrationCalls: number;
}

class ProductionMonitoringService {
  private metrics: MetricData[] = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private lastAlertTime: Map<string, number> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.INTEGRATION_MONITORING_ENABLED === 'true';
    this.initializeDefaultAlertRules();
  }

  /**
   * Initialize default alert rules for production monitoring
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5, // 5% error rate
        window: 5 * 60 * 1000, // 5 minutes
        severity: 'high',
        enabled: true,
        cooldown: 15 * 60 * 1000, // 15 minutes
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        metric: 'response_time',
        condition: 'gt',
        threshold: 2000, // 2 seconds
        window: 5 * 60 * 1000, // 5 minutes
        severity: 'medium',
        enabled: true,
        cooldown: 10 * 60 * 1000, // 10 minutes
      },
      {
        id: 'database-connection-issues',
        name: 'Database Connection Issues',
        metric: 'database_errors',
        condition: 'gt',
        threshold: 10, // 10 database errors
        window: 5 * 60 * 1000, // 5 minutes
        severity: 'critical',
        enabled: true,
        cooldown: 5 * 60 * 1000, // 5 minutes
      },
      {
        id: 'ai-service-failures',
        name: 'AI Service Failures',
        metric: 'ai_service_errors',
        condition: 'gt',
        threshold: 5, // 5 AI service errors
        window: 10 * 60 * 1000, // 10 minutes
        severity: 'high',
        enabled: true,
        cooldown: 15 * 60 * 1000, // 15 minutes
      },
      {
        id: 'integration-failures',
        name: 'Integration Service Failures',
        metric: 'integration_errors',
        condition: 'gt',
        threshold: 3, // 3 integration errors
        window: 10 * 60 * 1000, // 10 minutes
        severity: 'medium',
        enabled: true,
        cooldown: 20 * 60 * 1000, // 20 minutes
      },
    ];

    this.alertRules = defaultRules;
  }

  /**
   * Record a metric data point
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>, unit?: string): void {
    if (!this.isEnabled) return;

    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
      unit,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check alert rules
    this.checkAlertRules(metric);
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (!this.isEnabled) return;

    // Record performance metrics with timestamp
    const tags = { source: 'performance_monitor' };

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        this.recordMetric(key, value, tags);
      }
    });
  }

  /**
   * Record API response time
   */
  recordApiResponseTime(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number
  ): void {
    if (!this.isEnabled) return;

    const tags = {
      endpoint,
      method,
      status_code: statusCode.toString(),
      status_class: Math.floor(statusCode / 100) + 'xx',
    };

    this.recordMetric('api_response_time', responseTime, tags, 'ms');

    // Record error if status code indicates error
    if (statusCode >= 400) {
      this.recordMetric('api_error', 1, tags);
    }
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseMetrics(operation: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return;

    const tags = {
      operation,
      success: success.toString(),
    };

    this.recordMetric('database_operation_time', duration, tags, 'ms');

    if (!success) {
      this.recordMetric('database_errors', 1, tags);
    }
  }

  /**
   * Record AI service metrics
   */
  recordAIServiceMetrics(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    tokensUsed?: number
  ): void {
    if (!this.isEnabled) return;

    const tags = {
      service,
      operation,
      success: success.toString(),
    };

    this.recordMetric('ai_service_response_time', duration, tags, 'ms');

    if (tokensUsed) {
      this.recordMetric('ai_tokens_used', tokensUsed, tags);
    }

    if (!success) {
      this.recordMetric('ai_service_errors', 1, tags);
    }
  }

  /**
   * Record integration service metrics
   */
  recordIntegrationMetrics(
    platform: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    if (!this.isEnabled) return;

    const tags = {
      platform,
      operation,
      success: success.toString(),
    };

    this.recordMetric('integration_response_time', duration, tags, 'ms');

    if (!success) {
      this.recordMetric('integration_errors', 1, tags);
    }
  }

  /**
   * Check alert rules against new metric
   */
  private checkAlertRules(metric: MetricData): void {
    const now = Date.now();

    this.alertRules
      .filter((rule) => rule.enabled && rule.metric === metric.name)
      .forEach((rule) => {
        // Check cooldown period
        const lastAlert = this.lastAlertTime.get(rule.id);
        if (lastAlert && now - lastAlert < rule.cooldown) {
          return;
        }

        // Get metrics within the time window
        const windowStart = now - rule.window;
        const windowMetrics = this.metrics.filter(
          (m) => m.name === rule.metric && m.timestamp >= windowStart
        );

        if (windowMetrics.length === 0) return;

        // Calculate aggregate value (average for now)
        const aggregateValue =
          windowMetrics.reduce((sum, m) => sum + m.value, 0) / windowMetrics.length;

        // Check if alert condition is met
        const conditionMet = this.evaluateCondition(aggregateValue, rule.condition, rule.threshold);

        if (conditionMet) {
          this.triggerAlert(rule, aggregateValue, windowMetrics.length);
        }
      });
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, value: number, sampleCount: number): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      message: `${rule.name}: ${rule.metric} is ${value.toFixed(2)} (threshold: ${rule.threshold})`,
      severity: rule.severity,
      timestamp: Date.now(),
      resolved: false,
      metadata: {
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        condition: rule.condition,
        sampleCount,
        window: rule.window,
      },
    };

    this.alerts.push(alert);
    this.lastAlertTime.set(rule.id, Date.now());

    // Send alert notification
    this.sendAlertNotification(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Log alert to console
      console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);

      // Send to webhook if configured
      const webhookUrl = process.env.MONITORING_WEBHOOK_URL;
      if (webhookUrl) {
        await this.sendWebhookNotification(webhookUrl, alert);
      }

      // Send email if configured
      const alertEmail = process.env.ALERT_EMAIL;
      if (alertEmail) {
        await this.sendEmailNotification(alertEmail, alert);
      }

      // Send to Sentry if configured
      if (process.env.SENTRY_DSN) {
        await this.sendSentryNotification(alert);
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(webhookUrl: string, alert: Alert): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'alert',
          alert,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }

  /**
   * Send email notification (placeholder - would integrate with email service)
   */
  private async sendEmailNotification(email: string, alert: Alert): Promise<void> {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    console.log(`📧 Email alert would be sent to ${email}: ${alert.message}`);
  }

  /**
   * Send Sentry notification
   */
  private async sendSentryNotification(alert: Alert): Promise<void> {
    try {
      // This would integrate with Sentry SDK
      console.log(`📊 Sentry notification: ${alert.message}`);
    } catch (error) {
      console.error('Sentry notification failed:', error);
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(timeWindow: number = 60 * 60 * 1000): Record<string, unknown> {
    const now = Date.now();
    const windowStart = now - timeWindow;

    const recentMetrics = this.metrics.filter((m) => m.timestamp >= windowStart);

    const summary: Record<string, unknown> = {};

    // Group metrics by name
    const metricGroups = recentMetrics.reduce(
      (groups, metric) => {
        if (!groups[metric.name]) {
          groups[metric.name] = [];
        }
        groups[metric.name].push(metric);
        return groups;
      },
      {} as Record<string, MetricData[]>
    );

    // Calculate statistics for each metric
    Object.entries(metricGroups).forEach(([name, metrics]) => {
      const values = metrics.map((m) => m.value);
      summary[name] = {
        count: values.length,
        avg: values.reduce((sum, v) => sum + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
      };
    });

    return summary;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 50): Alert[] {
    return this.alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.alertRules.push({ ...rule, id });
    return id;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex((r) => r.id === id);
    if (ruleIndex >= 0) {
      this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
      return true;
    }
    return false;
  }

  /**
   * Delete alert rule
   */
  deleteAlertRule(id: string): boolean {
    const ruleIndex = this.alertRules.findIndex((r) => r.id === id);
    if (ruleIndex >= 0) {
      this.alertRules.splice(ruleIndex, 1);
      return true;
    }
    return false;
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    metrics: Record<string, unknown>;
    activeAlerts: Alert[];
    alertRules: AlertRule[];
    systemHealth: string;
  } {
    const metrics = this.getMetricsSummary();
    const activeAlerts = this.getActiveAlerts();

    // Determine system health
    let systemHealth = 'healthy';
    if (activeAlerts.some((a) => a.severity === 'critical')) {
      systemHealth = 'critical';
    } else if (activeAlerts.some((a) => a.severity === 'high')) {
      systemHealth = 'degraded';
    } else if (activeAlerts.length > 0) {
      systemHealth = 'warning';
    }

    return {
      metrics,
      activeAlerts,
      alertRules: this.alertRules,
      systemHealth,
    };
  }
}

// Create singleton instance
export const productionMonitoringService = new ProductionMonitoringService();

// Export types for use in other modules
export type { MetricData, AlertRule, Alert, PerformanceMetrics };

export default ProductionMonitoringService;
