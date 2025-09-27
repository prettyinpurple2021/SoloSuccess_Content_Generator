import { supabase } from './supabaseService';

// Types for social platform integrations
export interface SocialPlatformConfig {
  platform: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  isConnected: boolean;
  lastSync?: Date;
}

export interface EngagementData {
  platform: string;
  postId: string;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  timestamp: Date;
}

export interface HashtagPerformance {
  hashtag: string;
  platform: string;
  usageCount: number;
  avgEngagement: number;
  trendingScore: number;
  lastUpdated: Date;
}

export interface TrendingTopic {
  topic: string;
  platform: string;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  relatedHashtags: string[];
  category: string;
  trendingScore: number;
  expiresAt: Date;
}

export interface PlatformOptimization {
  platform: string;
  bestPostingTimes: string[];
  optimalContentLength: {
    min: number;
    max: number;
  };
  topPerformingContentTypes: string[];
  recommendedHashtagCount: number;
  audienceInsights: {
    demographics: any;
    interests: string[];
    activeHours: string[];
  };
}

class SocialPlatformService {
  private platformConfigs: Map<string, SocialPlatformConfig> = new Map();

  constructor() {
    this.initializePlatformConfigs();
  }

  private initializePlatformConfigs() {
    // Initialize supported platforms
    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram', 'threads', 'bluesky'];
    
    platforms.forEach(platform => {
      this.platformConfigs.set(platform, {
        platform,
        isConnected: false,
        lastSync: undefined
      });
    });
  }

