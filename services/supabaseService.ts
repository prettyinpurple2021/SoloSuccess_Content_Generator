import { Pool } from 'postgres';
import {
  DatabasePost,
  Post,
  BrandVoice,
  DatabaseBrandVoice,
  AudienceProfile,
  DatabaseAudienceProfile,
  Campaign,
  DatabaseCampaign,
  ContentSeries,
  DatabaseContentSeries,
  ContentTemplate,
  DatabaseContentTemplate,
  ImageStyle,
  DatabaseImageStyle,
  AnalyticsData,
  DatabaseAnalyticsData,
  PerformanceReport,
  EngagementData,
  Integration,
  DatabaseIntegration,
  IntegrationLog,
  DatabaseIntegrationLog,
  IntegrationAlert,
  DatabaseIntegrationAlert,
  IntegrationMetrics,
  WebhookConfig,
} from '../types';
import { contentCache, paginationCache, PaginationCache } from './cachingService';

// Neon database configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL environment variable. Please check your .env.local file.');
}

// Create connection pool
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Auth functions (using Stack Auth)
export const auth = {
  // Get current user from Stack Auth
  getUser: async (): Promise<any> => {
    // This will be handled by Stack Auth on the frontend
    // The user context will be passed down from the Stack Auth provider
    return null; // Placeholder - actual implementation depends on Stack Auth integration
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: any) => void) => {
    // This will be handled by Stack Auth on the frontend
    return () => {}; // Placeholder
  },

  // Sign out
  signOut: async () => {
    // This will be handled by Stack Auth on the frontend
    return { error: null };
  },
};

