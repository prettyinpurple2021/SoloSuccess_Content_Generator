import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
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

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const auth = {
  // Sign in anonymously
  signInAnonymously: async (): Promise<{ user: User | null; error: any }> => {
    const { data, error } = await supabase.auth.signInAnonymously();
    return { user: data.user, error };
  },

  // Get current user
  getUser: async (): Promise<User | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  }
};

// Database functions
// Export both db and supabaseService for compatibility
export const db = {
  // Get all posts for current user with caching
  getPosts: async (): Promise<Post[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await contentCache.cacheUserPosts(user.id, async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformDatabasePostToPost);
    });
  },

  // Get paginated posts for better performance with large datasets
  getPostsPaginated: async (page: number = 1, pageSize: number = 20, filters?: {
    status?: string;
    campaignId?: string;
    seriesId?: string;
  }): Promise<{ posts: Post[]; totalCount: number; hasMore: boolean }> => {
    const { data: { user } } = await supabase.auth.getUser();
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
    let query = supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }
    if (filters?.seriesId) {
      query = query.eq('series_id', filters.seriesId);
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    const posts = (data || []).map(transformDatabasePostToPost);
    const totalCount = count || 0;

    // Cache the full result set for this filter combination
    if (page === 1) {
      // For first page, fetch more data to cache
      const { data: fullData } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Math.min(1000, totalCount)); // Cache up to 1000 posts

      if (fullData) {
        const fullPosts = fullData.map(transformDatabasePostToPost);
        paginationCache.set(cacheKey, fullPosts, totalCount);
      }
    }

    return {
      posts,
      totalCount,
      hasMore: page * pageSize < totalCount
    };
  },

  // Subscribe to posts changes
  subscribeToPosts: (callback: (posts: Post[]) => void) => {
    return supabase
      .channel('posts_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        async () => {
          // Refetch all posts when any change occurs
          try {
            const posts = await db.getPosts();
            callback(posts);
          } catch (error) {
            console.error('Error fetching posts after change:', error);
          }
        }
      )
      .subscribe();
  },

  // Add new post
  addPost: async (post: Omit<DatabasePost, 'id' | 'user_id' | 'created_at'>): Promise<Post> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...post,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate user cache after adding post
    contentCache.invalidateUserCache(user.id);
    
    return transformDatabasePostToPost(data);
  },

  // Update post
  updatePost: async (id: string, updates: Partial<Omit<DatabasePost, 'id' | 'user_id'>>): Promise<Post> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate related caches
    contentCache.invalidateUserCache(user.id);
    contentCache.invalidatePostCache(id);
    
    return transformDatabasePostToPost(data);
  },

  // Delete post
  deletePost: async (id: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Invalidate related caches
    contentCache.invalidateUserCache(user.id);
    contentCache.invalidatePostCache(id);
  },

  // Brand Voices CRUD operations with caching
  getBrandVoices: async (): Promise<BrandVoice[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    return await contentCache.cacheBrandVoices(user.id, async () => {
      const { data, error } = await supabase
        .from('brand_voices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(transformDatabaseBrandVoiceToBrandVoice);
    });
  },

  addBrandVoice: async (brandVoice: Omit<DatabaseBrandVoice, 'id' | 'user_id' | 'created_at'>): Promise<BrandVoice> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('brand_voices')
      .insert({
        ...brandVoice,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseBrandVoiceToBrandVoice(data);
  },

  updateBrandVoice: async (id: string, updates: Partial<Omit<DatabaseBrandVoice, 'id' | 'user_id'>>): Promise<BrandVoice> => {
    const { data, error } = await supabase
      .from('brand_voices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseBrandVoiceToBrandVoice(data);
  },

  deleteBrandVoice: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('brand_voices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Audience Profiles CRUD operations
  getAudienceProfiles: async (): Promise<AudienceProfile[]> => {
    const { data, error } = await supabase
      .from('audience_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseAudienceProfileToAudienceProfile);
  },

  addAudienceProfile: async (profile: Omit<DatabaseAudienceProfile, 'id' | 'user_id' | 'created_at'>): Promise<AudienceProfile> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('audience_profiles')
      .insert({
        ...profile,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseAudienceProfileToAudienceProfile(data);
  },

  updateAudienceProfile: async (id: string, updates: Partial<Omit<DatabaseAudienceProfile, 'id' | 'user_id'>>): Promise<AudienceProfile> => {
    const { data, error } = await supabase
      .from('audience_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseAudienceProfileToAudienceProfile(data);
  },

  deleteAudienceProfile: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('audience_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Campaigns CRUD operations
  getCampaigns: async (): Promise<Campaign[]> => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseCampaignToCampaign);
  },

  addCampaign: async (campaign: Omit<DatabaseCampaign, 'id' | 'user_id' | 'created_at'>): Promise<Campaign> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaign,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseCampaignToCampaign(data);
  },

  updateCampaign: async (id: string, updates: Partial<Omit<DatabaseCampaign, 'id' | 'user_id'>>): Promise<Campaign> => {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseCampaignToCampaign(data);
  },

  deleteCampaign: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Content Series CRUD operations
  getContentSeries: async (): Promise<ContentSeries[]> => {
    const { data, error } = await supabase
      .from('content_series')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseContentSeriesToContentSeries);
  },

  addContentSeries: async (series: Omit<DatabaseContentSeries, 'id' | 'user_id' | 'created_at'>): Promise<ContentSeries> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_series')
      .insert({
        ...series,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseContentSeriesToContentSeries(data);
  },

  updateContentSeries: async (id: string, updates: Partial<Omit<DatabaseContentSeries, 'id' | 'user_id'>>): Promise<ContentSeries> => {
    const { data, error } = await supabase
      .from('content_series')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseContentSeriesToContentSeries(data);
  },

  deleteContentSeries: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('content_series')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Content Templates CRUD operations
  getContentTemplates: async (): Promise<ContentTemplate[]> => {
    const { data, error } = await supabase
      .from('content_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseContentTemplateToContentTemplate);
  },

  addContentTemplate: async (template: Omit<DatabaseContentTemplate, 'id' | 'user_id' | 'created_at'>): Promise<ContentTemplate> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('content_templates')
      .insert({
        ...template,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseContentTemplateToContentTemplate(data);
  },

  updateContentTemplate: async (id: string, updates: Partial<Omit<DatabaseContentTemplate, 'id' | 'user_id'>>): Promise<ContentTemplate> => {
    const { data, error } = await supabase
      .from('content_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseContentTemplateToContentTemplate(data);
  },

  deleteContentTemplate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('content_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Image Styles CRUD operations
  getImageStyles: async (): Promise<ImageStyle[]> => {
    const { data, error } = await supabase
      .from('image_styles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseImageStyleToImageStyle);
  },

  addImageStyle: async (style: Omit<DatabaseImageStyle, 'id' | 'user_id' | 'created_at'>): Promise<ImageStyle> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('image_styles')
      .insert({
        ...style,
        user_id: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseImageStyleToImageStyle(data);
  },

  updateImageStyle: async (id: string, updates: Partial<Omit<DatabaseImageStyle, 'id' | 'user_id'>>): Promise<ImageStyle> => {
    const { data, error } = await supabase
      .from('image_styles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseImageStyleToImageStyle(data);
  },

  deleteImageStyle: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('image_styles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Analytics Data Operations
  insertPostAnalytics: async (analytics: Omit<DatabaseAnalyticsData, 'id' | 'recorded_at'>): Promise<AnalyticsData> => {
    const { data, error } = await supabase
      .from('post_analytics')
      .insert({
        ...analytics,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseAnalyticsDataToAnalyticsData(data);
  },

  getPostAnalytics: async (postId: string): Promise<AnalyticsData[]> => {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  getEngagementMetrics: async (postId: string, platform?: string): Promise<AnalyticsData[]> => {
    let query = supabase
      .from('post_analytics')
      .select('*')
      .eq('post_id', postId);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  getAnalyticsByTimeframe: async (startDate: Date, endDate: Date, platform?: string): Promise<AnalyticsData[]> => {
    let query = supabase
      .from('post_analytics')
      .select('*')
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('recorded_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
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
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (postsError) throw postsError;

    const posts = (postsData || []).map(transformDatabasePostToPost);

    // Calculate metrics
    const totalPosts = posts.length;
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
    posts.forEach(post => {
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

  // Real-time subscriptions for analytics
  subscribeToAnalytics: (callback: (analytics: AnalyticsData[]) => void) => {
    return supabase
      .channel('analytics_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'post_analytics' },
        async () => {
          // Refetch analytics data when any change occurs
          try {
            const { data, error } = await supabase
              .from('post_analytics')
              .select('*')
              .order('recorded_at', { ascending: false });

            if (error) throw error;

            const analytics = (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
            callback(analytics);
          } catch (error) {
            console.error('Error fetching analytics after change:', error);
          }
        }
      )
      .subscribe();
  },

  // Batch insert analytics data
  batchInsertAnalytics: async (analyticsArray: Omit<DatabaseAnalyticsData, 'id' | 'recorded_at'>[]): Promise<AnalyticsData[]> => {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = analyticsArray.map(analytics => ({
      ...analytics,
      recorded_at: timestamp
    }));

    const { data, error } = await supabase
      .from('post_analytics')
      .insert(dataWithTimestamp)
      .select();

    if (error) throw error;

    return (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  // Get top performing content
  getTopPerformingContent: async (limit: number = 10, timeframe?: string): Promise<AnalyticsData[]> => {
    let query = supabase
      .from('post_analytics')
      .select('*');

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

      query = query
        .gte('recorded_at', startDate.toISOString())
        .lte('recorded_at', endDate.toISOString());
    }

    const { data, error } = await query
      .order('likes', { ascending: false })
      .order('shares', { ascending: false })
      .order('comments', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(transformDatabaseAnalyticsDataToAnalyticsData);
  },

  // Update analytics data
  updateAnalytics: async (id: string, updates: Partial<Omit<DatabaseAnalyticsData, 'id' | 'post_id' | 'recorded_at'>>): Promise<AnalyticsData> => {
    const { data, error } = await supabase
      .from('post_analytics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseAnalyticsDataToAnalyticsData(data);
  },

  // Integration Management Operations
  getIntegrations: async (): Promise<Integration[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDatabaseIntegrationToIntegration);
  },

  addIntegration: async (integration: Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Integration> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('integrations')
      .insert({
        ...integration,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationToIntegration(data);
  },

  updateIntegration: async (id: string, updates: Partial<Omit<DatabaseIntegration, 'id' | 'user_id' | 'created_at'>>): Promise<Integration> => {
    const { data, error } = await supabase
      .from('integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationToIntegration(data);
  },

  deleteIntegration: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getIntegrationById: async (id: string): Promise<Integration | null> => {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return transformDatabaseIntegrationToIntegration(data);
  },

  // Integration Logs Operations
  getIntegrationLogs: async (integrationId: string, limit: number = 100): Promise<IntegrationLog[]> => {
    const { data, error } = await supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformDatabaseIntegrationLogToIntegrationLog);
  },

  addIntegrationLog: async (log: Omit<DatabaseIntegrationLog, 'id' | 'timestamp' | 'user_id'>): Promise<IntegrationLog> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('integration_logs')
      .insert({
        ...log,
        user_id: user.id,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationLogToIntegrationLog(data);
  },

  // Integration Alerts Operations
  getIntegrationAlerts: async (integrationId: string, includeResolved: boolean = false): Promise<IntegrationAlert[]> => {
    let query = supabase
      .from('integration_alerts')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      query = query.eq('is_resolved', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformDatabaseIntegrationAlertToIntegrationAlert);
  },

  addIntegrationAlert: async (alert: Omit<DatabaseIntegrationAlert, 'id' | 'created_at'>): Promise<IntegrationAlert> => {
    const { data, error } = await supabase
      .from('integration_alerts')
      .insert({
        ...alert,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationAlertToIntegrationAlert(data);
  },

  resolveIntegrationAlert: async (alertId: string): Promise<IntegrationAlert> => {
    const { data, error } = await supabase
      .from('integration_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationAlertToIntegrationAlert(data);
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

    const { data, error } = await supabase
      .from('integration_metrics')
      .select('*')
      .eq('integration_id', integrationId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDatabaseIntegrationMetricsToIntegrationMetrics);
  },

  updateIntegrationMetrics: async (integrationId: string, metrics: Partial<IntegrationMetrics>): Promise<IntegrationMetrics> => {
    const { data, error } = await supabase
      .from('integration_metrics')
      .upsert({
        integration_id: integrationId,
        ...metrics,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseIntegrationMetricsToIntegrationMetrics(data);
  },

  // Webhook Operations
  getIntegrationWebhooks: async (integrationId: string): Promise<WebhookConfig[]> => {
    const { data, error } = await supabase
      .from('integration_webhooks')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformDatabaseWebhookToWebhook);
  },

  addIntegrationWebhook: async (webhook: Omit<WebhookConfig, 'id'> & { integration_id: string }): Promise<WebhookConfig> => {
    const { data, error } = await supabase
      .from('integration_webhooks')
      .insert({
        integration_id: webhook.integration_id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        is_active: webhook.isActive,
        retry_policy: webhook.retryPolicy,
        headers: webhook.headers || {},
        timeout: webhook.timeout || 30000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseWebhookToWebhook(data);
  },

  updateIntegrationWebhook: async (webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig> => {
    const { data, error } = await supabase
      .from('integration_webhooks')
      .update({
        url: updates.url,
        events: updates.events,
        secret: updates.secret,
        is_active: updates.isActive,
        retry_policy: updates.retryPolicy,
        headers: updates.headers,
        timeout: updates.timeout,
        updated_at: new Date().toISOString()
      })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return transformDatabaseWebhookToWebhook(data);
  },

  deleteIntegrationWebhook: async (webhookId: string): Promise<void> => {
    const { error } = await supabase
      .from('integration_webhooks')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
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
      const { data, error } = await supabase
        .from('integrations')
        .select('id')
        .eq('id', integrationId)
        .single();

      if (error) {
        return { isSecure: false, issues: ['Integration not found or access denied'] };
      }

      return { isSecure: true, issues: [] };
    } catch (error) {
      return { isSecure: false, issues: ['Failed to check RLS permissions'] };
    }
  },

  // Real-time subscriptions for integrations
  subscribeToIntegrations: (callback: (integrations: Integration[]) => void) => {
    return supabase
      .channel('integrations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'integrations' },
        async () => {
          try {
            const integrations = await db.getIntegrations();
            callback(integrations);
          } catch (error) {
            console.error('Error fetching integrations after change:', error);
          }
        }
      )
      .subscribe();
  },

  subscribeToIntegrationLogs: (integrationId: string, callback: (logs: IntegrationLog[]) => void) => {
    return supabase
      .channel(`integration_logs_${integrationId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'integration_logs', filter: `integration_id=eq.${integrationId}` },
        async () => {
          try {
            const logs = await db.getIntegrationLogs(integrationId);
            callback(logs);
          } catch (error) {
            console.error('Error fetching integration logs after change:', error);
          }
        }
      )
      .subscribe();
  },

  subscribeToIntegrationAlerts: (integrationId: string, callback: (alerts: IntegrationAlert[]) => void) => {
    return supabase
      .channel(`integration_alerts_${integrationId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'integration_alerts', filter: `integration_id=eq.${integrationId}` },
        async () => {
          try {
            const alerts = await db.getIntegrationAlerts(integrationId);
            callback(alerts);
          } catch (error) {
            console.error('Error fetching integration alerts after change:', error);
          }
        }
      )
      .subscribe();
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

export type { User };

// Export supabaseService for compatibility with new integration services
export const supabaseService = db;