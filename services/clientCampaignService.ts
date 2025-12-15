import { Campaign, ContentSeries, CampaignMetrics, DatabaseCampaign } from '../types';
import { apiService } from './clientApiService';

export class CampaignService {
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
    const created = await apiService.addCampaign(userId, {
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
    return this.transformDatabaseCampaignToCampaign(created as DatabaseCampaign);
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    const rows = await apiService.getCampaigns(userId);
    return rows.map((r: DatabaseCampaign) => this.transformDatabaseCampaignToCampaign(r));
  }

  async updateCampaign(
    userId: string,
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    const updated = await apiService.updateCampaign(userId, campaignId, {
      name: updates.name,
      description: updates.description,
      theme: updates.theme,
      start_date: updates.startDate ? updates.startDate.toISOString() : undefined,
      end_date: updates.endDate ? updates.endDate.toISOString() : undefined,
      platforms: updates.platforms,
      status: updates.status,
      performance: updates.performance,
      updated_at: new Date().toISOString(),
    } as any);
    return this.transformDatabaseCampaignToCampaign(updated as DatabaseCampaign);
  }

  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    await apiService.deleteCampaign(userId, campaignId);
  }

  async createContentSeries(
    userIdOrData: string | { title: string; theme: string; postingFrequency: number },
    campaignIdOrData?: string | { title: string; theme: string; postingFrequency: number },
    seriesData?: { title: string; theme: string; postingFrequency: number }
  ): Promise<ContentSeries> {
    // Handle overloaded signatures
    let actualSeriesData: { title: string; theme: string; postingFrequency: number };
    let actualCampaignId = '';

    if (typeof userIdOrData === 'object') {
      // Called with just seriesData as first arg
      actualSeriesData = userIdOrData;
    } else if (typeof campaignIdOrData === 'object') {
      // Called with userId, seriesData (or userId, campaignId, seriesData where campaignId is missing)
      actualSeriesData = campaignIdOrData;
      actualCampaignId = '';
    } else if (seriesData) {
      // Called with userId, campaignId, seriesData
      actualSeriesData = seriesData;
      actualCampaignId = campaignIdOrData as string;
    } else {
      actualSeriesData = { title: '', theme: '', postingFrequency: 1 };
    }

    const frequency: 'daily' | 'weekly' | 'biweekly' =
      actualSeriesData.postingFrequency >= 7
        ? 'daily'
        : actualSeriesData.postingFrequency >= 1
          ? 'weekly'
          : 'biweekly';
    return {
      id: `series_${Date.now()}`,
      campaignId: actualCampaignId,
      name: actualSeriesData.title,
      theme: actualSeriesData.theme,
      totalPosts: 0,
      frequency,
      currentPost: 0,
      posts: [],
      createdAt: new Date(),
    };
  }

  async getCampaignMetrics(): Promise<CampaignMetrics> {
    return {
      totalPosts: 0,
      totalEngagement: 0,
      avgEngagementRate: 0,
      platformPerformance: {},
    };
  }

  async getContentSeries(): Promise<ContentSeries[]> {
    // Placeholder implementation - would fetch from database
    return [];
  }

  async updateContentSeries(
    seriesId: string,
    updates: Partial<ContentSeries>
  ): Promise<ContentSeries> {
    // Placeholder implementation - would update in database
    return {
      id: seriesId,
      campaignId: '',
      name: updates.name || '',
      theme: updates.theme || '',
      totalPosts: updates.totalPosts || 0,
      frequency: updates.frequency || 'weekly',
      currentPost: updates.currentPost || 0,
      posts: updates.posts || [],
      createdAt: new Date(),
    };
  }

  async deleteContentSeries(seriesId: string, deleteAssociatedPosts?: boolean): Promise<void> {
    // Placeholder implementation - would delete from database
  }

  async suggestSeriesAdjustments(
    seriesId: string
  ): Promise<
    Array<{ type: string; title: string; description: string; priority: string; impact: number; effort: number }>
  > {
    // Placeholder implementation - would analyze series and return suggestions
    return [];
  }

  async optimizeSeriesScheduling(
    seriesId: string
  ): Promise<
    Array<{ date: string; suggestedTime: string; reason: string; postId: string; platform: string; confidence: number }>
  > {
    // Placeholder implementation - would suggest optimal scheduling
    return [];
  }

  async advanceContentSeries(seriesId: string): Promise<ContentSeries> {
    // Placeholder implementation - would advance to next post in series
    return {
      id: seriesId,
      campaignId: '',
      name: '',
      theme: '',
      totalPosts: 0,
      frequency: 'weekly',
      currentPost: 1,
      posts: [],
      createdAt: new Date(),
    };
  }

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
      status: dbCampaign.status,
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

export const campaignService = new CampaignService();
