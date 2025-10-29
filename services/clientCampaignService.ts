// Client-safe campaign service that uses HTTP endpoints instead of direct database access
import { Campaign, ContentSeries, CampaignMetrics, DatabaseCampaign } from '../types';
import { apiService } from './clientApiService';

export class CampaignService {
  // Campaign Management Functions

  /**
   * Creates a new campaign with specified parameters
   */
  async createCampaign(
    userId: string,
    campaignData: {
      name: string;
      description: string;
      theme: string;
      startDate: Date;
      endDate: Date;
      platforms: string[];
    }
  ): Promise<Campaign> {
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
          totalPosts: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          platformPerformance: {},
        } as CampaignMetrics,
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
  async updateCampaign(
    userId: string,
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
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
  async createContentSeries(
    userId: string,
    campaignId: string,
    seriesData: {
      title: string;
      theme: string;
      postingFrequency: number; // posts per week
    }
  ): Promise<ContentSeries> {
    try {
      const frequency: 'daily' | 'weekly' | 'biweekly' =
        seriesData.postingFrequency >= 7
          ? 'daily'
          : seriesData.postingFrequency >= 2
            ? 'weekly'
            : 'biweekly';

      const series: ContentSeries = {
        id: `series_${Date.now()}`,
        campaignId,
        name: seriesData.title,
        theme: seriesData.theme,
        totalPosts: 0,
        frequency,
        currentPost: 0,
        posts: [],
        createdAt: new Date(),
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
  async getCampaignMetrics(): Promise<CampaignMetrics> {
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
  private transformDatabaseCampaignToCampaign(dbCampaign: DatabaseCampaign): Campaign {
    return {
      id: dbCampaign.id,
      name: dbCampaign.name,
      description: dbCampaign.description,
      theme: dbCampaign.theme,
      startDate: new Date(dbCampaign.start_date),
      endDate: new Date(dbCampaign.end_date),
      posts: [],
      platforms: dbCampaign.platforms || [],
      status: dbCampaign.status || 'draft',
      performance: dbCampaign.performance || {
        totalPosts: 0,
        totalEngagement: 0,
        avgEngagementRate: 0,
        platformPerformance: {},
      },
      createdAt: new Date(dbCampaign.created_at),
    };
  }
}

// Export a singleton instance
export const campaignService = new CampaignService();
