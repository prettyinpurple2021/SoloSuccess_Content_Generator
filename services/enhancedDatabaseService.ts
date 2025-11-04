/**
 * Enhanced database service with comprehensive error handling and recovery
 * Wraps the existing database service with production-grade error management
 */

import postgres from 'postgres';
import { databaseErrorHandler, DatabaseErrorContext } from './databaseErrorHandler';
import { errorHandler } from './errorHandlingService';
import { db as originalDb } from './neonService';
import {
  Post,
  BrandVoice,
  AudienceProfile,
  Campaign,
  Integration,
  AnalyticsData,
  IntegrationAlert,
  IntegrationLog,
} from '../types';

// Enhanced database configuration with connection pooling and error handling
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable. Please check your .env.local file.');
}

// Create enhanced connection pool with better error handling
const pool = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10, // Increased timeout
  max_lifetime: 60 * 30, // 30 minutes
  onnotice: (notice) => {
    errorHandler.logError(
      `Database notice: ${notice.message}`,
      undefined,
      { operation: 'database_notice' },
      'info'
    );
  },
  onparameter: (key, value) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Database parameter ${key}: ${value}`);
    }
  },
});

// Connection health monitoring
let lastHealthCheck = Date.now();
const healthCheckInterval = 60000; // 1 minute

/**
 * Enhanced database service with error handling and recovery
 */
export class EnhancedDatabaseService {
  private static instance: EnhancedDatabaseService;

  private constructor() {
    this.startConnectionMonitoring();
  }

  static getInstance(): EnhancedDatabaseService {
    if (!EnhancedDatabaseService.instance) {
      EnhancedDatabaseService.instance = new EnhancedDatabaseService();
    }
    return EnhancedDatabaseService.instance;
  }

  /**
   * Posts operations with enhanced error handling
   */
  async getPosts(userId: string): Promise<Post[]> {
    const context: DatabaseErrorContext = {
      operation: 'getPosts',
      userId,
      table: 'posts',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      // Check if we can use cached data during degradation
      try {
        return await originalDb.getPosts(userId);
      } catch (error) {
        // Attempt graceful degradation
        const fallbackData = await this.getCachedPosts(userId);
        if (fallbackData) {
          errorHandler.logError(
            'Using cached posts data due to database error',
            error instanceof Error ? error : new Error(String(error)),
            context,
            'warn'
          );
          return fallbackData;
        }
        throw error;
      }
    }, context);
  }

  async getPostsPaginated(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: { status?: string; campaignId?: string; seriesId?: string }
  ): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> {
    const context: DatabaseErrorContext = {
      operation: 'getPostsPaginated',
      userId,
      table: 'posts',
      metadata: { page, pageSize, filters },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.getPostsPaginated(userId, page, pageSize, filters),
      context
    );
  }

  async addPost(post: any, userId: string): Promise<Post> {
    const context: DatabaseErrorContext = {
      operation: 'addPost',
      userId,
      table: 'posts',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      // Validate data before insertion
      this.validatePostData(post);
      return await originalDb.addPost(post, userId);
    }, context);
  }

  async updatePost(id: string, updates: any, userId: string): Promise<Post> {
    const context: DatabaseErrorContext = {
      operation: 'updatePost',
      userId,
      table: 'posts',
      metadata: { postId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      // Validate updates before applying
      this.validatePostUpdates(updates);
      return await originalDb.updatePost(id, updates, userId);
    }, context);
  }

  async deletePost(id: string, userId: string): Promise<void> {
    const context: DatabaseErrorContext = {
      operation: 'deletePost',
      userId,
      table: 'posts',
      metadata: { postId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.deletePost(id, userId),
      context
    );
  }

  /**
   * Brand Voices operations with enhanced error handling
   */
  async getBrandVoices(userId: string): Promise<BrandVoice[]> {
    const context: DatabaseErrorContext = {
      operation: 'getBrandVoices',
      userId,
      table: 'brand_voices',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      try {
        return await originalDb.getBrandVoices(userId);
      } catch (error) {
        const fallbackData = await this.getCachedBrandVoices(userId);
        if (fallbackData) {
          errorHandler.logError(
            'Using cached brand voices data due to database error',
            error instanceof Error ? error : new Error(String(error)),
            context,
            'warn'
          );
          return fallbackData;
        }
        throw error;
      }
    }, context);
  }

  async addBrandVoice(brandVoice: any, userId: string): Promise<BrandVoice> {
    const context: DatabaseErrorContext = {
      operation: 'addBrandVoice',
      userId,
      table: 'brand_voices',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      this.validateBrandVoiceData(brandVoice);
      return await originalDb.addBrandVoice(brandVoice, userId);
    }, context);
  }

  async updateBrandVoice(id: string, updates: any, userId: string): Promise<BrandVoice> {
    const context: DatabaseErrorContext = {
      operation: 'updateBrandVoice',
      userId,
      table: 'brand_voices',
      metadata: { brandVoiceId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.updateBrandVoice(id, updates, userId),
      context
    );
  }

  async deleteBrandVoice(id: string, userId: string): Promise<void> {
    const context: DatabaseErrorContext = {
      operation: 'deleteBrandVoice',
      userId,
      table: 'brand_voices',
      metadata: { brandVoiceId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.deleteBrandVoice(id, userId),
      context
    );
  }

  /**
   * Audience Profiles operations with enhanced error handling
   */
  async getAudienceProfiles(userId: string): Promise<AudienceProfile[]> {
    const context: DatabaseErrorContext = {
      operation: 'getAudienceProfiles',
      userId,
      table: 'audience_profiles',
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.getAudienceProfiles(userId),
      context
    );
  }

  async addAudienceProfile(profile: any, userId: string): Promise<AudienceProfile> {
    const context: DatabaseErrorContext = {
      operation: 'addAudienceProfile',
      userId,
      table: 'audience_profiles',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      this.validateAudienceProfileData(profile);
      return await originalDb.addAudienceProfile(profile, userId);
    }, context);
  }

  async updateAudienceProfile(id: string, updates: any, userId: string): Promise<AudienceProfile> {
    const context: DatabaseErrorContext = {
      operation: 'updateAudienceProfile',
      userId,
      table: 'audience_profiles',
      metadata: { profileId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.updateAudienceProfile(id, updates, userId),
      context
    );
  }

  async deleteAudienceProfile(id: string, userId: string): Promise<void> {
    const context: DatabaseErrorContext = {
      operation: 'deleteAudienceProfile',
      userId,
      table: 'audience_profiles',
      metadata: { profileId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.deleteAudienceProfile(id, userId),
      context
    );
  }

  /**
   * Integration operations with enhanced error handling
   */
  async getIntegrations(userId: string): Promise<Integration[]> {
    const context: DatabaseErrorContext = {
      operation: 'getIntegrations',
      userId,
      table: 'integrations',
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.getIntegrations(userId),
      context
    );
  }

  async addIntegration(integration: any, userId: string): Promise<Integration> {
    const context: DatabaseErrorContext = {
      operation: 'addIntegration',
      userId,
      table: 'integrations',
    };

    return await databaseErrorHandler.executeWithErrorHandling(async () => {
      this.validateIntegrationData(integration);
      return await originalDb.addIntegration(integration, userId);
    }, context);
  }

  async updateIntegration(id: string, updates: any, userId: string): Promise<Integration> {
    const context: DatabaseErrorContext = {
      operation: 'updateIntegration',
      userId,
      table: 'integrations',
      metadata: { integrationId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.updateIntegration(id, updates, userId),
      context
    );
  }

  async deleteIntegration(id: string, userId: string): Promise<void> {
    const context: DatabaseErrorContext = {
      operation: 'deleteIntegration',
      userId,
      table: 'integrations',
      metadata: { integrationId: id },
    };

    return await databaseErrorHandler.executeWithErrorHandling(
      () => originalDb.deleteIntegration(id, userId),
      context
    );
  }

  /**
   * Database health and monitoring operations
   */
  async testConnection(): Promise<boolean> {
    return await databaseErrorHandler.testConnection(pool);
  }

  async getHealthStatus() {
    return databaseErrorHandler.getHealthStatus();
  }

  async performHealthCheck(): Promise<{
    database: boolean;
    connectionPool: boolean;
    responseTime: number;
    timestamp: Date;
  }> {
    const startTime = Date.now();

    try {
      const dbHealthy = await this.testConnection();
      const responseTime = Date.now() - startTime;

      return {
        database: dbHealthy,
        connectionPool: true, // Assume pool is healthy if we can test
        responseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      errorHandler.logError(
        'Health check failed',
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'health_check' }
      );

      return {
        database: false,
        connectionPool: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Batch operations with transaction support
   */
  async executeBatchOperations<T>(
    operations: (() => Promise<any>)[],
    context: DatabaseErrorContext
  ): Promise<T[]> {
    return await databaseErrorHandler.executeTransaction(
      operations.map((op) => () => op()),
      context
    );
  }

  /**
   * Data validation methods
   */
  private validatePostData(post: any): void {
    if (!post.topic && !post.idea && !post.content) {
      throw new Error('Post must have at least topic, idea, or content');
    }

    if (post.content && post.content.length > 50000) {
      throw new Error('Post content exceeds maximum length');
    }

    if (post.tags && !Array.isArray(post.tags)) {
      throw new Error('Post tags must be an array');
    }
  }

  private validatePostUpdates(updates: any): void {
    if (updates.content && updates.content.length > 50000) {
      throw new Error('Post content exceeds maximum length');
    }

    if (updates.tags && !Array.isArray(updates.tags)) {
      throw new Error('Post tags must be an array');
    }
  }

  private validateBrandVoiceData(brandVoice: any): void {
    if (!brandVoice.name || brandVoice.name.trim().length === 0) {
      throw new Error('Brand voice name is required');
    }

    if (brandVoice.name.length > 100) {
      throw new Error('Brand voice name exceeds maximum length');
    }
  }

  private validateAudienceProfileData(profile: any): void {
    if (!profile.name || profile.name.trim().length === 0) {
      throw new Error('Audience profile name is required');
    }

    if (profile.name.length > 100) {
      throw new Error('Audience profile name exceeds maximum length');
    }
  }

  private validateIntegrationData(integration: any): void {
    if (!integration.name || integration.name.trim().length === 0) {
      throw new Error('Integration name is required');
    }

    if (!integration.type || !integration.platform) {
      throw new Error('Integration type and platform are required');
    }
  }

  /**
   * Fallback data methods for graceful degradation
   */
  private async getCachedPosts(userId: string): Promise<Post[] | null> {
    // In a real implementation, this would check cache storage
    // For now, return null to indicate no cached data
    return null;
  }

  private async getCachedBrandVoices(userId: string): Promise<BrandVoice[] | null> {
    // In a real implementation, this would check cache storage
    return null;
  }

  /**
   * Connection monitoring
   */
  private startConnectionMonitoring(): void {
    setInterval(async () => {
      const now = Date.now();
      if (now - lastHealthCheck >= healthCheckInterval) {
        lastHealthCheck = now;

        try {
          await this.testConnection();
        } catch (error) {
          errorHandler.logError(
            'Periodic connection health check failed',
            error instanceof Error ? error : new Error(String(error)),
            { operation: 'periodic_health_check' },
            'warn'
          );
        }
      }
    }, healthCheckInterval);
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await pool.end();
      errorHandler.logError(
        'Database connection pool closed successfully',
        undefined,
        { operation: 'shutdown' },
        'info'
      );
    } catch (error) {
      errorHandler.logError(
        'Error closing database connection pool',
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'shutdown' }
      );
    }
  }
}

// Export singleton instance
export const enhancedDb = EnhancedDatabaseService.getInstance();

// Export for backward compatibility
export const db = enhancedDb;
