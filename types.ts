// Using standard Date objects instead of Firebase Timestamps
export type Timestamp = Date;

export type PostStatus = 'draft' | 'scheduled' | 'posted';
export type ViewMode = 'list' | 'calendar';

export interface SocialMediaPosts {
  [platform: string]: string;
}

export interface GeneratedImages {
  [prompt: string]: string[];
}

export interface Post {
  id: string;
  topic: string;
  idea: string;
  content: string;
  status: PostStatus;
  tags: string[];
  socialMediaPosts: SocialMediaPosts;
  socialMediaTones?: { [key: string]: string };
  socialMediaAudiences?: { [key: string]: string };
  scheduleDate?: Date;
  createdAt?: Date;
  postedAt?: Date;
  selectedImage?: string;
  summary?: string;
  headlines?: string[];
  // Enhanced features - optional fields
  brandVoiceId?: string;
  audienceProfileId?: string;
  campaignId?: string;
  seriesId?: string;
  templateId?: string;
  performanceScore?: number;
  optimizationSuggestions?: OptimizationSuggestion[];
  imageStyleId?: string;
}

export interface DatabasePost {
  id: string;
  user_id: string;
  topic: string;
  idea: string;
  content: string;
  status: PostStatus;
  tags: string[];
  social_media_posts: SocialMediaPosts;
  social_media_tones?: { [key: string]: string };
  social_media_audiences?: { [key: string]: string };
  schedule_date?: string; // ISO string
  created_at?: string; // ISO string
  posted_at?: string; // ISO string
  selected_image?: string;
  summary?: string;
  headlines?: string[];
  // Enhanced features - optional fields
  brand_voice_id?: string;
  audience_profile_id?: string;
  campaign_id?: string;
  series_id?: string;
  template_id?: string;
  performance_score?: number;
  optimization_suggestions?: OptimizationSuggestion[];
  image_style_id?: string;
}

export interface LoadingState {
  [key: string]: boolean;
  // Enhanced features loading states
  brandVoices?: boolean;
  audienceProfiles?: boolean;
  campaigns?: boolean;
  contentSeries?: boolean;
  analytics?: boolean;
  templates?: boolean;
  imageStyles?: boolean;
  performanceReport?: boolean;
  optimizationSuggestions?: boolean;
  schedulingSuggestions?: boolean;
}

// Enhanced Content Features Types

export interface BrandVoice {
  id: string;
  userId?: string;
  name: string;
  tone: string;
  vocabulary: string[];
  writingStyle: string;
  targetAudience: string;
  sampleContent: string[];
  createdAt: Date;
}

export interface DatabaseBrandVoice {
  id: string;
  user_id: string;
  name: string;
  tone: string;
  vocabulary: string[];
  writing_style: string;
  target_audience: string;
  sample_content: string[];
  created_at: string;
}

export interface AudienceProfile {
  id: string;
  userId?: string;
  name: string;
  ageRange: string;
  industry: string;
  interests: string[];
  painPoints: string[];
  preferredContentTypes: string[];
  engagementPatterns: EngagementData;
  createdAt: Date;
}

export interface DatabaseAudienceProfile {
  id: string;
  user_id: string;
  name: string;
  age_range: string;
  industry: string;
  interests: string[];
  pain_points: string[];
  preferred_content_types: string[];
  engagement_patterns: EngagementData;
  created_at: string;
}

export interface Campaign {
  id: string;
  userId?: string;
  name: string;
  description: string;
  theme: string;
  startDate: Date;
  endDate: Date;
  posts: string[]; // Post IDs
  platforms: string[];
  status: 'draft' | 'active' | 'completed' | 'paused';
  performance: CampaignMetrics;
  createdAt: Date;
}

export interface DatabaseCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  platforms: string[];
  status: 'draft' | 'active' | 'completed' | 'paused';
  performance: CampaignMetrics;
  created_at: string;
}

