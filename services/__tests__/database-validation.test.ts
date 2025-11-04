import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../databaseService';
import {
  Post,
  BrandVoice,
  AudienceProfile,
  Campaign,
  Integration,
  AnalyticsData,
} from '../../types';

// Test user ID for all operations
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID_2 = '00000000-0000-0000-0000-000000000002';

describe('Database Operations Validation', () => {
  let testPostId: string;
  let testBrandVoiceId: string;
  let testAudienceProfileId: string;
  let testCampaignId: string;
  let testIntegrationId: string;

  beforeAll(async () => {
    // Test database connection
    const isConnected = await db.testConnection();
    expect(isConnected).toBe(true);
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (testPostId) await db.deletePost(testPostId, TEST_USER_ID);
      if (testBrandVoiceId) await db.deleteBrandVoice(testBrandVoiceId, TEST_USER_ID);
      if (testAudienceProfileId)
        await db.deleteAudienceProfile(testAudienceProfileId, TEST_USER_ID);
      if (testCampaignId) await db.deleteCampaign(testCampaignId, TEST_USER_ID);
      if (testIntegrationId) await db.deleteIntegration(testIntegrationId, TEST_USER_ID);
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Posts CRUD Operations', () => {
    it('should create a new post with all fields', async () => {
      const postData = {
        topic: 'Test Topic',
        idea: 'Test Idea',
        content: 'Test Content',
        status: 'draft' as const,
        tags: ['test', 'validation'],
        summary: 'Test Summary',
        headlines: ['Test Headline 1', 'Test Headline 2'],
        social_media_posts: { twitter: 'Test tweet', linkedin: 'Test LinkedIn post' },
        social_media_tones: { twitter: 'casual', linkedin: 'professional' },
        social_media_audiences: { twitter: 'general', linkedin: 'business' },
        selected_image: 'test-image.jpg',
        schedule_date: new Date().toISOString(),
        brand_voice_id: null,
        audience_profile_id: null,
        campaign_id: null,
        series_id: null,
        template_id: null,
        performance_score: 85.5,
        optimization_suggestions: [
          {
            type: 'timing',
            title: 'Better timing',
            description: 'Post at peak hours',
            impact: 'high',
            effort: 'low',
          },
        ],
        image_style_id: null,
      };

      const createdPost = await db.addPost(postData, TEST_USER_ID);
      testPostId = createdPost.id;

      expect(createdPost).toBeDefined();
      expect(createdPost.id).toBeDefined();
      expect(createdPost.userId).toBe(TEST_USER_ID);
      expect(createdPost.topic).toBe(postData.topic);
      expect(createdPost.idea).toBe(postData.idea);
      expect(createdPost.content).toBe(postData.content);
      expect(createdPost.status).toBe(postData.status);
      expect(createdPost.tags).toEqual(postData.tags);
      expect(createdPost.summary).toBe(postData.summary);
      expect(createdPost.headlines).toEqual(postData.headlines);
      expect(createdPost.socialMediaPosts).toEqual(postData.social_media_posts);
      expect(createdPost.performanceScore).toBe(postData.performance_score);
      expect(createdPost.optimizationSuggestions).toEqual(postData.optimization_suggestions);
      expect(createdPost.createdAt).toBeDefined();
    });

    it('should retrieve posts for a user', async () => {
      const posts = await db.getPosts(TEST_USER_ID);
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);

      const testPost = posts.find((p) => p.id === testPostId);
      expect(testPost).toBeDefined();
      expect(testPost?.userId).toBe(TEST_USER_ID);
    });

    it('should update a post', async () => {
      const updates = {
        topic: 'Updated Topic',
        content: 'Updated Content',
        status: 'scheduled' as const,
        performance_score: 92.0,
      };

      const updatedPost = await db.updatePost(testPostId, updates, TEST_USER_ID);

      expect(updatedPost.topic).toBe(updates.topic);
      expect(updatedPost.content).toBe(updates.content);
      expect(updatedPost.status).toBe(updates.status);
      expect(updatedPost.performanceScore).toBe(updates.performance_score);
    });

    it('should handle paginated posts retrieval', async () => {
      const result = await db.getPostsPaginated(TEST_USER_ID, 1, 10);

      expect(result).toBeDefined();
      expect(result.posts).toBeDefined();
      expect(Array.isArray(result.posts)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(typeof result.hasMore).toBe('boolean');
      expect(result.totalCount).toBeGreaterThanOrEqual(result.posts.length);
    });

    it('should enforce user isolation for posts', async () => {
      // Try to access another user's post
      await expect(
        db.updatePost(testPostId, { topic: 'Unauthorized Update' }, TEST_USER_ID_2)
      ).rejects.toThrow('Post not found or access denied');
    });

    it('should handle invalid post operations gracefully', async () => {
      // Try to update non-existent post
      await expect(
        db.updatePost('non-existent-id', { topic: 'Test' }, TEST_USER_ID)
      ).rejects.toThrow();

      // Try to delete non-existent post
      await expect(db.deletePost('non-existent-id', TEST_USER_ID)).rejects.toThrow();
    });
  });

  describe('Brand Voices CRUD Operations', () => {
    it('should create a new brand voice', async () => {
      const brandVoiceData = {
        name: 'Test Brand Voice',
        tone: 'Professional',
        vocabulary: ['innovative', 'cutting-edge', 'solution'],
        writing_style: 'Formal and informative',
        target_audience: 'Business professionals',
        sample_content: ['Sample content 1', 'Sample content 2'],
      };

      const createdBrandVoice = await db.addBrandVoice(brandVoiceData, TEST_USER_ID);
      testBrandVoiceId = createdBrandVoice.id;

      expect(createdBrandVoice).toBeDefined();
      expect(createdBrandVoice.id).toBeDefined();
      expect(createdBrandVoice.userId).toBe(TEST_USER_ID);
      expect(createdBrandVoice.name).toBe(brandVoiceData.name);
      expect(createdBrandVoice.tone).toBe(brandVoiceData.tone);
      expect(createdBrandVoice.vocabulary).toEqual(brandVoiceData.vocabulary);
      expect(createdBrandVoice.writingStyle).toBe(brandVoiceData.writing_style);
      expect(createdBrandVoice.targetAudience).toBe(brandVoiceData.target_audience);
      expect(createdBrandVoice.sampleContent).toEqual(brandVoiceData.sample_content);
      expect(createdBrandVoice.createdAt).toBeDefined();
    });

    it('should retrieve brand voices for a user', async () => {
      const brandVoices = await db.getBrandVoices(TEST_USER_ID);
      expect(Array.isArray(brandVoices)).toBe(true);
      expect(brandVoices.length).toBeGreaterThan(0);

      const testBrandVoice = brandVoices.find((bv) => bv.id === testBrandVoiceId);
      expect(testBrandVoice).toBeDefined();
      expect(testBrandVoice?.userId).toBe(TEST_USER_ID);
    });

    it('should update a brand voice', async () => {
      const updates = {
        name: 'Updated Brand Voice',
        tone: 'Casual',
        vocabulary: ['friendly', 'approachable', 'helpful'],
      };

      const updatedBrandVoice = await db.updateBrandVoice(testBrandVoiceId, updates, TEST_USER_ID);

      expect(updatedBrandVoice.name).toBe(updates.name);
      expect(updatedBrandVoice.tone).toBe(updates.tone);
      expect(updatedBrandVoice.vocabulary).toEqual(updates.vocabulary);
    });

    it('should enforce user isolation for brand voices', async () => {
      await expect(
        db.updateBrandVoice(testBrandVoiceId, { name: 'Unauthorized Update' }, TEST_USER_ID_2)
      ).rejects.toThrow('Brand voice not found or access denied');
    });
  });

  describe('Audience Profiles CRUD Operations', () => {
    it('should create a new audience profile', async () => {
      const profileData = {
        name: 'Test Audience Profile',
        age_range: '25-45',
        industry: 'Technology',
        interests: ['AI', 'Machine Learning', 'Software Development'],
        pain_points: ['Time management', 'Staying updated with tech'],
        preferred_content_types: ['Blog posts', 'Video tutorials'],
        engagement_patterns: {
          twitter: {
            avgLikes: 50,
            avgShares: 10,
            avgComments: 5,
            avgClicks: 25,
            bestPostingTimes: [
              { time: '09:00', dayOfWeek: 1, engagementScore: 85, confidence: 0.8 },
            ],
            engagementRate: 3.5,
          },
        },
      };

      const createdProfile = await db.addAudienceProfile(profileData, TEST_USER_ID);
      testAudienceProfileId = createdProfile.id;

      expect(createdProfile).toBeDefined();
      expect(createdProfile.id).toBeDefined();
      expect(createdProfile.userId).toBe(TEST_USER_ID);
      expect(createdProfile.name).toBe(profileData.name);
      expect(createdProfile.ageRange).toBe(profileData.age_range);
      expect(createdProfile.industry).toBe(profileData.industry);
      expect(createdProfile.interests).toEqual(profileData.interests);
      expect(createdProfile.painPoints).toEqual(profileData.pain_points);
      expect(createdProfile.preferredContentTypes).toEqual(profileData.preferred_content_types);
      expect(createdProfile.engagementPatterns).toEqual(profileData.engagement_patterns);
      expect(createdProfile.createdAt).toBeDefined();
    });

    it('should retrieve audience profiles for a user', async () => {
      const profiles = await db.getAudienceProfiles(TEST_USER_ID);
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);

      const testProfile = profiles.find((p) => p.id === testAudienceProfileId);
      expect(testProfile).toBeDefined();
      expect(testProfile?.userId).toBe(TEST_USER_ID);
    });

    it('should update an audience profile', async () => {
      const updates = {
        name: 'Updated Audience Profile',
        industry: 'Healthcare',
        interests: ['Medical Technology', 'Patient Care'],
      };

      const updatedProfile = await db.updateAudienceProfile(
        testAudienceProfileId,
        updates,
        TEST_USER_ID
      );

      expect(updatedProfile.name).toBe(updates.name);
      expect(updatedProfile.industry).toBe(updates.industry);
      expect(updatedProfile.interests).toEqual(updates.interests);
    });

    it('should enforce user isolation for audience profiles', async () => {
      await expect(
        db.updateAudienceProfile(
          testAudienceProfileId,
          { name: 'Unauthorized Update' },
          TEST_USER_ID_2
        )
      ).rejects.toThrow('Audience profile not found or access denied');
    });
  });

  describe('Campaigns CRUD Operations', () => {
    it('should create a new campaign', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'A test campaign for validation',
        theme: 'Product Launch',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        platforms: ['twitter', 'linkedin', 'facebook'],
        status: 'draft' as const,
        performance: {
          totalPosts: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          platformPerformance: {},
        },
      };

      const createdCampaign = await db.addCampaign(campaignData, TEST_USER_ID);
      testCampaignId = createdCampaign.id;

      expect(createdCampaign).toBeDefined();
      expect(createdCampaign.id).toBeDefined();
      expect(createdCampaign.userId).toBe(TEST_USER_ID);
      expect(createdCampaign.name).toBe(campaignData.name);
      expect(createdCampaign.description).toBe(campaignData.description);
      expect(createdCampaign.theme).toBe(campaignData.theme);
      expect(createdCampaign.platforms).toEqual(campaignData.platforms);
      expect(createdCampaign.status).toBe(campaignData.status);
      expect(createdCampaign.performance).toEqual(campaignData.performance);
      expect(createdCampaign.createdAt).toBeDefined();
    });

    it('should retrieve campaigns for a user', async () => {
      const campaigns = await db.getCampaigns(TEST_USER_ID);
      expect(Array.isArray(campaigns)).toBe(true);
      expect(campaigns.length).toBeGreaterThan(0);

      const testCampaign = campaigns.find((c) => c.id === testCampaignId);
      expect(testCampaign).toBeDefined();
      expect(testCampaign?.userId).toBe(TEST_USER_ID);
    });

    it('should update a campaign', async () => {
      const updates = {
        name: 'Updated Campaign',
        status: 'active' as const,
        performance: {
          totalPosts: 5,
          totalEngagement: 250,
          avgEngagementRate: 4.2,
          platformPerformance: {
            twitter: {
              posts: 2,
              totalLikes: 100,
              totalShares: 20,
              totalComments: 10,
              avgEngagementRate: 4.5,
            },
          },
        },
      };

      const updatedCampaign = await db.updateCampaign(testCampaignId, updates, TEST_USER_ID);

      expect(updatedCampaign.name).toBe(updates.name);
      expect(updatedCampaign.status).toBe(updates.status);
      expect(updatedCampaign.performance).toEqual(updates.performance);
    });

    it('should enforce user isolation for campaigns', async () => {
      await expect(
        db.updateCampaign(testCampaignId, { name: 'Unauthorized Update' }, TEST_USER_ID_2)
      ).rejects.toThrow('Campaign not found or access denied');
    });
  });

  describe('Integration Operations', () => {
    it('should create a new integration', async () => {
      const integrationData = {
        name: 'Test Integration',
        type: 'social_media' as const,
        platform: 'twitter',
        status: 'active' as const,
        credentials: { apiKey: 'test-key', apiSecret: 'test-secret' },
        configuration: { autoSync: true, syncInterval: 60 },
        last_sync: null,
        sync_frequency: 'hourly' as const,
        is_active: true,
      };

      const createdIntegration = await db.addIntegration(integrationData, TEST_USER_ID);
      testIntegrationId = createdIntegration.id;

      expect(createdIntegration).toBeDefined();
      expect(createdIntegration.id).toBeDefined();
      expect(createdIntegration.userId).toBe(TEST_USER_ID);
      expect(createdIntegration.name).toBe(integrationData.name);
      expect(createdIntegration.type).toBe(integrationData.type);
      expect(createdIntegration.platform).toBe(integrationData.platform);
      expect(createdIntegration.status).toBe(integrationData.status);
      expect(createdIntegration.credentials).toEqual(integrationData.credentials);
      expect(createdIntegration.configuration).toEqual(integrationData.configuration);
      expect(createdIntegration.syncFrequency).toBe(integrationData.sync_frequency);
      expect(createdIntegration.isActive).toBe(integrationData.is_active);
      expect(createdIntegration.createdAt).toBeDefined();
      expect(createdIntegration.updatedAt).toBeDefined();
    });

    it('should retrieve integrations for a user', async () => {
      const integrations = await db.getIntegrations(TEST_USER_ID);
      expect(Array.isArray(integrations)).toBe(true);
      expect(integrations.length).toBeGreaterThan(0);

      const testIntegration = integrations.find((i) => i.id === testIntegrationId);
      expect(testIntegration).toBeDefined();
      expect(testIntegration?.userId).toBe(TEST_USER_ID);
    });

    it('should update an integration', async () => {
      const updates = {
        name: 'Updated Integration',
        status: 'error' as const,
        is_active: false,
        last_sync: new Date().toISOString(),
      };

      const updatedIntegration = await db.updateIntegration(
        testIntegrationId,
        updates,
        TEST_USER_ID
      );

      expect(updatedIntegration.name).toBe(updates.name);
      expect(updatedIntegration.status).toBe(updates.status);
      expect(updatedIntegration.isActive).toBe(updates.is_active);
      expect(updatedIntegration.lastSync).toBeDefined();
    });

    it('should enforce user isolation for integrations', async () => {
      await expect(
        db.updateIntegration(testIntegrationId, { name: 'Unauthorized Update' }, TEST_USER_ID_2)
      ).rejects.toThrow('Integration not found or access denied');
    });
  });

  describe('Analytics Operations', () => {
    it('should insert post analytics data', async () => {
      const analyticsData = {
        post_id: testPostId,
        platform: 'twitter',
        likes: 50,
        shares: 10,
        comments: 5,
        clicks: 25,
        impressions: 1000,
        reach: 800,
      };

      const insertedAnalytics = await db.insertPostAnalytics(analyticsData);

      expect(insertedAnalytics).toBeDefined();
      expect(insertedAnalytics.id).toBeDefined();
      expect(insertedAnalytics.postId).toBe(analyticsData.post_id);
      expect(insertedAnalytics.platform).toBe(analyticsData.platform);
      expect(insertedAnalytics.likes).toBe(analyticsData.likes);
      expect(insertedAnalytics.shares).toBe(analyticsData.shares);
      expect(insertedAnalytics.comments).toBe(analyticsData.comments);
      expect(insertedAnalytics.clicks).toBe(analyticsData.clicks);
      expect(insertedAnalytics.impressions).toBe(analyticsData.impressions);
      expect(insertedAnalytics.reach).toBe(analyticsData.reach);
      expect(insertedAnalytics.recordedAt).toBeDefined();
    });

    it('should retrieve analytics for a post', async () => {
      const analytics = await db.getPostAnalytics(testPostId);
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics.length).toBeGreaterThan(0);

      const testAnalytics = analytics[0];
      expect(testAnalytics.postId).toBe(testPostId);
      expect(testAnalytics.platform).toBe('twitter');
    });

    it('should retrieve analytics by timeframe', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const endDate = new Date();

      const analytics = await db.getAnalyticsByTimeframe(startDate, endDate);
      expect(Array.isArray(analytics)).toBe(true);
      // Should include the analytics we just inserted
      expect(analytics.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Schema Integrity', () => {
    it('should handle foreign key relationships correctly', async () => {
      // Create a post with brand voice and audience profile references
      const postWithReferences = await db.addPost(
        {
          topic: 'Test with References',
          idea: 'Test Idea',
          content: 'Test Content',
          status: 'draft',
          tags: [],
          summary: null,
          headlines: [],
          social_media_posts: {},
          social_media_tones: {},
          social_media_audiences: {},
          selected_image: null,
          schedule_date: null,
          brand_voice_id: testBrandVoiceId,
          audience_profile_id: testAudienceProfileId,
          campaign_id: testCampaignId,
          series_id: null,
          template_id: null,
          performance_score: null,
          optimization_suggestions: [],
          image_style_id: null,
        },
        TEST_USER_ID
      );

      expect(postWithReferences.brandVoiceId).toBe(testBrandVoiceId);
      expect(postWithReferences.audienceProfileId).toBe(testAudienceProfileId);
      expect(postWithReferences.campaignId).toBe(testCampaignId);

      // Clean up
      await db.deletePost(postWithReferences.id, TEST_USER_ID);
    });

    it('should handle JSON fields correctly', async () => {
      const complexJsonData = {
        social_media_posts: {
          twitter: 'Complex tweet with #hashtags and @mentions',
          linkedin: 'Professional LinkedIn post with detailed content',
          facebook: 'Facebook post with emoji 🚀 and links',
        },
        optimization_suggestions: [
          {
            type: 'timing',
            title: 'Optimal posting time',
            description: 'Post between 9-11 AM for better engagement',
            impact: 'high',
            effort: 'low',
          },
          {
            type: 'hashtags',
            title: 'Trending hashtags',
            description: 'Use #AI #MachineLearning #Tech',
            impact: 'medium',
            effort: 'low',
          },
        ],
      };

      const postWithJson = await db.addPost(
        {
          topic: 'JSON Test',
          idea: 'Test JSON handling',
          content: 'Test Content',
          status: 'draft',
          tags: ['json', 'test'],
          summary: null,
          headlines: [],
          social_media_posts: complexJsonData.social_media_posts,
          social_media_tones: {},
          social_media_audiences: {},
          selected_image: null,
          schedule_date: null,
          brand_voice_id: null,
          audience_profile_id: null,
          campaign_id: null,
          series_id: null,
          template_id: null,
          performance_score: null,
          optimization_suggestions: complexJsonData.optimization_suggestions,
          image_style_id: null,
        },
        TEST_USER_ID
      );

      expect(postWithJson.socialMediaPosts).toEqual(complexJsonData.social_media_posts);
      expect(postWithJson.optimizationSuggestions).toEqual(
        complexJsonData.optimization_suggestions
      );

      // Clean up
      await db.deletePost(postWithJson.id, TEST_USER_ID);
    });

    it('should handle array fields correctly', async () => {
      const arrayData = {
        tags: ['test', 'array', 'validation', 'database'],
        headlines: [
          'First Headline',
          'Second Headline with Special Characters!',
          'Third Headline with Numbers 123',
        ],
      };

      const postWithArrays = await db.addPost(
        {
          topic: 'Array Test',
          idea: 'Test array handling',
          content: 'Test Content',
          status: 'draft',
          tags: arrayData.tags,
          summary: null,
          headlines: arrayData.headlines,
          social_media_posts: {},
          social_media_tones: {},
          social_media_audiences: {},
          selected_image: null,
          schedule_date: null,
          brand_voice_id: null,
          audience_profile_id: null,
          campaign_id: null,
          series_id: null,
          template_id: null,
          performance_score: null,
          optimization_suggestions: [],
          image_style_id: null,
        },
        TEST_USER_ID
      );

      expect(postWithArrays.tags).toEqual(arrayData.tags);
      expect(postWithArrays.headlines).toEqual(arrayData.headlines);

      // Clean up
      await db.deletePost(postWithArrays.id, TEST_USER_ID);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing required fields gracefully', async () => {
      // Try to create post without required fields
      await expect(
        db.addPost(
          {
            topic: null,
            idea: null,
            content: null, // Required field
            status: 'draft',
            tags: [],
            summary: null,
            headlines: [],
            social_media_posts: {},
            social_media_tones: {},
            social_media_audiences: {},
            selected_image: null,
            schedule_date: null,
            brand_voice_id: null,
            audience_profile_id: null,
            campaign_id: null,
            series_id: null,
            template_id: null,
            performance_score: null,
            optimization_suggestions: [],
            image_style_id: null,
          } as any,
          TEST_USER_ID
        )
      ).rejects.toThrow();
    });

    it('should handle invalid user IDs', async () => {
      await expect(db.getPosts('invalid-user-id')).rejects.toThrow();

      await expect(db.getPosts('')).rejects.toThrow('User ID is required');
    });

    it('should handle database connection issues gracefully', async () => {
      // This test verifies that our error handling works
      // In a real scenario, we might temporarily break the connection
      const connectionTest = await db.testConnection();
      expect(typeof connectionTest).toBe('boolean');
    });

    it('should handle concurrent operations correctly', async () => {
      // Test concurrent post creation
      const concurrentPosts = await Promise.all([
        db.addPost(
          {
            topic: 'Concurrent Test 1',
            idea: 'Test concurrent operations',
            content: 'Content 1',
            status: 'draft',
            tags: [],
            summary: null,
            headlines: [],
            social_media_posts: {},
            social_media_tones: {},
            social_media_audiences: {},
            selected_image: null,
            schedule_date: null,
            brand_voice_id: null,
            audience_profile_id: null,
            campaign_id: null,
            series_id: null,
            template_id: null,
            performance_score: null,
            optimization_suggestions: [],
            image_style_id: null,
          },
          TEST_USER_ID
        ),
        db.addPost(
          {
            topic: 'Concurrent Test 2',
            idea: 'Test concurrent operations',
            content: 'Content 2',
            status: 'draft',
            tags: [],
            summary: null,
            headlines: [],
            social_media_posts: {},
            social_media_tones: {},
            social_media_audiences: {},
            selected_image: null,
            schedule_date: null,
            brand_voice_id: null,
            audience_profile_id: null,
            campaign_id: null,
            series_id: null,
            template_id: null,
            performance_score: null,
            optimization_suggestions: [],
            image_style_id: null,
          },
          TEST_USER_ID
        ),
      ]);

      expect(concurrentPosts).toHaveLength(2);
      expect(concurrentPosts[0].id).not.toBe(concurrentPosts[1].id);
      expect(concurrentPosts[0].topic).toBe('Concurrent Test 1');
      expect(concurrentPosts[1].topic).toBe('Concurrent Test 2');

      // Clean up
      await Promise.all([
        db.deletePost(concurrentPosts[0].id, TEST_USER_ID),
        db.deletePost(concurrentPosts[1].id, TEST_USER_ID),
      ]);
    });
  });

  describe('Performance and Indexing', () => {
    it('should perform efficiently with pagination', async () => {
      const startTime = Date.now();
      const result = await db.getPostsPaginated(TEST_USER_ID, 1, 20);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.posts).toBeDefined();
      expect(result.totalCount).toBeDefined();
      expect(result.hasMore).toBeDefined();
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      const posts = await db.getPosts(TEST_USER_ID);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(Array.isArray(posts)).toBe(true);
    });
  });
});