// Database functions
export const db = {
  // Get all posts for current user with caching
  getPosts: async (userId?: string): Promise<Post[]> => {
    if (!userId) throw new Error('User ID is required');

    return await contentCache.cacheUserPosts(userId, async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          SELECT * FROM posts 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `,
          [userId]
        );

        return result.rows.map(transformDatabasePostToPost);
      } finally {
        client.release();
      }
    });
  },

  // Get paginated posts for better performance with large datasets
  getPostsPaginated: async (
    userId: string,
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      status?: string;
      campaignId?: string;
      seriesId?: string;
    }
  ): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> => {
    const cacheKey = PaginationCache.generateKey(`posts:${userId}`, filters);

    // Try to get from pagination cache first
    const cached = paginationCache.get(cacheKey, page, pageSize);
    if (cached !== null) {
      return {
        posts: cached.data,
        totalCount: cached.totalCount,
        hasMore: page * pageSize < cached.totalCount,
      };
    }

    const client = await pool.connect();
    try {
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filters?.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      if (filters?.campaignId) {
        whereClause += ` AND campaign_id = $${paramIndex}`;
        params.push(filters.campaignId);
        paramIndex++;
      }
      if (filters?.seriesId) {
        whereClause += ` AND series_id = $${paramIndex}`;
        params.push(filters.seriesId);
        paramIndex++;
      }

      // Get total count
      const countResult = await client.query(
        `
        SELECT COUNT(*) FROM posts ${whereClause}
      `,
        params
      );
      const totalCount = parseInt(countResult.rows[0].count);

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const result = await client.query(
        `
        SELECT * FROM posts 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `,
        [...params, pageSize, offset]
      );

      const posts = result.rows.map(transformDatabasePostToPost);

      // Cache the full result set for this filter combination
      if (page === 1) {
        // For first page, fetch more data to cache
        const { rows: fullData } = await client.query(
          `
          SELECT * FROM posts 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${paramIndex + 2}
        `,
          [...params, Math.min(1000, totalCount)]
        );

        const fullPosts = fullData.map(transformDatabasePostToPost);
        paginationCache.set(cacheKey, fullPosts, totalCount);
      }

      return {
        posts,
        totalCount,
        hasMore: page * pageSize < totalCount,
      };
    } finally {
      client.release();
    }
  },

  // Add new post
  addPost: async (
    post: Omit<DatabasePost, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ): Promise<Post> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO posts (
          user_id, topic, idea, content, status, tags, summary, headlines,
          social_media_posts, social_media_tones, social_media_audiences,
          selected_image, schedule_date, brand_voice_id, audience_profile_id,
          campaign_id, series_id, template_id, performance_score,
          optimization_suggestions, image_style_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *
      `,
        [
          userId,
          post.topic,
          post.idea,
          post.content,
          post.status,
          post.tags,
          post.summary,
          post.headlines,
          JSON.stringify(post.social_media_posts),
          JSON.stringify(post.social_media_tones),
          JSON.stringify(post.social_media_audiences),
          post.selected_image,
          post.schedule_date,
          post.brand_voice_id,
          post.audience_profile_id,
          post.campaign_id,
          post.series_id,
          post.template_id,
          post.performance_score,
          JSON.stringify(post.optimization_suggestions),
          post.image_style_id,
        ]
      );

      // Invalidate user cache after adding post
      contentCache.invalidateUserCache(userId);

      return transformDatabasePostToPost(result.rows[0]);
    } finally {
      client.release();
    }
  },

  // Update post
  updatePost: async (
    id: string,
    updates: Partial<Omit<DatabasePost, 'id' | 'user_id'>>,
    userId: string
  ): Promise<Post> => {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE posts 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Post not found or access denied');
      }

      // Invalidate related caches
      contentCache.invalidateUserCache(userId);
      contentCache.invalidatePostCache(id);

      return transformDatabasePostToPost(result.rows[0]);
    } finally {
      client.release();
    }
  },

  // Delete post
  deletePost: async (id: string, userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM posts 
        WHERE id = $1 AND user_id = $2
      `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Post not found or access denied');
      }

      // Invalidate related caches
      contentCache.invalidateUserCache(userId);
      contentCache.invalidatePostCache(id);
    } finally {
      client.release();
    }
  },

  // Brand Voices CRUD operations
  getBrandVoices: async (userId: string): Promise<BrandVoice[]> => {
    return await contentCache.cacheBrandVoices(userId, async () => {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          SELECT * FROM brand_voices 
          WHERE user_id = $1 
          ORDER BY created_at DESC
        `,
          [userId]
        );

        return result.rows.map(transformDatabaseBrandVoiceToBrandVoice);
      } finally {
        client.release();
      }
    });
  },

  addBrandVoice: async (
    brandVoice: Omit<DatabaseBrandVoice, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ): Promise<BrandVoice> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO brand_voices (
          user_id, name, tone, vocabulary, writing_style, target_audience, sample_content
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
        [
          userId,
          brandVoice.name,
          brandVoice.tone,
          brandVoice.vocabulary,
          brandVoice.writing_style,
          brandVoice.target_audience,
          brandVoice.sample_content,
        ]
      );

      return transformDatabaseBrandVoiceToBrandVoice(result.rows[0]);
    } finally {
      client.release();
    }
  },

  updateBrandVoice: async (
    id: string,
    updates: Partial<Omit<DatabaseBrandVoice, 'id' | 'user_id'>>,
    userId: string
  ): Promise<BrandVoice> => {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE brand_voices 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Brand voice not found or access denied');
      }

      return transformDatabaseBrandVoiceToBrandVoice(result.rows[0]);
    } finally {
      client.release();
    }
  },

  deleteBrandVoice: async (id: string, userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM brand_voices 
        WHERE id = $1 AND user_id = $2
      `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Brand voice not found or access denied');
      }
    } finally {
      client.release();
    }
  },

  // Audience Profiles CRUD operations
  getAudienceProfiles: async (userId: string): Promise<AudienceProfile[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT * FROM audience_profiles 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `,
        [userId]
      );

      return result.rows.map(transformDatabaseAudienceProfileToAudienceProfile);
    } finally {
      client.release();
    }
  },

  addAudienceProfile: async (
    profile: Omit<DatabaseAudienceProfile, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ): Promise<AudienceProfile> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO audience_profiles (
          user_id, name, age_range, industry, interests, pain_points, 
          preferred_content_types, engagement_patterns
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          userId,
          profile.name,
          profile.age_range,
          profile.industry,
          JSON.stringify(profile.interests),
          JSON.stringify(profile.pain_points),
          JSON.stringify(profile.preferred_content_types),
          JSON.stringify(profile.engagement_patterns),
        ]
      );

      return transformDatabaseAudienceProfileToAudienceProfile(result.rows[0]);
    } finally {
      client.release();
    }
  },

  updateAudienceProfile: async (
    id: string,
    updates: Partial<Omit<DatabaseAudienceProfile, 'id' | 'user_id'>>,
    userId: string
  ): Promise<AudienceProfile> => {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE audience_profiles 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Audience profile not found or access denied');
      }

      return transformDatabaseAudienceProfileToAudienceProfile(result.rows[0]);
    } finally {
      client.release();
    }
  },

  deleteAudienceProfile: async (id: string, userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM audience_profiles 
        WHERE id = $1 AND user_id = $2
      `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Audience profile not found or access denied');
      }
    } finally {
      client.release();
    }
  },

  // Campaigns CRUD operations
  getCampaigns: async (userId: string): Promise<Campaign[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT * FROM campaigns 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `,
        [userId]
      );

      return result.rows.map(transformDatabaseCampaignToCampaign);
    } finally {
      client.release();
    }
  },

  addCampaign: async (
    campaign: Omit<DatabaseCampaign, 'id' | 'user_id' | 'created_at'>,
    userId: string
  ): Promise<Campaign> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO campaigns (
          user_id, name, description, theme, start_date, end_date, platforms, status, performance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
        [
          userId,
          campaign.name,
          campaign.description,
          campaign.theme,
          campaign.start_date,
          campaign.end_date,
          JSON.stringify(campaign.platforms),
          campaign.status,
          JSON.stringify(campaign.performance),
        ]
      );

      return transformDatabaseCampaignToCampaign(result.rows[0]);
    } finally {
      client.release();
    }
  },

  updateCampaign: async (
    id: string,
    updates: Partial<Omit<DatabaseCampaign, 'id' | 'user_id'>>,
    userId: string
  ): Promise<Campaign> => {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE campaigns 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Campaign not found or access denied');
      }

      return transformDatabaseCampaignToCampaign(result.rows[0]);
    } finally {
      client.release();
    }
  },

  deleteCampaign: async (id: string, userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM campaigns 
        WHERE id = $1 AND user_id = $2
      `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Campaign not found or access denied');
      }
    } finally {
      client.release();
    }
  },

  // Integration Alerts Operations
  getIntegrationAlerts: async (
    integrationId: string,
    includeResolved: boolean = false
  ): Promise<IntegrationAlert[]> => {
    const client = await pool.connect();
    try {
      let query = `
        SELECT * FROM integration_alerts 
        WHERE integration_id = $1
      `;
      const params = [integrationId];

      if (!includeResolved) {
        query += ` AND is_resolved = false`;
      }

      query += ` ORDER BY created_at DESC`;

      const result = await client.query(query, params);
      return result.rows.map(transformDatabaseIntegrationAlertToIntegrationAlert);
    } finally {
      client.release();
    }
  },

  // Integration Logs Operations
  getIntegrationLogs: async (
    integrationId: string,
    limit: number = 100
  ): Promise<IntegrationLog[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT * FROM integration_logs 
        WHERE integration_id = $1
        ORDER BY timestamp DESC
        LIMIT $2
      `,
        [integrationId, limit]
      );

      return result.rows.map(transformDatabaseIntegrationLogToIntegrationLog);
    } finally {
      client.release();
    }
  },

  // Analytics Data Operations
  insertPostAnalytics: async (
    analytics: Omit<DatabaseAnalyticsData, 'id' | 'recorded_at'>
  ): Promise<AnalyticsData> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO post_analytics (
          post_id, platform, likes, shares, comments, clicks, impressions, reach
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
        [
          analytics.post_id,
          analytics.platform,
          analytics.likes,
          analytics.shares,
          analytics.comments,
          analytics.clicks,
          analytics.impressions,
          analytics.reach,
        ]
      );

      return transformDatabaseAnalyticsDataToAnalyticsData(result.rows[0]);
    } finally {
      client.release();
    }
  },

  getPostAnalytics: async (postId: string): Promise<AnalyticsData[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT * FROM post_analytics 
        WHERE post_id = $1 
        ORDER BY recorded_at DESC
      `,
        [postId]
      );

      return result.rows.map(transformDatabaseAnalyticsDataToAnalyticsData);
    } finally {
      client.release();
    }
  },

  // Integration Management Operations
  getIntegrations: async (userId: string): Promise<Integration[]> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        SELECT * FROM integrations 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `,
        [userId]
      );

      return result.rows.map(transformDatabaseIntegrationToIntegration);
    } finally {
      client.release();
    }
  },

  addIntegration: async (
    integration: Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    userId: string
  ): Promise<Integration> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        INSERT INTO integrations (
          user_id, name, type, platform, status, credentials, configuration,
          last_sync, sync_frequency, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
        [
          userId,
          integration.name,
          integration.type,
          integration.platform,
          integration.status,
          JSON.stringify(integration.credentials),
          JSON.stringify(integration.configuration),
          integration.last_sync,
          integration.sync_frequency,
          integration.is_active,
        ]
      );

      return transformDatabaseIntegrationToIntegration(result.rows[0]);
    } finally {
      client.release();
    }
  },

  updateIntegration: async (
    id: string,
    updates: Partial<Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at'>>,
    userId: string
  ): Promise<Integration> => {
    const client = await pool.connect();
    try {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No updates provided');
      }

      values.push(id, userId);
      const result = await client.query(
        `
        UPDATE integrations 
        SET ${setClause.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING *
      `,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Integration not found or access denied');
      }

      return transformDatabaseIntegrationToIntegration(result.rows[0]);
    } finally {
      client.release();
    }
  },

  deleteIntegration: async (id: string, userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `
        DELETE FROM integrations 
        WHERE id = $1 AND user_id = $2
      `,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error('Integration not found or access denied');
      }
    } finally {
      client.release();
    }
  },

  // Test connection
  testConnection: async (): Promise<boolean> => {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    } finally {
      client.release();
    }
  },
};