export interface ContentSeries {
  id: string;
  userId?: string;
  campaignId?: string;
  name: string;
  theme: string;
  totalPosts: number;
  frequency: 'daily' | 'weekly' | 'biweekly';
  currentPost: number;
  posts: SeriesPost[];
  createdAt: Date;
}

export interface DatabaseContentSeries {
  id: string;
  user_id: string;
  campaign_id?: string;
  name: string;
  theme: string;
  total_posts: number;
  frequency: 'daily' | 'weekly' | 'biweekly';
  current_post: number;
  created_at: string;
}

export interface SeriesPost {
  id: string;
  seriesId: string;
  postId: string;
  sequenceNumber: number;
  title: string;
  status: PostStatus;
  scheduledDate?: Date;
}

export interface EngagementData {
  [platform: string]: {
    avgLikes: number;
    avgShares: number;
    avgComments: number;
    avgClicks: number;
    bestPostingTimes: TimeSlot[];
    engagementRate: number;
  };
}

export interface TimeSlot {
  time: string; // HH:mm format
  dayOfWeek: number; // 0-6
  engagementScore: number;
  confidence: number;
}

export interface AnalyticsData {
  id: string;
  postId: string;
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  impressions: number;
  reach: number;
  recordedAt: Date;
}

export interface DatabaseAnalyticsData {
  id: string;
  post_id: string;
  platform: string;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  impressions: number;
  reach: number;
  recorded_at: string;
}

export interface CampaignMetrics {
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformingPost?: string;
  platformPerformance: { [platform: string]: PlatformMetrics };
}

export interface PlatformMetrics {
  posts: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  avgEngagementRate: number;
}

export interface ContentTemplate {
  id: string;
  userId?: string;
  name: string;
  category: string;
  industry: string;
  contentType: 'blog' | 'social' | 'email' | 'video';
  structure: TemplateSection[];
  customizableFields: TemplateField[];
  usageCount: number;
  rating: number;
  isPublic: boolean;
  createdAt: Date;
}

export interface DatabaseContentTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  industry: string;
  content_type: 'blog' | 'social' | 'email' | 'video';
  structure: TemplateSection[];
  customizable_fields: TemplateField[];
  usage_count: number;
  rating: number;
  is_public: boolean;
  created_at: string;
}

export interface TemplateSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'cta' | 'image';
  content: string;
  isCustomizable: boolean;
  placeholder?: string;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  label: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  defaultValue?: string;
}

export interface ImageStyle {
  id: string;
  userId?: string;
  name: string;
  stylePrompt: string;
  colorPalette: string[];
  visualElements: string[];
  brandAssets: BrandAsset[];
  createdAt: Date;
}

export interface DatabaseImageStyle {
  id: string;
  user_id: string;
  name: string;
  style_prompt: string;
  color_palette: string[];
  visual_elements: string[];
  brand_assets: BrandAsset[];
  created_at: string;
}

export interface BrandAsset {
  id: string;
  type: 'logo' | 'color' | 'font' | 'pattern';
  data: string;
  usage: 'always' | 'optional' | 'never';
}

// Performance and Optimization Types
export interface PerformanceReport {
  timeframe: string;
  totalPosts: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topContent: ContentInsight[];
  platformBreakdown: { [platform: string]: PlatformMetrics };
  trends: PerformanceTrend[];
  recommendations: OptimizationSuggestion[];
}

export interface ContentInsight {
  postId: string;
  title: string;
  platform: string;
  engagementScore: number;
  insights: string[];
  contentType: string;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  timeframe: string;
}

export interface OptimizationSuggestion {
  type: 'timing' | 'content' | 'hashtags' | 'format';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

// Scheduling and Automation Types
export interface SchedulingSuggestion {
  postId: string;
  platform: string;
  suggestedTime: Date;
  reason: string;
  confidence: number;
}

export interface ConflictAnalysis {
  conflicts: ContentConflict[];
  suggestions: string[];
}

export interface ContentConflict {
  postId1: string;
  postId2: string;
  platform: string;
  conflictType: 'timing' | 'topic' | 'audience';
  severity: 'high' | 'medium' | 'low';
  resolution: string;
}