  // Platform Configuration Management
  async connectPlatform(platform: string, credentials: any): Promise<boolean> {
    try {
      const config = this.platformConfigs.get(platform);
      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      // Validate credentials based on platform
      const isValid = await this.validatePlatformCredentials(platform, credentials);
      
      if (isValid) {
        config.apiKey = credentials.apiKey;
        config.accessToken = credentials.accessToken;
        config.refreshToken = credentials.refreshToken;
        config.isConnected = true;
        config.lastSync = new Date();

        // Store encrypted credentials in database
        await this.storePlatformCredentials(platform, credentials);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      return false;
    }
  }

  async disconnectPlatform(platform: string): Promise<void> {
    const config = this.platformConfigs.get(platform);
    if (config) {
      config.isConnected = false;
      config.apiKey = undefined;
      config.accessToken = undefined;
      config.refreshToken = undefined;
      
      // Remove credentials from database
      await this.removePlatformCredentials(platform);
    }
  }

  // Engagement Data Fetching
  async fetchEngagementData(platform: string, postIds: string[]): Promise<EngagementData[]> {
    const config = this.platformConfigs.get(platform);
    if (!config?.isConnected) {
      throw new Error(`Platform ${platform} is not connected`);
    }

    try {
      switch (platform) {
        case 'twitter':
          return await this.fetchTwitterEngagement(postIds, config);
        case 'linkedin':
          return await this.fetchLinkedInEngagement(postIds, config);
        case 'facebook':
          return await this.fetchFacebookEngagement(postIds, config);
        case 'instagram':
          return await this.fetchInstagramEngagement(postIds, config);
        default:
          // For platforms without direct API access, return mock data or cached data
          return await this.getMockEngagementData(platform, postIds);
      }
    } catch (error) {
      console.error(`Error fetching engagement data for ${platform}:`, error);
      return [];
    }
  }

  // Hashtag Performance Tracking
  async trackHashtagPerformance(hashtags: string[], platforms: string[]): Promise<HashtagPerformance[]> {
    const results: HashtagPerformance[] = [];

    for (const platform of platforms) {
      const config = this.platformConfigs.get(platform);
      if (!config?.isConnected) continue;

      try {
        const platformResults = await this.fetchHashtagMetrics(hashtags, platform, config);
        results.push(...platformResults);
      } catch (error) {
        console.error(`Error tracking hashtags for ${platform}:`, error);
      }
    }

    // Store results in database for caching
    await this.storeHashtagPerformance(results);
    
    return results;
  }

  async getHashtagSuggestions(content: string, platform: string, limit: number = 10): Promise<string[]> {
    try {
      // Analyze content to extract relevant topics
      const topics = await this.extractTopicsFromContent(content);
      
      // Get trending hashtags for those topics
      const trendingHashtags = await this.getTrendingHashtagsForTopics(topics, platform);
      
      // Get historical performance data
      const performanceData = await this.getHashtagPerformanceHistory(trendingHashtags, platform);
      
      // Score and rank hashtags
      const scoredHashtags = this.scoreHashtags(trendingHashtags, performanceData, platform);
      
      return scoredHashtags.slice(0, limit);
    } catch (error) {
      console.error('Error generating hashtag suggestions:', error);
      return this.getFallbackHashtags(platform, limit);
    }
  }

  // Trending Topics Integration
  async fetchTrendingTopics(platforms: string[], categories?: string[]): Promise<TrendingTopic[]> {
    const allTopics: TrendingTopic[] = [];

    for (const platform of platforms) {
      const config = this.platformConfigs.get(platform);
      if (!config?.isConnected) continue;

      try {
        const platformTopics = await this.fetchPlatformTrendingTopics(platform, config, categories);
        allTopics.push(...platformTopics);
      } catch (error) {
        console.error(`Error fetching trending topics for ${platform}:`, error);
      }
    }

    // Remove duplicates and sort by trending score
    const uniqueTopics = this.deduplicateTopics(allTopics);
    const sortedTopics = uniqueTopics.sort((a, b) => b.trendingScore - a.trendingScore);

    // Cache results
    await this.storeTrendingTopics(sortedTopics);

    return sortedTopics;
  }

  async suggestContentForTrends(trends: TrendingTopic[], brandVoice?: string): Promise<string[]> {
    const suggestions: string[] = [];

    for (const trend of trends.slice(0, 5)) { // Limit to top 5 trends
      try {
        const suggestion = await this.generateTrendBasedContent(trend, brandVoice);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      } catch (error) {
        console.error(`Error generating content for trend ${trend.topic}:`, error);
      }
    }

    return suggestions;
  }

  // Platform-Specific Optimization
  async getPlatformOptimization(platform: string): Promise<PlatformOptimization | null> {
    const config = this.platformConfigs.get(platform);
    if (!config?.isConnected) {
      return this.getDefaultOptimization(platform);
    }

    try {
      // Fetch real-time optimization data
      const optimization = await this.fetchPlatformOptimizationData(platform, config);
      
      // Cache the results
      await this.storePlatformOptimization(platform, optimization);
      
      return optimization;
    } catch (error) {
      console.error(`Error fetching optimization data for ${platform}:`, error);
      return this.getDefaultOptimization(platform);
    }
  }

  async analyzeOptimalPostingTimes(platform: string, timeframe: number = 30): Promise<string[]> {
    try {
      // Get historical engagement data
      const engagementData = await this.getHistoricalEngagement(platform, timeframe);
      
      // Analyze patterns
      const timeAnalysis = this.analyzeEngagementByTime(engagementData);
      
      // Return top performing time slots
      return timeAnalysis.slice(0, 5);
    } catch (error) {
      console.error(`Error analyzing posting times for ${platform}:`, error);
      return this.getDefaultPostingTimes(platform);
    }
  }

  // Private helper methods
  private async validatePlatformCredentials(platform: string, credentials: any): Promise<boolean> {
    // Mock validation - in real implementation, this would make API calls to validate
    return credentials.apiKey && credentials.accessToken;
  }

  private async storePlatformCredentials(platform: string, credentials: any): Promise<void> {
    // Store encrypted credentials in Supabase
    const { error } = await supabase
      .from('platform_integrations')
      .upsert({
        platform,
        credentials: JSON.stringify(credentials), // Should be encrypted in production
        connected_at: new Date().toISOString(),
        is_active: true
      });

    if (error) {
      console.error('Error storing platform credentials:', error);
    }
  }

  private async removePlatformCredentials(platform: string): Promise<void> {
    const { error } = await supabase
      .from('platform_integrations')
      .update({ is_active: false })
      .eq('platform', platform);

    if (error) {
      console.error('Error removing platform credentials:', error);
    }
  }

  private async fetchTwitterEngagement(postIds: string[], config: SocialPlatformConfig): Promise<EngagementData[]> {
    // Mock implementation - would use Twitter API v2
    return postIds.map(postId => ({
      platform: 'twitter',
      postId,
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 25),
      clicks: Math.floor(Math.random() * 200),
      impressions: Math.floor(Math.random() * 1000),
      reach: Math.floor(Math.random() * 800),
      engagementRate: Math.random() * 0.1,
      timestamp: new Date()
    }));
  }

