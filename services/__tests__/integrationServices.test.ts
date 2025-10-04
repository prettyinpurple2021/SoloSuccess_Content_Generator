/**
 * Integration Services Test Suite
 * 
 * This comprehensive test suite validates all integration services
 * to ensure production quality and reliability.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock Supabase service
const mockSupabaseService = {
  getIntegrations: jest.fn(),
  getIntegrationById: jest.fn(),
  createIntegration: jest.fn(),
  updateIntegration: jest.fn(),
  deleteIntegration: jest.fn(),
  testConnection: jest.fn(),
  syncIntegration: jest.fn(),
  getIntegrationMetrics: jest.fn(),
  getIntegrationLogs: jest.fn(),
  getIntegrationAlerts: jest.fn(),
  createAlert: jest.fn(),
  logEvent: jest.fn(),
  updateMetrics: jest.fn(),
  getHealthScore: jest.fn(),
  getDashboardSummary: jest.fn(),
  addIntegrationLog: jest.fn(),
  getWebhooks: jest.fn(),
  addWebhook: jest.fn(),
  updateWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
      })),
      removeChannel: jest.fn()
    }))
  }
};

// Mock crypto for credential encryption
const mockCrypto = {
  getRandomValues: jest.fn(),
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn()
  }
};

// Mock WebSocket
const mockWebSocket = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  readyState: 1,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock environment
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

describe('Integration Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global objects
    global.crypto = mockCrypto as any;
    global.WebSocket = mockWebSocket as any;
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CredentialEncryption', () => {
    it('should encrypt credentials successfully', async () => {
      const mockCredentials = { apiKey: 'test-key', secret: 'test-secret' };
      const mockUserKey = 'test-user-key';
      
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));

      // Dynamic import to avoid module loading issues
      const { CredentialEncryption } = await import('../credentialEncryption');
      
      const result = await CredentialEncryption.encrypt(mockCredentials, mockUserKey);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
    });

    it('should decrypt credentials successfully', async () => {
      const mockEncryptedCredentials = {
        data: 'encrypted-data',
        iv: 'initialization-vector',
        authTag: 'auth-tag'
      };
      const mockUserKey = 'test-user-key';
      
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');
      mockCrypto.subtle.decrypt.mockResolvedValue(new ArrayBuffer(32));

      const { CredentialEncryption } = await import('../credentialEncryption');
      
      const result = await CredentialEncryption.decrypt(mockEncryptedCredentials, mockUserKey);
      
      expect(result).toBeDefined();
    });

    it('should validate encrypted credentials format', async () => {
      const validCredentials = {
        data: 'encrypted-data',
        iv: 'initialization-vector',
        authTag: 'auth-tag'
      };
      
      const invalidCredentials = {
        data: 'encrypted-data'
        // Missing iv and authTag
      };

      const { CredentialEncryption } = await import('../credentialEncryption');
      
      expect(CredentialEncryption.validateEncryptedCredentials(validCredentials)).toBe(true);
      expect(CredentialEncryption.validateEncryptedCredentials(invalidCredentials)).toBe(false);
    });
  });

  describe('RateLimitingService', () => {
    it('should allow requests within rate limits', async () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      const result = await rateLimitingService.checkRateLimit('test-integration', 'test-action');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should block requests exceeding rate limits', async () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      // Make multiple requests to exceed rate limit
      for (let i = 0; i < 100; i++) {
        await rateLimitingService.checkRateLimit('test-integration', 'test-action');
      }
      
      const result = await rateLimitingService.checkRateLimit('test-integration', 'test-action');
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should adjust rate limits dynamically', async () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      const newConfig = {
        maxRequests: 200,
        windowSize: 120000
      };
      
      await rateLimitingService.adjustRateLimit('test-integration', 'test-action', newConfig);
      
      // Verify the adjustment was applied
      const result = await rateLimitingService.checkRateLimit('test-integration', 'test-action');
      expect(result.allowed).toBe(true);
    });

    it('should clear rate limits correctly', () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      rateLimitingService.clearRateLimits('test-integration');
      
      // Verify rate limits are cleared
      expect(rateLimitingService.getRateLimitStats('test-integration')).toEqual({
        activeLimits: 0,
        totalRequests: 0,
        blockedRequests: 0
      });
    });
  });

  describe('PerformanceMonitoringService', () => {
    it('should record performance metrics', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      const metrics = {
        avgResponseTime: 150,
        successRate: 95,
        errorRate: 5,
        totalRequests: 1000
      };
      
      await performanceMonitoringService.recordMetrics('test-integration', metrics);
      
      const summary = await performanceMonitoringService.getPerformanceSummary();
      expect(summary.totalRequests).toBeGreaterThan(0);
    });

    it('should analyze integration performance', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      // Record some metrics first
      await performanceMonitoringService.recordMetrics('test-integration', {
        avgResponseTime: 150,
        successRate: 95,
        errorRate: 5
      });
      
      const analysis = await performanceMonitoringService.analyzeIntegrationPerformance('test-integration');
      
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.insights).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should get historical performance data', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      const historicalData = performanceMonitoringService.getHistoricalPerformanceData('test-integration');
      
      expect(historicalData).toBeDefined();
    });

    it('should generate global performance report', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      const globalReport = await performanceMonitoringService.getGlobalPerformanceReport();
      
      expect(globalReport.totalIntegrations).toBeGreaterThanOrEqual(0);
      expect(globalReport.avgGlobalResponseTime).toBeGreaterThanOrEqual(0);
      expect(globalReport.avgGlobalSuccessRate).toBeGreaterThanOrEqual(0);
      expect(globalReport.avgGlobalErrorRate).toBeGreaterThanOrEqual(0);
      expect(globalReport.topIssues).toBeInstanceOf(Array);
    });
  });

  describe('ComprehensiveLoggingService', () => {
    it('should log events with different levels', async () => {
      const { comprehensiveLoggingService } = await import('../comprehensiveLoggingService');
      
      await comprehensiveLoggingService.log('test-integration', 'info', 'Test info message');
      await comprehensiveLoggingService.log('test-integration', 'warn', 'Test warning message');
      await comprehensiveLoggingService.log('test-integration', 'error', 'Test error message');
      
      // Verify logging was called (mocked)
      expect(mockSupabaseService.addIntegrationLog).toHaveBeenCalled();
    });

    it('should retrieve logs with filtering', async () => {
      const { comprehensiveLoggingService } = await import('../comprehensiveLoggingService');
      
      const logs = await comprehensiveLoggingService.getLogs('test-integration', {
        level: 'error',
        timeRange: '24h',
        searchQuery: 'test',
        limit: 10,
        offset: 0
      });
      
      expect(logs).toBeInstanceOf(Array);
    });

    it('should subscribe to real-time logs', () => {
      const { comprehensiveLoggingService } = await import('../comprehensiveLoggingService');
      
      const unsubscribe = comprehensiveLoggingService.subscribeToLogs(
        (log) => console.log('New log:', log),
        'test-integration'
      );
      
      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe
      unsubscribe();
    });
  });

  describe('AdvancedSecurityService', () => {
    it('should encrypt credentials securely', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      const credentials = { apiKey: 'test-key' };
      const userId = 'test-user';
      
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      
      const encrypted = await advancedSecurityService.encryptCredentials(credentials, userId);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
    });

    it('should decrypt credentials securely', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      const encryptedCredentials = {
        data: 'encrypted-data',
        iv: 'initialization-vector',
        authTag: 'auth-tag'
      };
      const userId = 'test-user';
      
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');
      mockCrypto.subtle.decrypt.mockResolvedValue(new ArrayBuffer(32));
      
      const decrypted = await advancedSecurityService.decryptCredentials(encryptedCredentials, userId);
      
      expect(decrypted).toBeDefined();
    });

    it('should check access control', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      mockSupabaseService.getIntegrationById.mockResolvedValue({
        id: 'test-integration',
        userId: 'test-user'
      });
      
      const hasAccess = await advancedSecurityService.checkAccessControl(
        'test-user',
        'test-integration',
        'read'
      );
      
      expect(hasAccess).toBe(true);
    });

    it('should log audit events', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      await advancedSecurityService.logAuditEvent(
        'test-user',
        'test-integration',
        'create_integration',
        { details: 'test' }
      );
      
      // Verify audit logging was called
      expect(mockSupabaseService.addIntegrationLog).toHaveBeenCalled();
    });

    it('should perform vulnerability scan', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      mockSupabaseService.getIntegrations.mockResolvedValue([
        { id: 'test-integration', userId: 'test-user' }
      ]);
      
      await advancedSecurityService.performVulnerabilityScan();
      
      // Verify vulnerability scan was performed
      expect(mockSupabaseService.getIntegrations).toHaveBeenCalled();
    });

    it('should get security summary', () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      const summary = advancedSecurityService.getSecuritySummary();
      
      expect(summary).toBeDefined();
      expect(summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(summary.complianceScore).toBeLessThanOrEqual(100);
      expect(summary.vulnerabilityCount).toBeGreaterThanOrEqual(0);
      expect(summary.lastScanDate).toBeDefined();
    });
  });

  describe('ProductionQualityValidationService', () => {
    it('should validate production readiness', async () => {
      const { productionQualityValidationService } = await import('../productionQualityValidationService');
      
      mockSupabaseService.getIntegrationById.mockResolvedValue({
        id: 'test-integration',
        userId: 'test-user',
        isActive: true,
        syncFrequency: 'hourly',
        configuration: {
          errorHandling: { alertOnFailure: true },
          rateLimits: { requestsPerMinute: 60 },
          retryPolicy: { maxRetries: 3 }
        }
      });
      
      const validation = await productionQualityValidationService.validateProductionReadiness('test-integration');
      
      expect(validation).toBeDefined();
      expect(validation.isProductionReady).toBeDefined();
      expect(validation.overallScore).toBeGreaterThanOrEqual(0);
      expect(validation.overallScore).toBeLessThanOrEqual(100);
      expect(validation.passedValidations).toBeGreaterThanOrEqual(0);
      expect(validation.totalValidations).toBeGreaterThanOrEqual(0);
      expect(validation.recommendations).toBeInstanceOf(Array);
    });

    it('should generate quality report', async () => {
      const { productionQualityValidationService } = await import('../productionQualityValidationService');
      
      const report = await productionQualityValidationService.generateQualityReport();
      
      expect(report).toBeDefined();
      expect(report.overallQualityScore).toBeGreaterThanOrEqual(0);
      expect(report.overallQualityScore).toBeLessThanOrEqual(100);
      expect(report.integrationReports).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should validate integration quality', async () => {
      const { productionQualityValidationService } = await import('../productionQualityValidationService');
      
      mockSupabaseService.getIntegrationById.mockResolvedValue({
        id: 'test-integration',
        userId: 'test-user'
      });
      
      const quality = await productionQualityValidationService.validateIntegrationQuality('test-integration');
      
      expect(quality).toBeDefined();
      expect(quality.qualityScore).toBeGreaterThanOrEqual(0);
      expect(quality.qualityScore).toBeLessThanOrEqual(100);
      expect(quality.issues).toBeInstanceOf(Array);
      expect(quality.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('IntegrationOrchestrator', () => {
    it('should initialize successfully', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = await integrationOrchestrator.getSystemStatus();
      
      expect(status).toBeDefined();
      expect(status.isInitialized).toBe(true);
      expect(status.services).toBeDefined();
      expect(status.health).toBeDefined();
      expect(status.performance).toBeDefined();
    });

    it('should validate production readiness', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      const validation = await integrationOrchestrator.validateProductionReadiness();
      
      expect(validation).toBeDefined();
      expect(validation.isProductionReady).toBeDefined();
      expect(validation.overallScore).toBeGreaterThanOrEqual(0);
      expect(validation.overallScore).toBeLessThanOrEqual(100);
    });

    it('should optimize system performance', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      const optimization = await integrationOrchestrator.optimizeSystemPerformance();
      
      expect(optimization).toBeDefined();
      expect(optimization.optimizations).toBeInstanceOf(Array);
      expect(optimization.performanceGain).toBeGreaterThanOrEqual(0);
      expect(optimization.recommendations).toBeInstanceOf(Array);
    });

    it('should perform security audit', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      const audit = await integrationOrchestrator.performSecurityAudit();
      
      expect(audit).toBeDefined();
      expect(audit.securityScore).toBeGreaterThanOrEqual(0);
      expect(audit.securityScore).toBeLessThanOrEqual(100);
      expect(audit.vulnerabilities).toBeInstanceOf(Array);
      expect(audit.recommendations).toBeInstanceOf(Array);
      expect(audit.incidents).toBeGreaterThanOrEqual(0);
    });

    it('should generate system report', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      const report = await integrationOrchestrator.getSystemReport();
      
      expect(report).toBeDefined();
      expect(report.status).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.security).toBeDefined();
      expect(report.quality).toBeDefined();
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should shutdown gracefully', async () => {
      const { integrationOrchestrator } = await import('../integrationOrchestrator');
      
      await integrationOrchestrator.shutdown();
      
      // Verify shutdown was successful
      const status = await integrationOrchestrator.getSystemStatus();
      expect(status.isInitialized).toBe(false);
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle encryption errors gracefully', async () => {
      const { CredentialEncryption } = await import('../credentialEncryption');
      
      mockCrypto.subtle.importKey.mockRejectedValue(new Error('Crypto error'));
      
      await expect(
        CredentialEncryption.encrypt({ apiKey: 'test' }, 'user-key')
      ).rejects.toThrow();
    });

    it('should handle rate limiting errors gracefully', async () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      // Test with invalid parameters
      await expect(
        rateLimitingService.checkRateLimit('', '')
      ).rejects.toThrow();
    });

    it('should handle monitoring errors gracefully', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      // Test with invalid integration ID
      const analysis = await performanceMonitoringService.analyzeIntegrationPerformance('');
      
      expect(analysis.overallScore).toBe(0);
      expect(analysis.insights).toContain('No sufficient performance data available for analysis.');
    });

    it('should handle security errors gracefully', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      mockSupabaseService.getIntegrationById.mockRejectedValue(new Error('Database error'));
      
      const hasAccess = await advancedSecurityService.checkAccessControl(
        'test-user',
        'nonexistent-integration',
        'read'
      );
      
      expect(hasAccess).toBe(false);
    });
  });

  describe('Integration Performance', () => {
    it('should handle high load scenarios', async () => {
      const { rateLimitingService } = await import('../rateLimitingService');
      
      // Simulate high load
      const promises = Array.from({ length: 100 }, (_, i) =>
        rateLimitingService.checkRateLimit(`integration-${i}`, 'test-action')
      );
      
      const results = await Promise.allSettled(promises);
      
      // Verify all requests were handled
      expect(results).toHaveLength(100);
      
      // Verify some requests were allowed
      const allowedRequests = results.filter(result => 
        result.status === 'fulfilled' && result.value.allowed
      );
      
      expect(allowedRequests.length).toBeGreaterThan(0);
    });

    it('should handle concurrent operations', async () => {
      const { performanceMonitoringService } = await import('../performanceMonitoringService');
      
      // Simulate concurrent metric recording
      const promises = Array.from({ length: 50 }, (_, i) =>
        performanceMonitoringService.recordMetrics(`integration-${i}`, {
          avgResponseTime: 100 + i,
          successRate: 95,
          errorRate: 5
        })
      );
      
      const results = await Promise.allSettled(promises);
      
      // Verify all operations completed
      expect(results).toHaveLength(50);
      
      // Verify no errors occurred
      const errors = results.filter(result => result.status === 'rejected');
      expect(errors).toHaveLength(0);
    });
  });

  describe('Integration Security', () => {
    it('should prevent credential exposure', async () => {
      const { CredentialEncryption } = await import('../credentialEncryption');
      
      const credentials = { apiKey: 'sensitive-key' };
      const userKey = 'user-key';
      
      mockCrypto.getRandomValues.mockReturnValue(new Uint8Array(16));
      mockCrypto.subtle.importKey.mockResolvedValue('mock-key');
      mockCrypto.subtle.deriveKey.mockResolvedValue('mock-derived-key');
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(32));
      
      const encrypted = await CredentialEncryption.encrypt(credentials, userKey);
      
      // Verify credentials are encrypted
      expect(encrypted.data).not.toContain('sensitive-key');
      expect(encrypted.data).not.toContain('apiKey');
    });

    it('should validate access permissions', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      mockSupabaseService.getIntegrationById.mockResolvedValue({
        id: 'test-integration',
        userId: 'owner-user'
      });
      
      // Test with wrong user
      const hasAccess = await advancedSecurityService.checkAccessControl(
        'wrong-user',
        'test-integration',
        'read'
      );
      
      expect(hasAccess).toBe(false);
    });

    it('should detect security vulnerabilities', async () => {
      const { advancedSecurityService } = await import('../advancedSecurityService');
      
      mockSupabaseService.getIntegrations.mockResolvedValue([
        {
          id: 'vulnerable-integration',
          userId: 'test-user',
          credentials: { data: 'weak-encryption' }, // Weak encryption
          configuration: {
            errorHandling: { maxRetries: 10 } // Excessive retries
          }
        }
      ]);
      
      await advancedSecurityService.performVulnerabilityScan();
      
      // Verify vulnerability scan was performed
      expect(mockSupabaseService.getIntegrations).toHaveBeenCalled();
    });
  });
});