// Helper function to transform database post to app post format
function transformDatabasePostToPost(dbPost: DatabasePost): Post {
  return {
    id: dbPost.id,
    topic: dbPost.topic,
    idea: dbPost.idea,
    content: dbPost.content,
    status: dbPost.status,
    tags: dbPost.tags,
    socialMediaPosts: dbPost.social_media_posts,
    socialMediaTones: dbPost.social_media_tones,
    socialMediaAudiences: dbPost.social_media_audiences,
    scheduleDate: dbPost.schedule_date ? new Date(dbPost.schedule_date) : undefined,
    createdAt: dbPost.created_at ? new Date(dbPost.created_at) : undefined,
    postedAt: dbPost.posted_at ? new Date(dbPost.posted_at) : undefined,
    selectedImage: dbPost.selected_image,
    summary: dbPost.summary,
    headlines: dbPost.headlines,
    brandVoiceId: dbPost.brand_voice_id,
    audienceProfileId: dbPost.audience_profile_id,
    campaignId: dbPost.campaign_id,
    seriesId: dbPost.series_id,
    templateId: dbPost.template_id,
    performanceScore: dbPost.performance_score,
    optimizationSuggestions: dbPost.optimization_suggestions,
    imageStyleId: dbPost.image_style_id,
  };
}