  private async fetchLinkedInEngagement(postIds: string[], config: SocialPlatformConfig): Promise<EngagementData[]> {
    // Mock implementation - would use LinkedIn API
    return postIds.map(postId => ({
      platform: 'linkedin',
      postId,
      likes: Math.floor(Math.random() * 150),
      shares: Math.floor(Math.random() * 75),
      comments: Math.floor(Math.random() * 40),
      clicks: Math.floor(Math.random() * 300),
      impressions: Math.floor(Math.random() * 1500),
      reach: Math.floor(Math.random() * 1200),
      engagementRate: Math.random() * 0.15,
      timestamp: new Date()
    }));
  }

  private async fetchFacebookEngagement(postIds: string[], config: SocialPlatformConfig): Promise<EngagementData[]> {
    // Mock implementation - would use Facebook Graph API
    return postIds.map(postId => ({
      platform: 'facebook',
      postId,
      likes: Math.floor(Math.random() * 200),
      shares: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 60),
      clicks: Math.floor(Math.random() * 400),
      impressions: Math.floor(Math.random() * 2000),
      reach: Math.floor(Math.random() * 1600),
      engagementRate: Math.random() * 0.12,
      timestamp: new Date()
    }));
  }

  private async fetchInstagramEngagement(postIds: string[], config: SocialPlatformConfig): Promise<EngagementData[]> {
    // Mock implementation - would use Instagram Basic Display API
    return postIds.map(postId => ({
      platform: 'instagram',
      postId,
      likes: Math.floor(Math.random() * 300),
      shares: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 80),
      clicks: Math.floor(Math.random() * 150),
      impressions: Math.floor(Math.random() * 2500),
      reach: Math.floor(Math.random() * 2000),
      engagementRate: Math.random() * 0.08,
      timestamp: new Date()
    }));
  }

  private async getMockEngagementData(platform: string, postIds: string[]): Promise<EngagementData[]> {
    // Return cached or estimated data for platforms without API access
    return postIds.map(postId => ({
      platform,
      postId,
      likes: Math.floor(Math.random() * 100),
      shares: Math.floor(Math.random() * 30),
      comments: Math.floor(Math.random() * 20),
      clicks: Math.floor(Math.random() * 150),
      impressions: Math.floor(Math.random() * 1000),
      reach: Math.floor(Math.random() * 800),
      engagementRate: Math.random() * 0.1,
      timestamp: new Date()
    }));
  }

  private async fetchHashtagMetrics(hashtags: string[], platform: string, config: SocialPlatformConfig): Promise<HashtagPerformance[]> {
    // Mock implementation - would use platform-specific APIs
    return hashtags.map(hashtag => ({
      hashtag,
      platform,
      usageCount: Math.floor(Math.random() * 10000),
      avgEngagement: Math.random() * 0.15,
      trendingScore: Math.random() * 100,
      lastUpdated: new Date()
    }));
  }

  private async storeHashtagPerformance(performance: HashtagPerformance[]): Promise<void> {
    for (const perf of performance) {
      const { error } = await supabase
        .from('hashtag_performance')
        .upsert({
          hashtag: perf.hashtag,
          platform: perf.platform,
          usage_count: perf.usageCount,
          avg_engagement: perf.avgEngagement,
          trending_score: perf.trendingScore,
          last_updated: perf.lastUpdated.toISOString()
        });

      if (error) {
        console.error('Error storing hashtag performance:', error);
      }
    }
  }

  private async extractTopicsFromContent(content: string): Promise<string[]> {
    // Simple topic extraction - in production, would use NLP
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 5); // Top 5 topics
  }

  private async getTrendingHashtagsForTopics(topics: string[], platform: string): Promise<string[]> {
    // Mock implementation - would query trending hashtag APIs
    const baseHashtags = topics.map(topic => `#${topic}`);
    const trendingVariations = [
      '#trending', '#viral', '#popular', '#hot', '#new',
      '#tips', '#advice', '#guide', '#howto', '#tutorial'
    ];
    
    return [...baseHashtags, ...trendingVariations.slice(0, 5)];
  }

  private async getHashtagPerformanceHistory(hashtags: string[], platform: string): Promise<HashtagPerformance[]> {
    const { data, error } = await supabase
      .from('hashtag_performance')
      .select('*')
      .in('hashtag', hashtags)
      .eq('platform', platform)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching hashtag performance history:', error);
      return [];
    }

    return data?.map(row => ({
      hashtag: row.hashtag,
      platform: row.platform,
      usageCount: row.usage_count,
      avgEngagement: row.avg_engagement,
      trendingScore: row.trending_score,
      lastUpdated: new Date(row.last_updated)
    })) || [];
  }

  private scoreHashtags(hashtags: string[], performance: HashtagPerformance[], platform: string): string[] {
    const performanceMap = new Map(performance.map(p => [p.hashtag, p]));
    
    return hashtags
      .map(hashtag => {
        const perf = performanceMap.get(hashtag);
        const score = perf ? (perf.avgEngagement * 0.6 + perf.trendingScore * 0.4) : Math.random() * 50;
        return { hashtag, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.hashtag);
  }

  private getFallbackHashtags(platform: string, limit: number): string[] {
    const fallbacks = {
      twitter: ['#TwitterTips', '#SocialMedia', '#ContentCreation', '#Marketing', '#Business'],
      linkedin: ['#LinkedIn', '#Professional', '#Career', '#Business', '#Networking'],
      facebook: ['#Facebook', '#SocialMedia', '#Community', '#Engagement', '#Content'],
      instagram: ['#Instagram', '#Visual', '#Creative', '#Inspiration', '#Lifestyle'],
      threads: ['#Threads', '#Conversation', '#Community', '#Social', '#Engagement'],
      bluesky: ['#Bluesky', '#Decentralized', '#Social', '#Community', '#Open']
    };

    return (fallbacks[platform as keyof typeof fallbacks] || fallbacks.twitter).slice(0, limit);
  }

  private async fetchPlatformTrendingTopics(platform: string, config: SocialPlatformConfig, categories?: string[]): Promise<TrendingTopic[]> {
    // Mock implementation - would use platform-specific trending APIs
    const mockTopics = [
      'AI Technology', 'Climate Change', 'Remote Work', 'Cryptocurrency', 'Health & Wellness',
      'Digital Marketing', 'Entrepreneurship', 'Sustainability', 'Innovation', 'Education'
    ];

    return mockTopics.slice(0, 5).map(topic => ({
      topic,
      platform,
      volume: Math.floor(Math.random() * 100000),
      sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
      relatedHashtags: [`#${topic.replace(/\s+/g, '')}`, `#${topic.split(' ')[0]}`],
      category: categories?.[0] || 'general',
      trendingScore: Math.random() * 100,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }));
  }

  private deduplicateTopics(topics: TrendingTopic[]): TrendingTopic[] {
    const seen = new Set<string>();
    return topics.filter(topic => {
      const key = `${topic.topic.toLowerCase()}-${topic.platform}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async storeTrendingTopics(topics: TrendingTopic[]): Promise<void> {
    for (const topic of topics) {
      const { error } = await supabase
        .from('trending_topics')
        .upsert({
          topic: topic.topic,
          platform: topic.platform,
          volume: topic.volume,
          sentiment: topic.sentiment,
          related_hashtags: topic.relatedHashtags,
          category: topic.category,
          trending_score: topic.trendingScore,
          expires_at: topic.expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing trending topic:', error);
      }
    }
  }

  private async generateTrendBasedContent(trend: TrendingTopic, brandVoice?: string): Promise<string | null> {
    // Mock implementation - would integrate with Gemini AI service
    const templates = [
      `Exploring the latest trend: ${trend.topic}. What are your thoughts?`,
      `${trend.topic} is trending! Here's why it matters for your business...`,
      `Breaking down the ${trend.topic} phenomenon and its impact on our industry`,
      `Why ${trend.topic} is more than just a trend - it's a game changer`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private async fetchPlatformOptimizationData(platform: string, config: SocialPlatformConfig): Promise<PlatformOptimization> {
    // Mock implementation - would use platform analytics APIs
    return {
      platform,
      bestPostingTimes: this.getDefaultPostingTimes(platform),
      optimalContentLength: this.getDefaultContentLength(platform),
      topPerformingContentTypes: this.getDefaultContentTypes(platform),
      recommendedHashtagCount: this.getDefaultHashtagCount(platform),
      audienceInsights: {
        demographics: { age: '25-34', gender: 'mixed', location: 'global' },
        interests: ['technology', 'business', 'marketing', 'innovation'],
        activeHours: ['9:00', '12:00', '15:00', '18:00', '21:00']
      }
    };
  }

  private async storePlatformOptimization(platform: string, optimization: PlatformOptimization): Promise<void> {
    const { error } = await supabase
      .from('platform_optimization')
      .upsert({
        platform,
        best_posting_times: optimization.bestPostingTimes,
        optimal_content_length: optimization.optimalContentLength,
        top_content_types: optimization.topPerformingContentTypes,
        recommended_hashtag_count: optimization.recommendedHashtagCount,
        audience_insights: optimization.audienceInsights,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing platform optimization:', error);
    }
  }

  private getDefaultOptimization(platform: string): PlatformOptimization {
    return {
      platform,
      bestPostingTimes: this.getDefaultPostingTimes(platform),
      optimalContentLength: this.getDefaultContentLength(platform),
      topPerformingContentTypes: this.getDefaultContentTypes(platform),
      recommendedHashtagCount: this.getDefaultHashtagCount(platform),
      audienceInsights: {
        demographics: { age: '25-44', gender: 'mixed', location: 'global' },
        interests: ['business', 'technology', 'marketing'],
        activeHours: ['9:00', '12:00', '17:00', '20:00']
      }
    };
  }

  private async getHistoricalEngagement(platform: string, days: number): Promise<EngagementData[]> {
    const { data, error } = await supabase
      .from('post_analytics')
      .select('*')
      .eq('platform', platform)
      .gte('recorded_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Error fetching historical engagement:', error);
      return [];
    }

    return data?.map(row => ({
      platform: row.platform,
      postId: row.post_id,
      likes: row.likes,
      shares: row.shares,
      comments: row.comments,
      clicks: row.clicks,
      impressions: row.impressions,
      reach: row.reach,
      engagementRate: (row.likes + row.shares + row.comments) / Math.max(row.impressions, 1),
      timestamp: new Date(row.recorded_at)
    })) || [];
  }

  private analyzeEngagementByTime(engagementData: EngagementData[]): string[] {
    const timeSlots = new Map<string, number>();

    engagementData.forEach(data => {
      const hour = data.timestamp.getHours();
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const currentScore = timeSlots.get(timeSlot) || 0;
      timeSlots.set(timeSlot, currentScore + data.engagementRate);
    });

    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([time]) => time);
  }

  private getDefaultPostingTimes(platform: string): string[] {
    const defaults = {
      twitter: ['09:00', '12:00', '15:00', '18:00', '21:00'],
      linkedin: ['08:00', '12:00', '17:00', '18:00'],
      facebook: ['09:00', '13:00', '15:00', '19:00', '21:00'],
      instagram: ['11:00', '13:00', '17:00', '19:00', '21:00'],
      threads: ['10:00', '14:00', '18:00', '20:00'],
      bluesky: ['09:00', '12:00', '16:00', '20:00']
    };

    return defaults[platform as keyof typeof defaults] || defaults.twitter;
  }

  private getDefaultContentLength(platform: string): { min: number; max: number } {
    const defaults = {
      twitter: { min: 100, max: 280 },
      linkedin: { min: 150, max: 3000 },
      facebook: { min: 100, max: 2000 },
      instagram: { min: 100, max: 2200 },
      threads: { min: 50, max: 500 },
      bluesky: { min: 50, max: 300 }
    };

    return defaults[platform as keyof typeof defaults] || defaults.twitter;
  }

  private getDefaultContentTypes(platform: string): string[] {
    const defaults = {
      twitter: ['text', 'image', 'thread', 'poll'],
      linkedin: ['article', 'image', 'video', 'document'],
      facebook: ['image', 'video', 'text', 'link'],
      instagram: ['image', 'video', 'story', 'reel'],
      threads: ['text', 'image', 'video'],
      bluesky: ['text', 'image', 'link']
    };

    return defaults[platform as keyof typeof defaults] || defaults.twitter;
  }

  private getDefaultHashtagCount(platform: string): number {
    const defaults = {
      twitter: 3,
      linkedin: 5,
      facebook: 3,
      instagram: 10,
      threads: 3,
      bluesky: 3
    };

    return defaults[platform as keyof typeof defaults] || 3;
  }

  // Public utility methods
  getPlatformStatus(platform: string): SocialPlatformConfig | null {
    return this.platformConfigs.get(platform) || null;
  }

  getConnectedPlatforms(): string[] {
    return Array.from(this.platformConfigs.values())
      .filter(config => config.isConnected)
      .map(config => config.platform);
  }

  async refreshPlatformData(platform: string): Promise<void> {
    const config = this.platformConfigs.get(platform);
    if (config?.isConnected) {
      config.lastSync = new Date();
      // Trigger data refresh for the platform
      await this.fetchEngagementData(platform, []);
      await this.fetchTrendingTopics([platform]);
    }
  }
}

// Export singleton instance
export const socialPlatformService = new SocialPlatformService();
export default socialPlatformService;