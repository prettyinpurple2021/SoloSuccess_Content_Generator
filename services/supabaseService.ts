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
  EngagementData
} from '../types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
export const db = {
  // Get all posts for current user
  getPosts: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabasePostToPost);
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
    return transformDatabasePostToPost(data);
  },

  // Update post
  updatePost: async (id: string, updates: Partial<Omit<DatabasePost, 'id' | 'user_id'>>): Promise<Post> => {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDatabasePostToPost(data);
  },

  // Delete post
  deletePost: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Brand Voices CRUD operations
  getBrandVoices: async (): Promise<BrandVoice[]> => {
    const { data, error } = await supabase
      .from('brand_voices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(transformDatabaseBrandVoiceToBrandVoice);
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
    headlines: dbPost.headlines
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
    headlines: post.headlines
  };
}

export type { User };