// Helper functions for Brand Voice transformations
function transformDatabaseBrandVoiceToBrandVoice(dbBrandVoice: DatabaseBrandVoice): BrandVoice {
  return {
    id: dbBrandVoice.id,
    userId: dbBrandVoice.user_id,
    name: dbBrandVoice.name,
    tone: dbBrandVoice.tone,
    vocabulary: dbBrandVoice.vocabulary,
    writingStyle: dbBrandVoice.writing_style,
    targetAudience: dbBrandVoice.target_audience,
    sampleContent: dbBrandVoice.sample_content,
    createdAt: new Date(dbBrandVoice.created_at),
  };
}

// Helper functions for Audience Profile transformations
function transformDatabaseAudienceProfileToAudienceProfile(
  dbProfile: DatabaseAudienceProfile
): AudienceProfile {
  return {
    id: dbProfile.id,
    userId: dbProfile.user_id,
    name: dbProfile.name,
    ageRange: dbProfile.age_range,
    industry: dbProfile.industry,
    interests: dbProfile.interests,
    painPoints: dbProfile.pain_points,
    preferredContentTypes: dbProfile.preferred_content_types,
    engagementPatterns: dbProfile.engagement_patterns,
    createdAt: new Date(dbProfile.created_at),
  };
}

// Helper functions for Campaign transformations
function transformDatabaseCampaignToCampaign(dbCampaign: DatabaseCampaign): Campaign {
  return {
    id: dbCampaign.id,
    userId: dbCampaign.user_id,
    name: dbCampaign.name,
    description: dbCampaign.description,
    theme: dbCampaign.theme,
    startDate: new Date(dbCampaign.start_date),
    endDate: new Date(dbCampaign.end_date),
    posts: [], // Will be populated by joining with posts table
    platforms: dbCampaign.platforms,
    status: dbCampaign.status,
    performance: dbCampaign.performance,
    createdAt: new Date(dbCampaign.created_at),
  };
}

