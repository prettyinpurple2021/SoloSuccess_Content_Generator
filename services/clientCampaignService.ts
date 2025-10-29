// Client-safe campaign service that uses HTTP endpoints instead of direct database access
import { Campaign, ContentSeries, Post, CampaignMetrics } from '../types';
import { apiService } from './clientApiService';

const API_BASE_URL = '/api';

export class CampaignService {
  // Campaign Management Functions

  /**
   * Creates a new campaign with specified parameters
   */
  async createCampaign(userId: string, campaignData: {
    name: string;
    description: string;
    theme: string;
    startDate: Date;
    endDate: Date;
    platforms: string[];
  }): Promise<Campaign> {
    try {
      const campaign = await apiService.addCampaign(userId, {
        name: campaignData.name,
        description: campaignData.description,
        theme: campaignData.theme,
        start_date: campaignData.startDate.toISOString(),
        end_date: campaignData.endDate.toISOString(),
        platforms: campaignData.platforms,
        status: 'draft',
        performance: {
          totalReach: 0,
          totalEngagement: 0,
          totalClicks: 0,
          avgEngagementRate: 0,
          platformMetrics: {},
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      return this.transformDatabaseCampaignToCampaign(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw new Error('Failed to create campaign');
    }
  }

  /**
   * Retrieves all campaigns for a user
   */
  async getCampaigns(userId: string): Promise<Campaign[]> {
    try {
      const campaigns = await apiService.getCampaigns(userId);
      return campaigns.map(this.transformDatabaseCampaignToCampaign);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw new Error('Failed to fetch campaigns');
    }
  }

  /**
   * Updates an existing campaign
   */
  async updateCampaign(userId: string, campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    try {
      const updatedCampaign = await apiService.updateCampaign(userId, campaignId, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      return this.transformDatabaseCampaignToCampaign(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw new Error('Failed to update campaign');
    }
  }

  /**
   * Deletes a campaign
   */
  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    try {
      await apiService.deleteCampaign(userId, campaignId);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw new Error('Failed to delete campaign');
    }
  }

  /**
   * Creates a content series within a campaign
   */
  async createContentSeries(userId: string, campaignId: string, seriesData: {
    title: string;
    description: string;
    theme: string;
    duration: number; // in days
    postingFrequency: number; // posts per week
    platforms: string[];
  }): Promise<ContentSeries> {
    try {
      // For now, we'll create a simple series structure
      // In a full implementation, this would create a series in the database
      const series: ContentSeries = {
        id: `series_${Date.now()}`,
        campaignId,
        title: seriesData.title,
        description: seriesData.description,
        theme: seriesData.theme,
        duration: seriesData.duration,
        postingFrequency: seriesData.postingFrequency,
        platforms: seriesData.platforms,
        status: 'draft',
        posts: [],
        metrics: {
          totalPosts: 0,
          totalReach: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          completionRate: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return series;
    } catch (error) {
      console.error('Error creating content series:', error);
      throw new Error('Failed to create content series');
    }
  }

  /**
   * Gets campaign metrics
   */
  async getCampaignMetrics(userId: string, campaignId: string): Promise<CampaignMetrics> {
    // For now, return minimal structure matching CampaignMetrics
    // In a full implementation, this would aggregate real metrics from analytics
    return {
      totalPosts: 0,
      totalEngagement: 0,
      avgEngagementRate: 0,
      platformPerformance: {},
    };
  }

  /**
   * Transforms database campaign to Campaign type
   */
  private transformDatabaseCampaignToCampaign(dbCampaign: any): Campaign {
    return {
      id: dbCampaign.id,
      name: dbCampaign.name,
      description: dbCampaign.description,
      theme: dbCampaign.theme,
      startDate: new Date(dbCampaign.start_date),
      endDate: new Date(dbCampaign.end_date),
      platforms: dbCampaign.platforms || [],
      status: dbCampaign.status || 'draft',
      performance: dbCampaign.performance || {
        totalReach: 0,
        totalEngagement: 0,
        totalClicks: 0,
        avgEngagementRate: 0,
        platformMetrics: {},
      },
      createdAt: new Date(dbCampaign.created_at),
      updatedAt: new Date(dbCampaign.updated_at),
    };
  }
}

// Export a singleton instance
export const campaignService = new CampaignService();
