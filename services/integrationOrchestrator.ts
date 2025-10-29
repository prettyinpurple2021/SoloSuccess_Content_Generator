import { Integration } from '../types';
import { integrationService } from './integrationService';
import { rateLimitingService } from './rateLimitingService';
import { performanceMonitoringService } from './performanceMonitoringService';
import { comprehensiveLoggingService } from './comprehensiveLoggingService';
import { advancedSecurityService } from './advancedSecurityService';
import { productionQualityValidationService } from './productionQualityValidationService';
import { monitoringService } from './monitoringService';

/**
 * IntegrationOrchestrator - Central orchestrator for all integration services
 *
 * Features:
 * - Unified integration management
 * - Service coordination
 * - Health monitoring
 * - Performance optimization
 * - Security enforcement
 * - Quality assurance
 * - Production readiness validation
 */
export class IntegrationOrchestrator {
  private static readonly ORCHESTRATION_INTERVAL = 60000; // 1 minute
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  private orchestrationTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initializes the integration orchestrator
   */
  private async initialize(): Promise<void> {
    try {
      await comprehensiveLoggingService.info('system', 'Initializing Integration Orchestrator', {
        operation: 'orchestrator_initialize',
      });

      // Start orchestration services
      this.startOrchestration();
      this.startHealthMonitoring();

      this.isInitialized = true;

      await comprehensiveLoggingService.info(
        'system',
        'Integration Orchestrator initialized successfully',
        { operation: 'orchestrator_initialize_complete' }
      );
    } catch (error) {
      await comprehensiveLoggingService.error(
        'system',
        'Failed to initialize Integration Orchestrator',
        {
          operation: 'orchestrator_initialize_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }

  /**
   * Starts orchestration services
   */
  private startOrchestration(): void {
    this.orchestrationTimer = setInterval(async () => {
      try {
        await this.performOrchestration();
      } catch (error) {
        console.error('Orchestration failed:', error);
      }
    }, IntegrationOrchestrator.ORCHESTRATION_INTERVAL);
  }

  /**
   * Starts health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, IntegrationOrchestrator.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Performs orchestration of all services
   */
  private async performOrchestration(): Promise<void> {
    try {
      const integrations = await integrationService.getAllIntegrations();

      for (const integration of integrations) {
        await this.orchestrateIntegration(integration);
      }

      await comprehensiveLoggingService.debug('system', 'Orchestration cycle completed', {
        operation: 'orchestration_cycle',
        integrationsProcessed: integrations.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Orchestration cycle failed', {
        operation: 'orchestration_cycle_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Orchestrates individual integration
   */
  private async orchestrateIntegration(integration: Integration): Promise<void> {
    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimitingService.checkRateLimit(
        integration.id,
        'orchestration',
        {
          maxRequests: 100,
          windowSize: 60000,
          strategy: 'sliding',
        }
      );

      if (!rateLimitResult.allowed) {
        await comprehensiveLoggingService.warn(
          integration.id,
          'Integration rate limited during orchestration',
          {
            operation: 'orchestration_rate_limited',
            retryAfter: rateLimitResult.retryAfter,
            reason: rateLimitResult.reason,
          }
        );
        return;
      }

      // Perform security checks
      await advancedSecurityService.performSecurityScan();

      // Update performance metrics
      await performanceMonitoringService.collectPerformanceMetrics();

      // Log orchestration activity
      await comprehensiveLoggingService.info(
        integration.id,
        'Integration orchestrated successfully',
        {
          operation: 'orchestration_success',
          rateLimitRemaining: rateLimitResult.remaining,
          timestamp: new Date().toISOString(),
        }
      );
    } catch (error) {
      await comprehensiveLoggingService.error(integration.id, 'Integration orchestration failed', {
        operation: 'orchestration_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Performs health check on all services
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus = {
        integrationService: await this.checkServiceHealth('integrationService'),
        rateLimitingService: await this.checkServiceHealth('rateLimitingService'),
        performanceMonitoringService: await this.checkServiceHealth('performanceMonitoringService'),
        comprehensiveLoggingService: await this.checkServiceHealth('comprehensiveLoggingService'),
        advancedSecurityService: await this.checkServiceHealth('advancedSecurityService'),
        productionQualityValidationService: await this.checkServiceHealth(
          'productionQualityValidationService'
        ),
        monitoringService: await this.checkServiceHealth('monitoringService'),
      };

      const healthyServices = Object.values(healthStatus).filter((status) => status.healthy).length;
      const totalServices = Object.keys(healthStatus).length;
      const overallHealth = healthyServices / totalServices;

      if (overallHealth < 0.8) {
        await comprehensiveLoggingService.error('system', 'System health degraded', {
          operation: 'health_check_degraded',
          overallHealth: Math.round(overallHealth * 100),
          healthyServices,
          totalServices,
          healthStatus,
        });
      } else {
        await comprehensiveLoggingService.debug('system', 'System health check passed', {
          operation: 'health_check_passed',
          overallHealth: Math.round(overallHealth * 100),
          healthyServices,
          totalServices,
        });
      }
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Health check failed', {
        operation: 'health_check_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Checks health of individual service
   */
  private async checkServiceHealth(serviceName: string): Promise<{
    healthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      switch (serviceName) {
        case 'integrationService':
          // Check if integration service is responsive
          await integrationService.getAllIntegrations();
          break;

        case 'rateLimitingService':
          // Check if rate limiting service is responsive
          rateLimitingService.getRateLimitStats();
          break;

        case 'performanceMonitoringService':
          // Check if performance monitoring service is responsive
          await performanceMonitoringService.getPerformanceSummary();
          break;

        case 'comprehensiveLoggingService':
          // Check if logging service is responsive
          comprehensiveLoggingService.getLoggingStats();
          break;

        case 'advancedSecurityService':
          // Check if security service is responsive
          advancedSecurityService.getSecuritySummary();
          break;

        case 'productionQualityValidationService':
          // Check if validation service is responsive
          await productionQualityValidationService.validateProductionReadiness();
          break;

        case 'monitoringService':
          // Check if monitoring service is responsive
          await monitoringService.getDashboardSummary();
          break;

        default:
          throw new Error(`Unknown service: ${serviceName}`);
      }

      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Gets system status
   */
  async getSystemStatus(): Promise<{
    isInitialized: boolean;
    services: {
      integrationService: boolean;
      rateLimitingService: boolean;
      performanceMonitoringService: boolean;
      comprehensiveLoggingService: boolean;
      advancedSecurityService: boolean;
      productionQualityValidationService: boolean;
      monitoringService: boolean;
    };
    health: {
      overall: number;
      details: Record<string, any>;
    };
    performance: {
      responseTime: number;
      throughput: number;
      errorRate: number;
    };
  }> {
    try {
      const healthStatus = {
        integrationService: (await this.checkServiceHealth('integrationService')).healthy,
        rateLimitingService: (await this.checkServiceHealth('rateLimitingService')).healthy,
        performanceMonitoringService: (
          await this.checkServiceHealth('performanceMonitoringService')
        ).healthy,
        comprehensiveLoggingService: (await this.checkServiceHealth('comprehensiveLoggingService'))
          .healthy,
        advancedSecurityService: (await this.checkServiceHealth('advancedSecurityService')).healthy,
        productionQualityValidationService: (
          await this.checkServiceHealth('productionQualityValidationService')
        ).healthy,
        monitoringService: (await this.checkServiceHealth('monitoringService')).healthy,
      };

      const healthyServices = Object.values(healthStatus).filter((status) => status).length;
      const totalServices = Object.keys(healthStatus).length;
      const overallHealth = healthyServices / totalServices;

      const performanceSummary = await performanceMonitoringService.getPerformanceSummary();
      const securitySummary = advancedSecurityService.getSecuritySummary();

      return {
        isInitialized: this.isInitialized,
        services: healthStatus,
        health: {
          overall: Math.round(overallHealth * 100),
          details: {
            performance: performanceSummary,
            security: securitySummary,
          },
        },
        performance: {
          responseTime: performanceSummary.avgResponseTime,
          throughput: performanceSummary.totalRequests,
          errorRate: 100 - performanceSummary.successRate,
        },
      };
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Failed to get system status', {
        operation: 'get_system_status_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Validates production readiness
   */
  async validateProductionReadiness(): Promise<any> {
    try {
      await comprehensiveLoggingService.info('system', 'Starting production readiness validation', {
        operation: 'production_readiness_validation',
      });

      const validationResult =
        await productionQualityValidationService.validateProductionReadiness();

      await comprehensiveLoggingService.info(
        'system',
        `Production readiness validation completed: ${validationResult.isProductionReady ? 'READY' : 'NOT READY'}`,
        {
          operation: 'production_readiness_validation_complete',
          isProductionReady: validationResult.isProductionReady,
          overallScore: validationResult.overallScore,
          passedValidations: validationResult.passedValidations,
          totalValidations: validationResult.totalValidations,
        }
      );

      return validationResult;
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Production readiness validation failed', {
        operation: 'production_readiness_validation_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Optimizes system performance
   */
  async optimizeSystemPerformance(): Promise<{
    optimizations: string[];
    performanceGain: number;
    recommendations: string[];
  }> {
    try {
      await comprehensiveLoggingService.info('system', 'Starting system performance optimization', {
        operation: 'performance_optimization',
      });

      const integrations = await integrationService.getAllIntegrations();
      const optimizationResults = await Promise.allSettled(
        integrations.map((integration) =>
          performanceMonitoringService.optimizeIntegrationPerformance(integration.id)
        )
      );

      const successfulOptimizations = optimizationResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<any>).value);

      const totalOptimizations = successfulOptimizations.flatMap((result) => result.optimizations);
      const totalPerformanceGain = successfulOptimizations.reduce(
        (sum, result) => sum + result.performanceGain,
        0
      );
      const allRecommendations = successfulOptimizations.flatMap(
        (result) => result.recommendations
      );

      await comprehensiveLoggingService.info(
        'system',
        'System performance optimization completed',
        {
          operation: 'performance_optimization_complete',
          integrationsOptimized: successfulOptimizations.length,
          totalOptimizations: totalOptimizations.length,
          totalPerformanceGain,
          recommendations: allRecommendations.length,
        }
      );

      return {
        optimizations: totalOptimizations,
        performanceGain: totalPerformanceGain,
        recommendations: allRecommendations,
      };
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'System performance optimization failed', {
        operation: 'performance_optimization_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Performs security audit
   */
  async performSecurityAudit(): Promise<{
    securityScore: number;
    vulnerabilities: string[];
    recommendations: string[];
    incidents: number;
  }> {
    try {
      await comprehensiveLoggingService.info('system', 'Starting security audit', {
        operation: 'security_audit',
      });

      const securitySummary = advancedSecurityService.getSecuritySummary();

      await advancedSecurityService.performSecurityScan();
      await advancedSecurityService.performVulnerabilityScan();
      await advancedSecurityService.performComplianceCheck();

      const integrations = await integrationService.getAllIntegrations();
      let totalIncidents = 0;

      for (const integration of integrations) {
        const incidents = advancedSecurityService.getSecurityIncidents(integration.id);
        totalIncidents += incidents.length;
      }

      await comprehensiveLoggingService.info('system', 'Security audit completed', {
        operation: 'security_audit_complete',
        securityScore: securitySummary.complianceScore,
        totalIncidents,
        vulnerabilities: securitySummary.vulnerabilityCount,
      });

      return {
        securityScore: securitySummary.complianceScore,
        vulnerabilities: [`${securitySummary.vulnerabilityCount} vulnerabilities found`],
        recommendations: ['Review and address all security issues'],
        incidents: totalIncidents,
      };
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Security audit failed', {
        operation: 'security_audit_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Gets comprehensive system report
   */
  async getSystemReport(): Promise<{
    status: any;
    performance: any;
    security: any;
    quality: any;
    recommendations: string[];
  }> {
    try {
      await comprehensiveLoggingService.info('system', 'Generating comprehensive system report', {
        operation: 'system_report_generation',
      });

      const [status, performanceOptimization, securityAudit, qualityValidation] =
        await Promise.allSettled([
          this.getSystemStatus(),
          this.optimizeSystemPerformance(),
          this.performSecurityAudit(),
          this.validateProductionReadiness(),
        ]);

      const systemStatus = status.status === 'fulfilled' ? status.value : null;
      const performance =
        performanceOptimization.status === 'fulfilled' ? performanceOptimization.value : null;
      const security = securityAudit.status === 'fulfilled' ? securityAudit.value : null;
      const quality = qualityValidation.status === 'fulfilled' ? qualityValidation.value : null;

      const recommendations: string[] = [];

      if (performance) {
        recommendations.push(...performance.recommendations);
      }

      if (security) {
        recommendations.push(...security.recommendations);
      }

      if (quality) {
        recommendations.push(...quality.recommendations);
      }

      await comprehensiveLoggingService.info('system', 'Comprehensive system report generated', {
        operation: 'system_report_complete',
        statusHealthy: systemStatus?.health.overall || 0,
        performanceGain: performance?.performanceGain || 0,
        securityScore: security?.securityScore || 0,
        qualityScore: quality?.overallScore || 0,
        totalRecommendations: recommendations.length,
      });

      return {
        status: systemStatus,
        performance,
        security,
        quality,
        recommendations: [...new Set(recommendations)], // Remove duplicates
      };
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Failed to generate system report', {
        operation: 'system_report_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Shuts down the orchestrator
   */
  async shutdown(): Promise<void> {
    try {
      await comprehensiveLoggingService.info('system', 'Shutting down Integration Orchestrator', {
        operation: 'orchestrator_shutdown',
      });

      // Stop timers
      if (this.orchestrationTimer) {
        clearInterval(this.orchestrationTimer);
        this.orchestrationTimer = null;
      }

      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }

      // Stop individual services
      performanceMonitoringService.stopMonitoring();
      advancedSecurityService.stopMonitoring();

      this.isInitialized = false;

      await comprehensiveLoggingService.info(
        'system',
        'Integration Orchestrator shutdown completed',
        { operation: 'orchestrator_shutdown_complete' }
      );
    } catch (error) {
      await comprehensiveLoggingService.error('system', 'Error during orchestrator shutdown', {
        operation: 'orchestrator_shutdown_error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Export singleton instance
export const integrationOrchestrator = new IntegrationOrchestrator();
