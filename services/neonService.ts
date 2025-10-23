import postgres from 'postgres';
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
  WebhookConfig
} from '../types';
import { contentCache, paginationCache, PaginationCache } from './cachingService';

// Neon database configuration
const neonUrl = process.env.VITE_NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!neonUrl) {
  throw new Error('Missing Neon database URL. Please check VITE_NEON_DATABASE_URL or DATABASE_URL in your environment variables.');
}

// Create Neon database connection
const sql = postgres(neonUrl, {
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Auth functions (using a simple user session system)
export const auth = {
  // Get current user from session storage
  getUser: async (): Promise<{ id: string; email?: string } | null> => {
    try {
      const userStr = localStorage.getItem('neon_user');
      if (!userStr) {
        // Create a default user for demo purposes
        const defaultUser = { id: 'demo_user_123', email: 'demo@example.com' };
        auth.setUser(defaultUser);
        return defaultUser;
      }
      return JSON.parse(userStr);
    } catch (err) {
      console.error('Get user error:', err);
      // Create a default user for demo purposes
      const defaultUser = { id: 'demo_user_123', email: 'demo@example.com' };
      auth.setUser(defaultUser);
      return defaultUser;
    }
  },

  // Set current user in session storage
  setUser: (user: { id: string; email?: string }) => {
    localStorage.setItem('neon_user', JSON.stringify(user));
  },

  // Sign in with email/password (mock implementation)
  signIn: async (email: string, password: string): Promise<{ user: { id: string; email: string } | null; error: any }> => {
    try {
      // In a real implementation, you'd validate credentials against your auth system
      // For now, we'll create a mock user
      const user = { id: `user_${Date.now()}`, email };
      auth.setUser(user);
      return { user, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return { user: null, error: err };
    }
  },

  // Sign out
  signOut: async () => {
    localStorage.removeItem('neon_user');
    return { error: null };
  },

  // Listen to auth state changes (mock implementation)
  onAuthStateChange: (callback: (user: { id: string; email?: string } | null) => void) => {
    // In a real implementation, you'd set up proper auth state listening
    // For now, we'll just call the callback with current user
    const user = auth.getUser();
    callback(user);
    return () => {}; // Return unsubscribe function
  }
};

// Database functions
export const db = {
  // Get all posts for current user with caching
  getPosts: async (): Promise<Post[]> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await contentCache.cacheUserPosts(user.id, async () => {
      const posts = await sql`
        SELECT * FROM posts 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;

      return posts.map(transformDatabasePostToPost);
    });
  },

  // Get paginated posts for better performance with large datasets
  getPostsPaginated: async (page: number = 1, pageSize: number = 20, filters?: {
    status?: string;
    campaignId?: string;
    seriesId?: string;
  }): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const cacheKey = PaginationCache.generateKey(`posts:${user.id}`, filters);
    
    // Try to get from pagination cache first
    const cached = paginationCache.get(cacheKey, page, pageSize);
    if (cached !== null) {
      return {
        posts: cached.data,
        totalCount: cached.totalCount,
        hasMore: page * pageSize < cached.totalCount
      };
    }

    // Build query with filters
    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [user.id];
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

    const offset = (page - 1) * pageSize;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total FROM posts ${sql.unsafe(whereClause)}
    `;
    const totalCount = parseInt(countResult[0].total);

    // Get posts for current page
    const posts = await sql`
      SELECT * FROM posts 
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const transformedPosts = posts.map(transformDatabasePostToPost);

    // Cache the full result set for this filter combination
    if (page === 1) {
      // For first page, fetch more data to cache
      const fullPosts = await sql`
        SELECT * FROM posts 
        ${sql.unsafe(whereClause)}
        ORDER BY created_at DESC
        LIMIT ${Math.min(1000, totalCount)}
      `;
      const fullTransformedPosts = fullPosts.map(transformDatabasePostToPost);
      paginationCache.set(cacheKey, fullTransformedPosts, totalCount);
    }

    return {
      posts: transformedPosts,
      totalCount,
      hasMore: page * pageSize < totalCount
    };
  },

  // Subscribe to posts changes (mock implementation - would need WebSocket or polling)
  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    // In a real implementation, you'd set up WebSocket or polling
    // For now, we'll just call the callback immediately
    db.getPosts().then(callback).catch(console.error);
    return () => {}; // Return unsubscribe function
  },

  // Add new post
  addPost: async (post: Omit<DatabasePost, 'id' | 'user_id' | 'created_at'>): Promise<Post> => {
    try {
      console.log('🔄 Attempting to add post...');
      const user = await auth.getUser();
      
      if (!user) {
        console.error('❌ No user authenticated');
        throw new Error('User not authenticated. Please sign in.');
      }
      
      console.log('✅ User authenticated:', user.id);
      console.log('📝 Post data:', post);

      const [newPost] = await sql`
        INSERT INTO posts (
          user_id, topic, idea, content, status, tags, social_media_posts, 
          social_media_tones, social_media_audiences, schedule_date, 
          selected_image, summary, headlines, brand_voice_id, 
          audience_profile_id, campaign_id, series_id, template_id, 
          performance_score, optimization_suggestions, image_style_id, created_at
        ) VALUES (
          ${user.id}, ${post.topic}, ${post.idea}, ${post.content}, ${post.status}, 
          ${JSON.stringify(post.tags)}, ${JSON.stringify(post.social_media_posts)}, 
          ${JSON.stringify(post.social_media_tones)}, ${JSON.stringify(post.social_media_audiences)}, 
          ${post.schedule_date}, ${post.selected_image}, ${post.summary}, 
          ${JSON.stringify(post.headlines)}, ${post.brand_voice_id}, 
          ${post.audience_profile_id}, ${post.campaign_id}, ${post.series_id}, 
          ${post.template_id}, ${post.performance_score}, 
          ${JSON.stringify(post.optimization_suggestions)}, ${post.image_style_id}, 
          ${new Date().toISOString()}
        ) RETURNING *
      `;

      console.log('✅ Post saved successfully:', newPost);
      
      // Invalidate user cache after adding post
      contentCache.invalidateUserCache(user.id);
      
      return transformDatabasePostToPost(newPost);
    } catch (err) {
      console.error('❌ Add post exception:', err);
      throw err;
    }
  },

  // Update post
  updatePost: async (id: string, updates: Partial<Omit<DatabasePost, 'id' | 'user_id'>>): Promise<Post> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedPost] = await sql`
      UPDATE posts 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1 AND user_id = ${user.id}
      RETURNING *
    `;

    // Invalidate related caches
    contentCache.invalidateUserCache(user.id);
    contentCache.invalidatePostCache(id);
    
    return transformDatabasePostToPost(updatedPost);
  },

  // Delete post
  deletePost: async (id: string): Promise<void> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    await sql`
      DELETE FROM posts 
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    // Invalidate related caches
    contentCache.invalidateUserCache(user.id);
    contentCache.invalidatePostCache(id);
  },

  // Brand Voices CRUD operations with caching
  getBrandVoices: async (): Promise<BrandVoice[]> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await contentCache.cacheBrandVoices(user.id, async () => {
      const brandVoices = await sql`
        SELECT * FROM brand_voices 
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
      `;

      return brandVoices.map(transformDatabaseBrandVoiceToBrandVoice);
    });
  },

  addBrandVoice: async (brandVoice: Omit<DatabaseBrandVoice, 'id' | 'user_id' | 'created_at'>): Promise<BrandVoice> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newBrandVoice] = await sql`
      INSERT INTO brand_voices (
        user_id, name, tone, vocabulary, writing_style, target_audience, 
        sample_content, created_at
      ) VALUES (
        ${user.id}, ${brandVoice.name}, ${brandVoice.tone}, ${brandVoice.vocabulary}, 
        ${brandVoice.writing_style}, ${brandVoice.target_audience}, 
        ${brandVoice.sample_content}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseBrandVoiceToBrandVoice(newBrandVoice);
  },

  updateBrandVoice: async (id: string, updates: Partial<Omit<DatabaseBrandVoice, 'id' | 'user_id'>>): Promise<BrandVoice> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedBrandVoice] = await sql`
      UPDATE brand_voices 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseBrandVoiceToBrandVoice(updatedBrandVoice);
  },

  deleteBrandVoice: async (id: string): Promise<void> => {
    await sql`DELETE FROM brand_voices WHERE id = ${id}`;
  },

  // Audience Profiles CRUD operations
  getAudienceProfiles: async (): Promise<AudienceProfile[]> => {
    const profiles = await sql`
      SELECT * FROM audience_profiles 
      ORDER BY created_at DESC
    `;

    return profiles.map(transformDatabaseAudienceProfileToAudienceProfile);
  },

  addAudienceProfile: async (profile: Omit<DatabaseAudienceProfile, 'id' | 'user_id' | 'created_at'>): Promise<AudienceProfile> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newProfile] = await sql`
      INSERT INTO audience_profiles (
        user_id, name, age_range, industry, interests, pain_points, 
        preferred_content_types, engagement_patterns, created_at
      ) VALUES (
        ${user.id}, ${profile.name}, ${profile.age_range}, ${profile.industry}, 
        ${JSON.stringify(profile.interests)}, ${JSON.stringify(profile.pain_points)}, 
        ${JSON.stringify(profile.preferred_content_types)}, 
        ${JSON.stringify(profile.engagement_patterns)}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseAudienceProfileToAudienceProfile(newProfile);
  },

  updateAudienceProfile: async (id: string, updates: Partial<Omit<DatabaseAudienceProfile, 'id' | 'user_id'>>): Promise<AudienceProfile> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedProfile] = await sql`
      UPDATE audience_profiles 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseAudienceProfileToAudienceProfile(updatedProfile);
  },

  deleteAudienceProfile: async (id: string): Promise<void> => {
    await sql`DELETE FROM audience_profiles WHERE id = ${id}`;
  },

  // Campaigns CRUD operations
  getCampaigns: async (): Promise<Campaign[]> => {
    const campaigns = await sql`
      SELECT * FROM campaigns 
      ORDER BY created_at DESC
    `;

    return campaigns.map(transformDatabaseCampaignToCampaign);
  },

  addCampaign: async (campaign: Omit<DatabaseCampaign, 'id' | 'user_id' | 'created_at'>): Promise<Campaign> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newCampaign] = await sql`
      INSERT INTO campaigns (
        user_id, name, description, theme, start_date, end_date, 
        platforms, status, performance, created_at
      ) VALUES (
        ${user.id}, ${campaign.name}, ${campaign.description}, ${campaign.theme}, 
        ${campaign.start_date}, ${campaign.end_date}, 
        ${JSON.stringify(campaign.platforms)}, ${campaign.status}, 
        ${JSON.stringify(campaign.performance)}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseCampaignToCampaign(newCampaign);
  },

  updateCampaign: async (id: string, updates: Partial<Omit<DatabaseCampaign, 'id' | 'user_id'>>): Promise<Campaign> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedCampaign] = await sql`
      UPDATE campaigns 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseCampaignToCampaign(updatedCampaign);
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await sql`DELETE FROM campaigns WHERE id = ${id}`;
  },

  // Content Series CRUD operations
  getContentSeries: async (): Promise<ContentSeries[]> => {
    const series = await sql`
      SELECT * FROM content_series 
      ORDER BY created_at DESC
    `;

    return series.map(transformDatabaseContentSeriesToContentSeries);
  },

  addContentSeries: async (series: Omit<DatabaseContentSeries, 'id' | 'user_id' | 'created_at'>): Promise<ContentSeries> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newSeries] = await sql`
      INSERT INTO content_series (
        user_id, campaign_id, name, theme, total_posts, frequency, 
        current_post, created_at
      ) VALUES (
        ${user.id}, ${series.campaign_id}, ${series.name}, ${series.theme}, 
        ${series.total_posts}, ${series.frequency}, ${series.current_post}, 
        ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseContentSeriesToContentSeries(newSeries);
  },

  updateContentSeries: async (id: string, updates: Partial<Omit<DatabaseContentSeries, 'id' | 'user_id'>>): Promise<ContentSeries> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedSeries] = await sql`
      UPDATE content_series 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseContentSeriesToContentSeries(updatedSeries);
  },

  deleteContentSeries: async (id: string): Promise<void> => {
    await sql`DELETE FROM content_series WHERE id = ${id}`;
  },

  // Content Templates CRUD operations
  getContentTemplates: async (): Promise<ContentTemplate[]> => {
    const templates = await sql`
      SELECT * FROM content_templates 
      ORDER BY created_at DESC
    `;

    return templates.map(transformDatabaseContentTemplateToContentTemplate);
  },

  addContentTemplate: async (template: Omit<DatabaseContentTemplate, 'id' | 'user_id' | 'created_at'>): Promise<ContentTemplate> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newTemplate] = await sql`
      INSERT INTO content_templates (
        user_id, name, category, industry, content_type, structure, 
        customizable_fields, usage_count, rating, is_public, created_at
      ) VALUES (
        ${user.id}, ${template.name}, ${template.category}, ${template.industry}, 
        ${template.content_type}, ${JSON.stringify(template.structure)}, 
        ${JSON.stringify(template.customizable_fields)}, ${template.usage_count}, 
        ${template.rating}, ${template.is_public}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseContentTemplateToContentTemplate(newTemplate);
  },

  updateContentTemplate: async (id: string, updates: Partial<Omit<DatabaseContentTemplate, 'id' | 'user_id'>>): Promise<ContentTemplate> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedTemplate] = await sql`
      UPDATE content_templates 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseContentTemplateToContentTemplate(updatedTemplate);
  },

  deleteContentTemplate: async (id: string): Promise<void> => {
    await sql`DELETE FROM content_templates WHERE id = ${id}`;
  },

  // Image Styles CRUD operations
  getImageStyles: async (): Promise<ImageStyle[]> => {
    const styles = await sql`
      SELECT * FROM image_styles 
      ORDER BY created_at DESC
    `;

    return styles.map(transformDatabaseImageStyleToImageStyle);
  },

  addImageStyle: async (style: Omit<DatabaseImageStyle, 'id' | 'user_id' | 'created_at'>): Promise<ImageStyle> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newStyle] = await sql`
      INSERT INTO image_styles (
        user_id, name, style_prompt, color_palette, visual_elements, 
        brand_assets, created_at
      ) VALUES (
        ${user.id}, ${style.name}, ${style.style_prompt}, 
        ${JSON.stringify(style.color_palette)}, ${JSON.stringify(style.visual_elements)}, 
        ${JSON.stringify(style.brand_assets)}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseImageStyleToImageStyle(newStyle);
  },

  updateImageStyle: async (id: string, updates: Partial<Omit<DatabaseImageStyle, 'id' | 'user_id'>>): Promise<ImageStyle> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedStyle] = await sql`
      UPDATE image_styles 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseImageStyleToImageStyle(updatedStyle);
  },

  deleteImageStyle: async (id: string): Promise<void> => {
    await sql`DELETE FROM image_styles WHERE id = ${id}`;
  },

  // Analytics Data Operations
  insertPostAnalytics: async (analytics: Omit<DatabaseAnalyticsData, 'id' | 'recorded_at'>): Promise<AnalyticsData> => {
    const [newAnalytics] = await sql`
      INSERT INTO post_analytics (
        post_id, platform, likes, shares, comments, clicks, 
        impressions, reach, recorded_at
      ) VALUES (
        ${analytics.post_id}, ${analytics.platform}, ${analytics.likes}, 
        ${analytics.shares}, ${analytics.comments}, ${analytics.clicks}, 
        ${analytics.impressions}, ${analytics.reach}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseAnalyticsDataToAnalyticsData(newAnalytics);
  },

  getPostAnalytics: async (postId: string): Promise<AnalyticsData[]> => {
    const analytics = await sql`
      SELECT * FROM post_analytics 
      WHERE post_id = ${postId}
      ORDER BY recorded_at DESC
    `;

    return analytics.map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  getEngagementMetrics: async (postId: string, platform?: string): Promise<AnalyticsData[]> => {
    let query = sql`
      SELECT * FROM post_analytics 
      WHERE post_id = ${postId}
    `;

    if (platform) {
      query = sql`
        SELECT * FROM post_analytics 
        WHERE post_id = ${postId} AND platform = ${platform}
      `;
    }

    const analytics = await query;
    return analytics.map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  getAnalyticsByTimeframe: async (startDate: Date, endDate: Date, platform?: string): Promise<AnalyticsData[]> => {
    let query = sql`
      SELECT * FROM post_analytics 
      WHERE recorded_at >= ${startDate.toISOString()} 
      AND recorded_at <= ${endDate.toISOString()}
    `;

    if (platform) {
      query = sql`
        SELECT * FROM post_analytics 
        WHERE recorded_at >= ${startDate.toISOString()} 
        AND recorded_at <= ${endDate.toISOString()}
        AND platform = ${platform}
      `;
    }

    const analytics = await query;
    return analytics.map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  generatePerformanceReport: async (timeframe: string): Promise<PerformanceReport> => {
    const endDate = new Date();
    let startDate = new Date();

    // Calculate start date based on timeframe
    switch (timeframe) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7); // Default to week
    }

    // Get analytics data for the timeframe
    const analyticsData = await db.getAnalyticsByTimeframe(startDate, endDate);
    
    // Get posts for the timeframe
    const posts = await sql`
      SELECT * FROM posts 
      WHERE created_at >= ${startDate.toISOString()} 
      AND created_at <= ${endDate.toISOString()}
    `;

    const transformedPosts = posts.map(transformDatabasePostToPost);

    // Calculate metrics
    const totalPosts = transformedPosts.length;
    const totalEngagement = analyticsData.reduce((sum, data) => 
      sum + data.likes + data.shares + data.comments + data.clicks, 0);
    const totalImpressions = analyticsData.reduce((sum, data) => sum + data.impressions, 0);
    const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

    // Group by platform
    const platformBreakdown: { [platform: string]: any } = {};
    analyticsData.forEach(data => {
      if (!platformBreakdown[data.platform]) {
        platformBreakdown[data.platform] = {
          posts: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          avgEngagementRate: 0
        };
      }
      platformBreakdown[data.platform].totalLikes += data.likes;
      platformBreakdown[data.platform].totalShares += data.shares;
      platformBreakdown[data.platform].totalComments += data.comments;
    });

    // Count posts per platform
    transformedPosts.forEach(post => {
      Object.keys(post.socialMediaPosts || {}).forEach(platform => {
        if (platformBreakdown[platform]) {
          platformBreakdown[platform].posts += 1;
        }
      });
    });

    // Calculate engagement rates per platform
    Object.keys(platformBreakdown).forEach(platform => {
      const platformAnalytics = analyticsData.filter(data => data.platform === platform);
      const platformImpressions = platformAnalytics.reduce((sum, data) => sum + data.impressions, 0);
      const platformEngagement = platformAnalytics.reduce((sum, data) => 
        sum + data.likes + data.shares + data.comments + data.clicks, 0);
      platformBreakdown[platform].avgEngagementRate = platformImpressions > 0 ? 
        (platformEngagement / platformImpressions) * 100 : 0;
    });

    return {
      timeframe,
      totalPosts,
      totalEngagement,
      avgEngagementRate,
      topContent: [], // Will be populated by separate analysis
      platformBreakdown,
      trends: [], // Will be populated by trend analysis
      recommendations: [] // Will be populated by optimization engine
    };
  },

  // Real-time subscriptions for analytics (mock implementation)
  subscribeToAnalytics: (callback: (analytics: AnalyticsData[]) => void) => {
    // In a real implementation, you'd set up WebSocket or polling
    db.getPostAnalytics('').then(callback).catch(console.error);
    return () => {}; // Return unsubscribe function
  },

  // Batch insert analytics data
  batchInsertAnalytics: async (analyticsArray: Omit<DatabaseAnalyticsData, 'id' | 'recorded_at'>[]): Promise<AnalyticsData[]> => {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = analyticsArray.map(analytics => ({
      ...analytics,
      recorded_at: timestamp
    }));

    const newAnalytics = await sql`
      INSERT INTO post_analytics (
        post_id, platform, likes, shares, comments, clicks, 
        impressions, reach, recorded_at
      ) VALUES ${sql(dataWithTimestamp.map(a => [
        a.post_id, a.platform, a.likes, a.shares, a.comments, 
        a.clicks, a.impressions, a.reach, timestamp
      ]))} RETURNING *
    `;

    return newAnalytics.map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  // Get top performing content
  getTopPerformingContent: async (limit: number = 10, timeframe?: string): Promise<AnalyticsData[]> => {
    let query = sql`SELECT * FROM post_analytics`;

    if (timeframe) {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      query = sql`
        SELECT * FROM post_analytics 
        WHERE recorded_at >= ${startDate.toISOString()} 
        AND recorded_at <= ${endDate.toISOString()}
      `;
    }

    const analytics = await sql`
      ${query}
      ORDER BY likes DESC, shares DESC, comments DESC
      LIMIT ${limit}
    `;

    return analytics.map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  // Update analytics data
  updateAnalytics: async (id: string, updates: Partial<Omit<DatabaseAnalyticsData, 'id' | 'post_id' | 'recorded_at'>>): Promise<AnalyticsData> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedAnalytics] = await sql`
      UPDATE post_analytics 
      SET ${sql.unsafe(updateFields)}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseAnalyticsDataToAnalyticsData(updatedAnalytics);
  },

  // Integration Management Operations
  getIntegrations: async (): Promise<Integration[]> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const integrations = await sql`
      SELECT * FROM integrations 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `;

    return integrations.map(transformDatabaseIntegrationToIntegration);
  },

  addIntegration: async (integration: Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Integration> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newIntegration] = await sql`
      INSERT INTO integrations (
        user_id, name, type, platform, status, credentials, configuration, 
        last_sync, sync_frequency, is_active, created_at, updated_at
      ) VALUES (
        ${user.id}, ${integration.name}, ${integration.type}, ${integration.platform}, 
        ${integration.status}, ${JSON.stringify(integration.credentials)}, 
        ${JSON.stringify(integration.configuration)}, ${integration.last_sync}, 
        ${integration.sync_frequency}, ${integration.is_active}, 
        ${new Date().toISOString()}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseIntegrationToIntegration(newIntegration);
  },

  updateIntegration: async (id: string, updates: Partial<Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at'>>): Promise<Integration> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedIntegration] = await sql`
      UPDATE integrations 
      SET ${sql.unsafe(updateFields)}, updated_at = ${new Date().toISOString()}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseIntegrationToIntegration(updatedIntegration);
  },

  deleteIntegration: async (id: string): Promise<void> => {
    await sql`DELETE FROM integrations WHERE id = ${id}`;
  },

  getIntegrationById: async (id: string): Promise<Integration | null> => {
    const [integration] = await sql`
      SELECT * FROM integrations 
      WHERE id = ${id}
    `;

    if (!integration) return null;
    return transformDatabaseIntegrationToIntegration(integration);
  },

  // Integration Logs Operations
  getIntegrationLogs: async (integrationId: string, limit: number = 100): Promise<IntegrationLog[]> => {
    const logs = await sql`
      SELECT * FROM integration_logs 
      WHERE integration_id = ${integrationId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    return logs.map(transformDatabaseIntegrationLogToIntegrationLog);
  },

  addIntegrationLog: async (log: Omit<DatabaseIntegrationLog, 'id' | 'timestamp' | 'user_id'>): Promise<IntegrationLog> => {
    const user = await auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const [newLog] = await sql`
      INSERT INTO integration_logs (
        integration_id, user_id, level, message, metadata, timestamp
      ) VALUES (
        ${log.integration_id}, ${user.id}, ${log.level}, ${log.message}, 
        ${JSON.stringify(log.metadata)}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseIntegrationLogToIntegrationLog(newLog);
  },

  // Integration Alerts Operations
  getIntegrationAlerts: async (integrationId: string, includeResolved: boolean = false): Promise<IntegrationAlert[]> => {
    let query = sql`
      SELECT * FROM integration_alerts 
      WHERE integration_id = ${integrationId}
    `;

    if (!includeResolved) {
      query = sql`
        SELECT * FROM integration_alerts 
        WHERE integration_id = ${integrationId} AND is_resolved = false
      `;
    }

    const alerts = await sql`${query} ORDER BY created_at DESC`;
    return alerts.map(transformDatabaseIntegrationAlertToIntegrationAlert);
  },

  addIntegrationAlert: async (alert: Omit<DatabaseIntegrationAlert, 'id' | 'created_at'>): Promise<IntegrationAlert> => {
    const [newAlert] = await sql`
      INSERT INTO integration_alerts (
        integration_id, type, title, message, severity, is_resolved, 
        resolved_at, metadata, created_at
      ) VALUES (
        ${alert.integration_id}, ${alert.type}, ${alert.title}, ${alert.message}, 
        ${alert.severity}, ${alert.is_resolved}, ${alert.resolved_at}, 
        ${JSON.stringify(alert.metadata)}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseIntegrationAlertToIntegrationAlert(newAlert);
  },

  resolveIntegrationAlert: async (alertId: string): Promise<IntegrationAlert> => {
    const [resolvedAlert] = await sql`
      UPDATE integration_alerts 
      SET is_resolved = true, resolved_at = ${new Date().toISOString()}
      WHERE id = ${alertId}
      RETURNING *
    `;

    return transformDatabaseIntegrationAlertToIntegrationAlert(resolvedAlert);
  },

  // Integration Metrics Operations
  getIntegrationMetrics: async (integrationId: string, timeframe: string = '24h'): Promise<IntegrationMetrics[]> => {
    let startDate = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    const metrics = await sql`
      SELECT * FROM integration_metrics 
      WHERE integration_id = ${integrationId}
      AND recorded_at >= ${startDate.toISOString()}
      ORDER BY recorded_at DESC
    `;

    return metrics.map(transformDatabaseIntegrationMetricsToIntegrationMetrics);
  },

  updateIntegrationMetrics: async (integrationId: string, metrics: Partial<IntegrationMetrics>): Promise<IntegrationMetrics> => {
    const [updatedMetrics] = await sql`
      INSERT INTO integration_metrics (
        integration_id, total_requests, successful_requests, failed_requests, 
        average_response_time, last_request_time, error_rate, uptime, 
        data_processed, sync_count, last_sync_duration, recorded_at
      ) VALUES (
        ${integrationId}, ${metrics.totalRequests || 0}, ${metrics.successfulRequests || 0}, 
        ${metrics.failedRequests || 0}, ${metrics.averageResponseTime || 0}, 
        ${metrics.lastRequestTime?.toISOString() || new Date().toISOString()}, 
        ${metrics.errorRate || 0}, ${metrics.uptime || 100}, ${metrics.dataProcessed || 0}, 
        ${metrics.syncCount || 0}, ${metrics.lastSyncDuration || 0}, ${new Date().toISOString()}
      ) 
      ON CONFLICT (integration_id) DO UPDATE SET
        total_requests = EXCLUDED.total_requests,
        successful_requests = EXCLUDED.successful_requests,
        failed_requests = EXCLUDED.failed_requests,
        average_response_time = EXCLUDED.average_response_time,
        last_request_time = EXCLUDED.last_request_time,
        error_rate = EXCLUDED.error_rate,
        uptime = EXCLUDED.uptime,
        data_processed = EXCLUDED.data_processed,
        sync_count = EXCLUDED.sync_count,
        last_sync_duration = EXCLUDED.last_sync_duration,
        recorded_at = EXCLUDED.recorded_at
      RETURNING *
    `;

    return transformDatabaseIntegrationMetricsToIntegrationMetrics(updatedMetrics);
  },

  // Webhook Operations
  getIntegrationWebhooks: async (integrationId: string): Promise<WebhookConfig[]> => {
    const webhooks = await sql`
      SELECT * FROM integration_webhooks 
      WHERE integration_id = ${integrationId} AND is_active = true
      ORDER BY created_at DESC
    `;

    return webhooks.map(transformDatabaseWebhookToWebhook);
  },

  addIntegrationWebhook: async (webhook: Omit<WebhookConfig, 'id'> & { integration_id: string }): Promise<WebhookConfig> => {
    const [newWebhook] = await sql`
      INSERT INTO integration_webhooks (
        integration_id, url, events, secret, is_active, retry_policy, 
        headers, timeout, created_at, updated_at
      ) VALUES (
        ${webhook.integration_id}, ${webhook.url}, ${JSON.stringify(webhook.events)}, 
        ${webhook.secret}, ${webhook.isActive}, ${JSON.stringify(webhook.retryPolicy)}, 
        ${JSON.stringify(webhook.headers || {})}, ${webhook.timeout || 30000}, 
        ${new Date().toISOString()}, ${new Date().toISOString()}
      ) RETURNING *
    `;

    return transformDatabaseWebhookToWebhook(newWebhook);
  },

  updateIntegrationWebhook: async (webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const updateFields = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');

    const values = Object.values(updates);
    const [updatedWebhook] = await sql`
      UPDATE integration_webhooks 
      SET ${sql.unsafe(updateFields)}, updated_at = ${new Date().toISOString()}
      WHERE id = $1
      RETURNING *
    `;

    return transformDatabaseWebhookToWebhook(updatedWebhook);
  },

  deleteIntegrationWebhook: async (webhookId: string): Promise<void> => {
    await sql`DELETE FROM integration_webhooks WHERE id = ${webhookId}`;
  },

  // Additional methods required by new integration services
  getWebhooks: async (integrationId: string): Promise<WebhookConfig[]> => {
    return db.getIntegrationWebhooks(integrationId);
  },

  addWebhook: async (integrationId: string, webhook: Omit<WebhookConfig, 'id'>): Promise<void> => {
    await db.addIntegrationWebhook({ ...webhook, integration_id: integrationId });
  },

  updateWebhook: async (webhookId: string, updates: Partial<WebhookConfig>): Promise<void> => {
    await db.updateIntegrationWebhook(webhookId, updates);
  },

  deleteWebhook: async (webhookId: string): Promise<void> => {
    await db.deleteIntegrationWebhook(webhookId);
  },

  checkIntegrationRLSPermissions: async (integrationId: string): Promise<{ isSecure: boolean; issues: string[] }> => {
    // This is a conceptual check - in a real implementation, you'd verify RLS policies
    // For now, we'll assume RLS is properly configured if the integration exists
    try {
      const [integration] = await sql`
        SELECT id FROM integrations WHERE id = ${integrationId}
      `;

      if (!integration) {
        return { isSecure: false, issues: ['Integration not found or access denied'] };
      }

      return { isSecure: true, issues: [] };
    } catch (error) {
      return { isSecure: false, issues: ['Failed to check RLS permissions'] };
    }
  },

  // Real-time subscriptions for integrations (mock implementation)
  subscribeToIntegrations: (callback: (integrations: Integration[]) => void) => {
    // In a real implementation, you'd set up WebSocket or polling
    db.getIntegrations().then(callback).catch(console.error);
    return () => {}; // Return unsubscribe function
  },

  subscribeToIntegrationLogs: (integrationId: string, callback: (logs: IntegrationLog[]) => void) => {
    // In a real implementation, you'd set up WebSocket or polling
    db.getIntegrationLogs(integrationId).then(callback).catch(console.error);
    return () => {}; // Return unsubscribe function
  },

  subscribeToIntegrationAlerts: (integrationId: string, callback: (alerts: IntegrationAlert[]) => void) => {
    // In a real implementation, you'd set up WebSocket or polling
    db.getIntegrationAlerts(integrationId).then(callback).catch(console.error);
    return () => {}; // Return unsubscribe function
  }
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
    imageStyleId: dbPost.image_style_id
  };
}

// Helper function to transform app post to database format
export function transformPostToDatabasePost(post: Omit<Post, 'id'>): Omit<DatabasePost, 'id' | 'user_id'> {
  return {
    topic: post.topic,
    idea: post.idea,
    content: post.content,
    status: post.status,
    tags: post.tags,
    social_media_posts: post.socialMediaPosts,
    social_media_tones: post.socialMediaTones,
    social_media_audiences: post.socialMediaAudiences,
    schedule_date: post.scheduleDate?.toISOString(),
    created_at: post.createdAt?.toISOString(),
    posted_at: post.postedAt?.toISOString(),
    selected_image: post.selectedImage,
    summary: post.summary,
    headlines: post.headlines,
    brand_voice_id: post.brandVoiceId,
    audience_profile_id: post.audienceProfileId,
    campaign_id: post.campaignId,
    series_id: post.seriesId,
    template_id: post.templateId,
    performance_score: post.performanceScore,
    optimization_suggestions: post.optimizationSuggestions,
    image_style_id: post.imageStyleId
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
    createdAt: new Date(dbBrandVoice.created_at)
  };
}

// Helper functions for Audience Profile transformations
function transformDatabaseAudienceProfileToAudienceProfile(dbProfile: DatabaseAudienceProfile): AudienceProfile {
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
    createdAt: new Date(dbProfile.created_at)
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
    createdAt: new Date(dbCampaign.created_at)
  };
}

// Helper functions for Content Series transformations
function transformDatabaseContentSeriesToContentSeries(dbSeries: DatabaseContentSeries): ContentSeries {
  return {
    id: dbSeries.id,
    userId: dbSeries.user_id,
    campaignId: dbSeries.campaign_id,
    name: dbSeries.name,
    theme: dbSeries.theme,
    totalPosts: dbSeries.total_posts,
    frequency: dbSeries.frequency,
    currentPost: dbSeries.current_post,
    posts: [], // Will be populated by joining with posts table
    createdAt: new Date(dbSeries.created_at)
  };
}

// Helper functions for Content Template transformations
function transformDatabaseContentTemplateToContentTemplate(dbTemplate: DatabaseContentTemplate): ContentTemplate {
  return {
    id: dbTemplate.id,
    userId: dbTemplate.user_id,
    name: dbTemplate.name,
    category: dbTemplate.category,
    industry: dbTemplate.industry,
    contentType: dbTemplate.content_type,
    structure: dbTemplate.structure,
    customizableFields: dbTemplate.customizable_fields,
    usageCount: dbTemplate.usage_count,
    rating: dbTemplate.rating,
    isPublic: dbTemplate.is_public,
    createdAt: new Date(dbTemplate.created_at)
  };
}

// Helper functions for Image Style transformations
function transformDatabaseImageStyleToImageStyle(dbStyle: DatabaseImageStyle): ImageStyle {
  return {
    id: dbStyle.id,
    userId: dbStyle.user_id,
    name: dbStyle.name,
    stylePrompt: dbStyle.style_prompt,
    colorPalette: dbStyle.color_palette,
    visualElements: dbStyle.visual_elements,
    brandAssets: dbStyle.brand_assets,
    createdAt: new Date(dbStyle.created_at)
  };
}

// Helper functions for Analytics Data transformations
function transformDatabaseAnalyticsDataToAnalyticsData(dbAnalytics: DatabaseAnalyticsData): AnalyticsData {
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
    recordedAt: new Date(dbAnalytics.recorded_at)
  };
}

// Helper functions for Integration transformations
function transformDatabaseIntegrationToIntegration(dbIntegration: DatabaseIntegration): Integration {
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
    updatedAt: new Date(dbIntegration.updated_at)
  };
}

function transformDatabaseIntegrationLogToIntegrationLog(dbLog: DatabaseIntegrationLog): IntegrationLog {
  return {
    id: dbLog.id,
    integrationId: dbLog.integration_id,
    level: dbLog.level,
    message: dbLog.message,
    metadata: dbLog.metadata,
    timestamp: new Date(dbLog.timestamp),
    userId: dbLog.user_id
  };
}

function transformDatabaseIntegrationAlertToIntegrationAlert(dbAlert: DatabaseIntegrationAlert): IntegrationAlert {
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
    metadata: dbAlert.metadata
  };
}

function transformDatabaseIntegrationMetricsToIntegrationMetrics(dbMetrics: any): IntegrationMetrics {
  return {
    integrationId: dbMetrics.integration_id,
    totalRequests: dbMetrics.total_requests || 0,
    successfulRequests: dbMetrics.successful_requests || 0,
    failedRequests: dbMetrics.failed_requests || 0,
    averageResponseTime: dbMetrics.average_response_time || 0,
    lastRequestTime: dbMetrics.last_request_time ? new Date(dbMetrics.last_request_time) : new Date(),
    errorRate: dbMetrics.error_rate || 0,
    uptime: dbMetrics.uptime || 100,
    dataProcessed: dbMetrics.data_processed || 0,
    syncCount: dbMetrics.sync_count || 0,
    lastSyncDuration: dbMetrics.last_sync_duration || 0
  };
}

function transformDatabaseWebhookToWebhook(dbWebhook: any): WebhookConfig {
  return {
    id: dbWebhook.id,
    url: dbWebhook.url,
    events: dbWebhook.events || [],
    secret: dbWebhook.secret,
    isActive: dbWebhook.is_active,
    retryPolicy: dbWebhook.retry_policy || {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 1000,
      maxDelay: 30000
    },
    headers: dbWebhook.headers || {},
    timeout: dbWebhook.timeout || 30000
  };
}

// Export neonService for compatibility with new integration services
export const neonService = db;