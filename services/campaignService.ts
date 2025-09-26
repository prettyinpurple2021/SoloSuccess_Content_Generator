import { 
  Campaign, 
  ContentSeries, 
  Post, 
  CampaignMetrics,
  PlatformMetrics,
  SeriesPost,
  AnalyticsData
} from '../types';
import { db } from './supabaseService';
import { analyticsService } from './analyticsService';

/**
 * Campaign Service for managing campaigns, content series, and coordinating
 * content across multiple platforms
 */
export class CampaignService {

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: {
    name: string;
    description: string;
    theme: string;
    startDate: Date;
    endDate: Date;
    platforms: string[];
  }): Promise<Campaign> {
    try {
      const campaign = await db.addCampaign({
        name: campaignData.name,
        description: campaignData.description,
        theme: campaignData.theme,
        start_date: campaignData.startDate.toISOString(),
        end_date: campaignData.endDate.toISOString(),
        platforms: campaignData.platforms,
        status: 'draft',
        performance: {
          totalPosts: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          platformPerformance: {}
        }
      });

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error('Failed to create campaign');
    }
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(
    campaignId: string, 
    updates: Partial<{
      name: string;
      description: string;
      theme: string;
      startDate: Date;
      endDate: Date;
      platforms: string[];
      status: 'draft' | 'active' | 'completed' | 'paused';
    }>
  ): Promise<Campaign> {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description) dbUpdates.description = updates.description;
      if (updates.theme) dbUpdates.theme = updates.theme;
      if (updates.startDate) dbUpdates.start_date = updates.startDate.toISOString();
      if (updates.endDate) dbUpdates.end_date = updates.endDate.toISOString();
      if (updates.platforms) dbUpdates.platforms = updates.platforms;
      if (updates.status) dbUpdates.status = updates.status;

      return await db.updateCampaign(campaignId, dbUpdates);
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error('Failed to update campaign');
    }
  }

  /**
   * Get all campaigns for the current user
   */
  async getCampaigns(): Promise<Campaign[]> {
    try {
      const campaigns = await db.getCampaigns();
      
      // Populate posts for each campaign
      const posts = await db.getPosts();
      
      return campaigns.map(campaign => ({
        ...campaign,
        posts: posts
          .filter(post => post.campaignId === campaign.id)
          .map(post => post.id)
      }));
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw new Error('Failed to get campaigns');
    }
  }

  /**
   * Get a specific campaign by ID
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const campaigns = await this.getCampaigns();
      return campaigns.find(campaign => campaign.id === campaignId) || null;
    } catch (error) {
      console.error('Error getting campaign:', error);
      throw new Error('Failed to get campaign');
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    try {
      // First, remove campaign association from posts
      const posts = await db.getPosts();
      const campaignPosts = posts.filter(post => post.campaignId === campaignId);
      
      for (const post of campaignPosts) {
        await db.updatePost(post.id, { campaign_id: null });
      }

      // Delete associated content series
      const series = await db.getContentSeries();
      const campaignSeries = series.filter(s => s.campaignId === campaignId);
      
      for (const s of campaignSeries) {
        await db.deleteContentSeries(s.id);
      }

      // Delete the campaign
      await db.deleteCampaign(campaignId);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw new Error('Failed to delete campaign');
    }
  }

  /**
   * Add posts to a campaign
   */
  async addPostsToCampaign(campaignId: string, postIds: string[]): Promise<void> {
    try {
      for (const postId of postIds) {
        await db.updatePost(postId, { campaign_id: campaignId });
      }
    } catch (error) {
      console.error('Error adding posts to campaign:', error);
      throw new Error('Failed to add posts to campaign');
    }
  }

  /**
   * Remove posts from a campaign
   */
  async removePostsFromCampaign(postIds: string[]): Promise<void> {
    try {
      for (const postId of postIds) {
        await db.updatePost(postId, { campaign_id: null });
      }
    } catch (error) {
      console.error('Error removing posts from campaign:', error);
      throw new Error('Failed to remove posts from campaign');
    }
  }

  /**
   * Create a content series within a campaign
   */
  async createContentSeries(seriesData: {
    campaignId?: string;
    name: string;
    theme: string;
    totalPosts: number;
    frequency: 'daily' | 'weekly' | 'biweekly';
  }): Promise<ContentSeries> {
    try {
      const series = await db.addContentSeries({
        campaign_id: seriesData.campaignId,
        name: seriesData.name,
        theme: seriesData.theme,
        total_posts: seriesData.totalPosts,
        frequency: seriesData.frequency,
        current_post: 0
      });

      return {
        ...series,
        posts: [] // Will be populated as posts are added
      };
    } catch (error) {
      console.error('Error creating content series:', error);
      throw new Error('Failed to create content series');
    }
  }

  /**
   * Update a content series
   */
  async updateContentSeries(
    seriesId: string,
    updates: Partial<{
      name: string;
      theme: string;
      totalPosts: number;
      frequency: 'daily' | 'weekly' | 'biweekly';
      currentPost: number;
    }>
  ): Promise<ContentSeries> {
    try {
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.theme) dbUpdates.theme = updates.theme;
      if (updates.totalPosts) dbUpdates.total_posts = updates.totalPosts;
      if (updates.frequency) dbUpdates.frequency = updates.frequency;
      if (updates.currentPost !== undefined) dbUpdates.current_post = updates.currentPost;

      const updatedSeries = await db.updateContentSeries(seriesId, dbUpdates);
      
      // Get associated posts
      const posts = await db.getPosts();
      const seriesPosts = posts.filter(post => post.seriesId === seriesId);
      
      return {
        ...updatedSeries,
        posts: seriesPosts.map((post, index) => ({
          id: post.id,
          seriesId: seriesId,
          postId: post.id,
          sequenceNumber: index + 1,
          title: post.topic,
          status: post.status,
          scheduledDate: post.scheduleDate
        }))
      };
    } catch (error) {
      console.error('Error updating content series:', error);
      throw new Error('Failed to update content series');
    }
  }

  /**
   * Get all content series
   */
  async getContentSeries(): Promise<ContentSeries[]> {
    try {
      const series = await db.getContentSeries();
      const posts = await db.getPosts();
      
      return series.map(s => ({
        ...s,
        posts: posts
          .filter(post => post.seriesId === s.id)
          .map((post, index) => ({
            id: post.id,
            seriesId: s.id,
            postId: post.id,
            sequenceNumber: index + 1,
            title: post.topic,
            status: post.status,
            scheduledDate: post.scheduleDate
          }))
      }));
    } catch (error) {
      console.error('Error getting content series:', error);
      throw new Error('Failed to get content series');
    }
  }

  /**
   * Get content series by campaign ID
   */
  async getContentSeriesByCampaign(campaignId: string): Promise<ContentSeries[]> {
    try {
      const allSeries = await this.getContentSeries();
      return allSeries.filter(series => series.campaignId === campaignId);
    } catch (error) {
      console.error('Error getting content series by campaign:', error);
      throw new Error('Failed to get content series by campaign');
    }
  }

  /**
   * Add posts to a content series
   */
  async addPostsToSeries(seriesId: string, postIds: string[]): Promise<void> {
    try {
      for (const postId of postIds) {
        await db.updatePost(postId, { series_id: seriesId });
      }

      // Update current post count
      const series = await db.getContentSeries();
      const targetSeries = series.find(s => s.id === seriesId);
      if (targetSeries) {
        const posts = await db.getPosts();
        const seriesPosts = posts.filter(post => post.seriesId === seriesId);
        
        await db.updateContentSeries(seriesId, {
          current_post: seriesPosts.length
        });
      }
    } catch (error) {
      console.error('Error adding posts to series:', error);
      throw new Error('Failed to add posts to series');
    }
  }

  /**
   * Generate suggested posting schedule for a series
   */
  async generateSeriesSchedule(
    seriesId: string,
    startDate: Date,
    platforms: string[]
  ): Promise<{ postId: string; suggestedDate: Date; platform: string }[]> {
    try {
      const series = await this.getContentSeries();
      const targetSeries = series.find(s => s.id === seriesId);
      
      if (!targetSeries) {
        throw new Error('Content series not found');
      }

      const schedule: { postId: string; suggestedDate: Date; platform: string }[] = [];
      let currentDate = new Date(startDate);

      // Calculate interval based on frequency
      let intervalDays: number;
      switch (targetSeries.frequency) {
        case 'daily':
          intervalDays = 1;
          break;
        case 'weekly':
          intervalDays = 7;
          break;
        case 'biweekly':
          intervalDays = 14;
          break;
        default:
          intervalDays = 7;
      }

      // Generate schedule for each post in the series
      targetSeries.posts.forEach((seriesPost, index) => {
        platforms.forEach(platform => {
          const scheduledDate = new Date(currentDate);
          scheduledDate.setDate(currentDate.getDate() + (index * intervalDays));
          
          schedule.push({
            postId: seriesPost.postId,
            suggestedDate: scheduledDate,
            platform
          });
        });
      });

      return schedule;
    } catch (error) {
      console.error('Error generating series schedule:', error);
      throw new Error('Failed to generate series schedule');
    }
  }

  /**
   * Track campaign performance and update metrics
   */
  async updateCampaignPerformance(campaignId: string): Promise<CampaignMetrics> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const posts = await db.getPosts();
      const campaignPosts = posts.filter(post => post.campaignId === campaignId);
      
      let totalEngagement = 0;
      let totalImpressions = 0;
      const platformPerformance: { [platform: string]: PlatformMetrics } = {};

      // Initialize platform metrics
      campaign.platforms.forEach(platform => {
        platformPerformance[platform] = {
          posts: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          avgEngagementRate: 0
        };
      });

      // Collect analytics for all campaign posts
      for (const post of campaignPosts) {
        const postAnalytics = await db.getPostAnalytics(post.id);
        
        postAnalytics.forEach(analytics => {
          const engagement = analytics.likes + analytics.shares + analytics.comments + analytics.clicks;
          totalEngagement += engagement;
          totalImpressions += analytics.impressions;

          if (platformPerformance[analytics.platform]) {
            platformPerformance[analytics.platform].posts += 1;
            platformPerformance[analytics.platform].totalLikes += analytics.likes;
            platformPerformance[analytics.platform].totalShares += analytics.shares;
            platformPerformance[analytics.platform].totalComments += analytics.comments;
          }
        });
      }

      // Calculate platform engagement rates
      Object.keys(platformPerformance).forEach(platform => {
        const platformAnalytics = campaignPosts.flatMap(post => 
          db.getPostAnalytics(post.id).then(analytics => 
            analytics.filter(a => a.platform === platform)
          )
        );
        
        // This is a simplified calculation - in a real implementation,
        // you'd want to properly await the analytics data
        const platformImpressions = 1000; // Placeholder
        const platformEngagement = platformPerformance[platform].totalLikes + 
          platformPerformance[platform].totalShares + 
          platformPerformance[platform].totalComments;
        
        platformPerformance[platform].avgEngagementRate = 
          platformImpressions > 0 ? (platformEngagement / platformImpressions) * 100 : 0;
      });

      // Find top performing post
      let topPerformingPost: string | undefined;
      let maxEngagement = 0;

      for (const post of campaignPosts) {
        const postAnalytics = await db.getPostAnalytics(post.id);
        const postEngagement = postAnalytics.reduce((sum, analytics) => 
          sum + analytics.likes + analytics.shares + analytics.comments + analytics.clicks, 0);
        
        if (postEngagement > maxEngagement) {
          maxEngagement = postEngagement;
          topPerformingPost = post.id;
        }
      }

      const metrics: CampaignMetrics = {
        totalPosts: campaignPosts.length,
        totalEngagement,
        avgEngagementRate: totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0,
        topPerformingPost,
        platformPerformance
      };

      // Update campaign with new metrics
      await db.updateCampaign(campaignId, {
        performance: metrics
      });

      return metrics;
    } catch (error) {
      console.error('Error updating campaign performance:', error);
      throw new Error('Failed to update campaign performance');
    }
  }

  /**
   * Get campaign performance analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    metrics: CampaignMetrics;
    timeline: { date: Date; engagement: number; impressions: number }[];
    topPosts: { postId: string; title: string; engagement: number }[];
  }> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const posts = await db.getPosts();
      const campaignPosts = posts.filter(post => post.campaignId === campaignId);
      
      // Update performance metrics
      const metrics = await this.updateCampaignPerformance(campaignId);

      // Generate timeline data
      const timeline: { date: Date; engagement: number; impressions: number }[] = [];
      const timelineData: { [dateKey: string]: { engagement: number; impressions: number } } = {};

      for (const post of campaignPosts) {
        const postAnalytics = await db.getPostAnalytics(post.id);
        
        postAnalytics.forEach(analytics => {
          const dateKey = analytics.recordedAt.toISOString().split('T')[0];
          const engagement = analytics.likes + analytics.shares + analytics.comments + analytics.clicks;
          
          if (!timelineData[dateKey]) {
            timelineData[dateKey] = { engagement: 0, impressions: 0 };
          }
          
          timelineData[dateKey].engagement += engagement;
          timelineData[dateKey].impressions += analytics.impressions;
        });
      }

      Object.entries(timelineData).forEach(([dateKey, data]) => {
        timeline.push({
          date: new Date(dateKey),
          engagement: data.engagement,
          impressions: data.impressions
        });
      });

      timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Get top performing posts
      const topPosts: { postId: string; title: string; engagement: number }[] = [];
      
      for (const post of campaignPosts) {
        const postAnalytics = await db.getPostAnalytics(post.id);
        const totalEngagement = postAnalytics.reduce((sum, analytics) => 
          sum + analytics.likes + analytics.shares + analytics.comments + analytics.clicks, 0);
        
        topPosts.push({
          postId: post.id,
          title: post.topic,
          engagement: totalEngagement
        });
      }

      topPosts.sort((a, b) => b.engagement - a.engagement);

      return {
        metrics,
        timeline,
        topPosts: topPosts.slice(0, 5) // Top 5 posts
      };
    } catch (error) {
      console.error('Error getting campaign analytics:', error);
      throw new Error('Failed to get campaign analytics');
    }
  }

  /**
   * Coordinate content across platforms for a campaign
   */
  async coordinateCampaignContent(
    campaignId: string,
    coordinationSettings: {
      maintainConsistentMessaging: boolean;
      adaptForPlatformAudiences: boolean;
      staggerPostingTimes: boolean;
      crossPromote: boolean;
    }
  ): Promise<{
    recommendations: string[];
    schedulingConflicts: string[];
    messagingConsistency: { consistent: boolean; issues: string[] };
  }> {
    try {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const posts = await db.getPosts();
      const campaignPosts = posts.filter(post => post.campaignId === campaignId);
      
      const recommendations: string[] = [];
      const schedulingConflicts: string[] = [];
      const messagingIssues: string[] = [];

      // Check for scheduling conflicts
      if (coordinationSettings.staggerPostingTimes) {
        const scheduledPosts = campaignPosts.filter(post => post.scheduleDate);
        const timeSlots: { [timeKey: string]: string[] } = {};

        scheduledPosts.forEach(post => {
          if (post.scheduleDate) {
            const timeKey = post.scheduleDate.toISOString().slice(0, 13); // Hour precision
            if (!timeSlots[timeKey]) {
              timeSlots[timeKey] = [];
            }
            timeSlots[timeKey].push(post.id);
          }
        });

        Object.entries(timeSlots).forEach(([timeKey, postIds]) => {
          if (postIds.length > 1) {
            schedulingConflicts.push(
              `Multiple posts scheduled for ${new Date(timeKey).toLocaleString()}: ${postIds.length} posts`
            );
          }
        });

        if (schedulingConflicts.length === 0) {
          recommendations.push('Consider staggering post times by at least 2-3 hours for better reach');
        }
      }

      // Check messaging consistency
      if (coordinationSettings.maintainConsistentMessaging) {
        const themes = campaignPosts.map(post => post.content.toLowerCase());
        const campaignTheme = campaign.theme.toLowerCase();
        
        themes.forEach((content, index) => {
          if (!content.includes(campaignTheme) && !this.containsRelatedKeywords(content, campaignTheme)) {
            messagingIssues.push(`Post "${campaignPosts[index].topic}" may not align with campaign theme`);
          }
        });

        if (messagingIssues.length === 0) {
          recommendations.push('Campaign messaging is consistent across all posts');
        }
      }

      // Platform-specific recommendations
      if (coordinationSettings.adaptForPlatformAudiences) {
        campaign.platforms.forEach(platform => {
          const platformPosts = campaignPosts.filter(post => 
            post.socialMediaPosts && post.socialMediaPosts[platform]
          );
          
          if (platformPosts.length === 0) {
            recommendations.push(`Consider creating ${platform}-specific content for better engagement`);
          }
        });
      }

      // Cross-promotion recommendations
      if (coordinationSettings.crossPromote) {
        recommendations.push('Add cross-platform references to increase audience overlap');
        recommendations.push('Use consistent hashtags across platforms for campaign recognition');
      }

      return {
        recommendations,
        schedulingConflicts,
        messagingConsistency: {
          consistent: messagingIssues.length === 0,
          issues: messagingIssues
        }
      };
    } catch (error) {
      console.error('Error coordinating campaign content:', error);
      throw new Error('Failed to coordinate campaign content');
    }
  }

  /**
   * Delete a content series
   */
  async deleteContentSeries(seriesId: string): Promise<void> {
    try {
      // Remove series association from posts
      const posts = await db.getPosts();
      const seriesPosts = posts.filter(post => post.seriesId === seriesId);
      
      for (const post of seriesPosts) {
        await db.updatePost(post.id, { series_id: null });
      }

      // Delete the series
      await db.deleteContentSeries(seriesId);
    } catch (error) {
      console.error('Error deleting content series:', error);
      throw new Error('Failed to delete content series');
    }
  }

  // Private helper methods

  private containsRelatedKeywords(content: string, theme: string): boolean {
    // Simple keyword matching - in a real implementation, you might use NLP
    const themeWords = theme.split(' ');
    return themeWords.some(word => 
      word.length > 3 && content.includes(word)
    );
  }

  /**
   * Get campaign status summary
   */
  async getCampaignStatusSummary(): Promise<{
    total: number;
    active: number;
    draft: number;
    completed: number;
    paused: number;
  }> {
    try {
      const campaigns = await this.getCampaigns();
      
      return {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        draft: campaigns.filter(c => c.status === 'draft').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        paused: campaigns.filter(c => c.status === 'paused').length
      };
    } catch (error) {
      console.error('Error getting campaign status summary:', error);
      throw new Error('Failed to get campaign status summary');
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();