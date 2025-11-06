/**
 * Enhanced Database Compatibility Layer
 * 
 * Provides a unified interface combining high-level database operations
 * from databaseService with health check methods needed by API endpoints.
 * 
 * This file serves as a bridge to avoid circular dependencies and
 * keep server-only code (enhancedDatabaseService) separate from
 * the API layer.
 */

import { db } from './databaseService';

/**
 * Enhanced database interface with both operations and health checks
 */
export const enhancedDb = {
  // High-level database operations from db
  ...db,
  
  // Health check methods with proper return types for API endpoints
  performHealthCheck: async () => {
    // Use the testConnection from db which already exists
    const isConnected = await db.testConnection();
    return {
      database: isConnected,
      connectionPool: { active: 0, idle: 0, total: 0 },
      responseTime: 0,
    };
  },
  
  getHealthStatus: async () => {
    const isHealthy = await db.testConnection();
    return {
      isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      circuitBreakerOpen: false,
      activeTransactions: 0,
    };
  },
};