// Helper functions for Integration transformations
function transformDatabaseIntegrationToIntegration(
  dbIntegration: DatabaseIntegration
): Integration {
  return {
    id: dbIntegration.id,
    userId: dbIntegration.user_id,
    name: dbIntegration.name,
    type: dbIntegration.type,
    platform: dbIntegration.platform,
    status: dbIntegration.status,
    credentials: dbIntegration.credentials,
    configuration: dbIntegration.configuration,
    lastSync: dbIntegration.last_sync ? new Date(dbIntegration.last_sync) : undefined,
    syncFrequency: dbIntegration.sync_frequency,
    isActive: dbIntegration.is_active,
    createdAt: new Date(dbIntegration.created_at),
    updatedAt: new Date(dbIntegration.updated_at),
  };
}

// Helper functions for Analytics Data transformations
function transformDatabaseAnalyticsDataToAnalyticsData(
  dbAnalytics: DatabaseAnalyticsData
): AnalyticsData {
  return {
    id: dbAnalytics.id,
    postId: dbAnalytics.post_id,
    platform: dbAnalytics.platform,
    likes: dbAnalytics.likes,
    shares: dbAnalytics.shares,
    comments: dbAnalytics.comments,
    clicks: dbAnalytics.clicks,
    impressions: dbAnalytics.impressions,
    reach: dbAnalytics.reach,
    recordedAt: new Date(dbAnalytics.recorded_at),
  };
}

// Helper functions for Integration Alert transformations
function transformDatabaseIntegrationAlertToIntegrationAlert(
  dbAlert: DatabaseIntegrationAlert
): IntegrationAlert {
  return {
    id: dbAlert.id,
    integrationId: dbAlert.integration_id,
    type: dbAlert.type,
    title: dbAlert.title,
    message: dbAlert.message,
    severity: dbAlert.severity,
    isResolved: dbAlert.is_resolved,
    resolvedAt: dbAlert.resolved_at ? new Date(dbAlert.resolved_at) : undefined,
    createdAt: new Date(dbAlert.created_at),
    metadata: dbAlert.metadata,
  };
}

// Helper functions for Integration Log transformations
function transformDatabaseIntegrationLogToIntegrationLog(
  dbLog: DatabaseIntegrationLog
): IntegrationLog {
  return {
    id: dbLog.id,
    integrationId: dbLog.integration_id,
    level: dbLog.level,
    message: dbLog.message,
    metadata: dbLog.metadata,
    timestamp: new Date(dbLog.timestamp),
    userId: dbLog.user_id,
  };
}

// Export for compatibility
export const supabaseService = db;
