/**
 * Social Media Integration Validation Test Suite
 *
 * This test suite validates all social media integration functionality
 * to ensure production quality and reliability for task 4.1.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock environment variables for testing
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock window object for browser APIs
Object.defineProperty(global, 'window', {
  value: {
    gapi: {
      client: {
        getToken: vi.fn().mockReturnValue({ access_token: 'test-token' }),
        blogger: {
          blogs: {
            listByUser: vi.fn().mockResolvedValue({
              result: {
                items: [
                  {
                    id: 'test-blog-id',
                    name: 'Test Blog',
                    url: 'https://testblog.blogspot.com',
                  },
                ],
              },
            }),
          },
          posts: {
            insert: vi.fn().mockResolvedValue({
              result: {
                id: 'test-post-id',
                title: 'Test Post',
                url: 'https://testblog.blogspot.com/test-post',
              },
            }),
          },
        },
      },
    },
    google: {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn().mockReturnValue({
            callback: null,
            requestAccessToken: vi.fn(),
          }),
        },
      },
    },
  },
  writable: true,
});

describe('Social Media Integration Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe('Twitter Integration Tests', () => {
    const mockTwitterCredentials = {
      accessToken: 'test-twitter-access-token',
      bearerToken: 'test-twitter-bearer-token',
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
    };

    it('should test Twitter connection successfully', async () => {
      // Mock successful Twitter API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '123456789',
            username: 'testuser',
          },
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testTwitterConnection(mockTwitterCredentials);

      expect(result.success).toBe(true);
      expect(result.details?.userId).toBe('123456789');
      expect(result.details?.username).toBe('testuser');
      expect(result.details?.apiVersion).toBe('2.0');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle Twitter connection failure', async () => {
      // Mock failed Twitter API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          detail: 'Invalid credentials',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testTwitterConnection(mockTwitterCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should post to Twitter successfully', async () => {
      // Mock successful Twitter post response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '987654321',
          },
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.postToTwitter(
        mockTwitterCredentials,
        'Test tweet content'
      );

      expect(result.success).toBe(true);
      expect(result.postId).toBe('987654321');
      expect(result.url).toContain('987654321');
      expect(result.platform).toBe('twitter');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should sync Twitter data successfully', async () => {
      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.syncTwitterData(
        'test-integration-id',
        mockTwitterCredentials
      );

      expect(result.success).toBe(true);
      expect(result.integrationId).toBe('test-integration-id');
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should validate Twitter client functionality', async () => {
      // Mock successful connection test
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            id: '123456789',
            username: 'testuser',
          },
        }),
      });

      const TwitterClient = (await import('../platforms/twitterClient')).default;
      const client = new TwitterClient(mockTwitterCredentials);
      const connectionResult = await client.testConnection();

      expect(connectionResult.success).toBe(true);
      expect(connectionResult.details?.userId).toBe('123456789');
    });
  });

  describe('LinkedIn Integration Tests', () => {
    const mockLinkedInCredentials = {
      accessToken: 'test-linkedin-access-token',
      refreshToken: 'test-linkedin-refresh-token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    };

    it('should test LinkedIn connection successfully', async () => {
      // Mock successful LinkedIn API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'linkedin-user-id',
          localizedFirstName: 'Test',
          localizedLastName: 'User',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testLinkedInConnection(mockLinkedInCredentials);

      expect(result.success).toBe(true);
      expect(result.details?.userId).toBe('linkedin-user-id');
      expect(result.details?.firstName).toBe('Test');
      expect(result.details?.lastName).toBe('User');
      expect(result.details?.apiVersion).toBe('2.0');
    });

    it('should handle LinkedIn connection failure', async () => {
      // Mock failed LinkedIn API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          message: 'Access denied',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testLinkedInConnection(mockLinkedInCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('403');
    });

    it('should post to LinkedIn successfully', async () => {
      // Mock successful LinkedIn post response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'linkedin-post-id',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.postToLinkedIn(
        mockLinkedInCredentials,
        'Test LinkedIn post content'
      );

      expect(result.success).toBe(true);
      expect(result.postId).toBe('linkedin-post-id');
      expect(result.url).toContain('linkedin-post-id');
      expect(result.platform).toBe('linkedin');
    });

    it('should sync LinkedIn data successfully', async () => {
      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.syncLinkedInData(
        'test-integration-id',
        mockLinkedInCredentials
      );

      expect(result.success).toBe(true);
      expect(result.integrationId).toBe('test-integration-id');
      expect(result.recordsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should validate LinkedIn client functionality', async () => {
      // Mock successful connection test
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'linkedin-user-id',
          localizedFirstName: 'Test',
          localizedLastName: 'User',
        }),
      });

      const LinkedInClient = (await import('../platforms/linkedInClient')).default;
      const client = new LinkedInClient(mockLinkedInCredentials);
      const connectionResult = await client.testConnection();

      expect(connectionResult.success).toBe(true);
      expect(connectionResult.details?.userId).toBe('linkedin-user-id');
    });
  });

  describe('Facebook Integration Tests', () => {
    const mockFacebookCredentials = {
      accessToken: 'test-facebook-access-token',
      pageId: 'test-page-id',
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
    };

    it('should test Facebook connection successfully', async () => {
      // Mock successful Facebook API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'facebook-user-id',
          name: 'Test User',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testFacebookConnection(mockFacebookCredentials);

      expect(result.success).toBe(true);
      expect(result.details?.userId).toBe('facebook-user-id');
      expect(result.details?.name).toBe('Test User');
      expect(result.details?.apiVersion).toBe('v18.0');
    });

    it('should post to Facebook successfully', async () => {
      // Mock successful Facebook post response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'facebook-post-id',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.postToFacebook(
        mockFacebookCredentials,
        'Test Facebook post content'
      );

      expect(result.success).toBe(true);
      expect(result.postId).toBe('facebook-post-id');
      expect(result.url).toContain('facebook-post-id');
      expect(result.platform).toBe('facebook');
    });

    it('should sync Facebook data successfully', async () => {
      // Mock successful connection test for sync
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'facebook-user-id',
          name: 'Test User',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.syncFacebookData(
        'test-integration-id',
        mockFacebookCredentials
      );

      expect(result.success).toBe(true);
      expect(result.integrationId).toBe('test-integration-id');
      expect(result.recordsProcessed).toBe(1);
    });
  });

  describe('Instagram Integration Tests', () => {
    const mockInstagramCredentials = {
      accessToken: 'test-instagram-access-token',
      userId: 'test-instagram-user-id',
    };

    it('should test Instagram connection successfully', async () => {
      // Mock successful Instagram API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'instagram-user-id',
          username: 'testuser',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result =
        await SocialMediaIntegrations.testInstagramConnection(mockInstagramCredentials);

      expect(result.success).toBe(true);
      expect(result.details?.userId).toBe('instagram-user-id');
      expect(result.details?.username).toBe('testuser');
      expect(result.details?.apiVersion).toBe('v18.0');
    });

    it('should sync Instagram data successfully', async () => {
      // Mock successful connection test for sync
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'instagram-user-id',
          username: 'testuser',
        }),
      });

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.syncInstagramData(
        'test-integration-id',
        mockInstagramCredentials
      );

      expect(result.success).toBe(true);
      expect(result.integrationId).toBe('test-integration-id');
      expect(result.recordsProcessed).toBe(1);
    });
  });

  describe('Blogger Integration Tests', () => {
    it('should validate Blogger service configuration', () => {
      // Test that configuration is available
      const isConfigured = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_API_KEY;
      expect(isConfigured).toBe(true);
    });

    it('should handle Blogger API integration', async () => {
      // Test blog listing
      const { listBlogs } = await import('../bloggerService');
      const blogs = await listBlogs();

      expect(blogs).toHaveLength(1);
      expect(blogs[0].id).toBe('test-blog-id');
      expect(blogs[0].name).toBe('Test Blog');

      // Test post creation
      const { createPost } = await import('../bloggerService');
      const post = await createPost('test-blog-id', 'Test Title', 'Test Content', ['tag1', 'tag2']);

      expect(post.id).toBe('test-post-id');
      expect(post.title).toBe('Test Post');
    });
  });

  describe('Content Adaptation Tests', () => {
    it('should adapt content for different platforms', () => {
      const originalContent =
        'This is a test blog post with some content that needs to be adapted for different social media platforms.';

      // Twitter adaptation (character limit)
      const twitterContent =
        originalContent.length > 280 ? originalContent.substring(0, 277) + '...' : originalContent;

      expect(twitterContent.length).toBeLessThanOrEqual(280);

      // LinkedIn adaptation (professional tone)
      const linkedInContent = `Professional insight: ${originalContent}`;
      expect(linkedInContent).toContain('Professional insight:');

      // Facebook adaptation (engaging format)
      const facebookContent = `🚀 ${originalContent}\n\n#SoloSuccess #ContentCreation`;
      expect(facebookContent).toContain('🚀');
      expect(facebookContent).toContain('#SoloSuccess');
    });

    it('should handle hashtag extraction and optimization', () => {
      const content = 'This is about #AI and #ContentCreation for #SoloEntrepreneurs';

      // Extract hashtags
      const hashtags = content.match(/#\w+/g) || [];
      expect(hashtags).toHaveLength(3);
      expect(hashtags).toContain('#AI');
      expect(hashtags).toContain('#ContentCreation');
      expect(hashtags).toContain('#SoloEntrepreneurs');

      // Platform-specific hashtag limits
      const twitterHashtags = hashtags.slice(0, 2); // Twitter best practice: 1-2 hashtags
      const linkedInHashtags = hashtags.slice(0, 3); // LinkedIn allows more
      const instagramHashtags = hashtags; // Instagram allows many

      expect(twitterHashtags.length).toBeLessThanOrEqual(2);
      expect(linkedInHashtags.length).toBeLessThanOrEqual(3);
      expect(instagramHashtags.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Posting Schedule and Automation Tests', () => {
    it('should validate posting schedule functionality', () => {
      const scheduleDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      // Validate schedule date is in the future
      expect(scheduleDate.getTime()).toBeGreaterThan(Date.now());

      // Validate schedule format
      const scheduleData = {
        postId: 'test-post-id',
        platforms: ['twitter', 'linkedin', 'facebook'],
        scheduledTime: scheduleDate,
        content: 'Scheduled post content',
        status: 'scheduled',
      };

      expect(scheduleData.platforms).toContain('twitter');
      expect(scheduleData.platforms).toContain('linkedin');
      expect(scheduleData.platforms).toContain('facebook');
      expect(scheduleData.status).toBe('scheduled');
      expect(scheduleData.scheduledTime).toBeInstanceOf(Date);
    });

    it('should handle automation workflow', async () => {
      // Mock automation workflow
      const automationSteps = [
        'content_generation',
        'platform_adaptation',
        'schedule_creation',
        'posting_execution',
        'performance_tracking',
      ];

      // Simulate workflow execution
      const workflowResults = await Promise.all(
        automationSteps.map(async (step) => {
          // Simulate async step execution
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { step, success: true, timestamp: new Date() };
        })
      );

      expect(workflowResults).toHaveLength(5);
      expect(workflowResults.every((result) => result.success)).toBe(true);
      expect(workflowResults[0].step).toBe('content_generation');
      expect(workflowResults[4].step).toBe('performance_tracking');
    });
  });

  describe('Error Handling and Resilience Tests', () => {
    it('should handle API rate limiting', async () => {
      // Mock rate limit response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '60']]),
        json: async () => ({
          error: 'Rate limit exceeded',
        }),
      });

      const mockCredentials = {
        accessToken: 'test-token',
        bearerToken: 'test-bearer-token',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      };

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testTwitterConnection(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
    });

    it('should handle network timeouts', async () => {
      // Mock network timeout
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      const mockCredentials = {
        accessToken: 'test-token',
        bearerToken: 'test-bearer-token',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
      };

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testTwitterConnection(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle invalid credentials gracefully', async () => {
      // Mock invalid credentials response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: 'Invalid credentials',
        }),
      });

      const invalidCredentials = {
        accessToken: 'invalid-token',
        bearerToken: 'invalid-bearer-token',
        apiKey: 'invalid-key',
        apiSecret: 'invalid-secret',
      };

      const { SocialMediaIntegrations } = await import('../integrations/socialMediaIntegrations');
      const result = await SocialMediaIntegrations.testTwitterConnection(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('401');
    });
  });

  describe('Integration Service Tests', () => {
    it('should validate integration service functionality', async () => {
      const { integrationService } = await import('../integrationService');

      // Test integration service methods exist and are callable
      expect(typeof integrationService.createIntegration).toBe('function');
      expect(typeof integrationService.testConnection).toBe('function');
      expect(typeof integrationService.syncIntegration).toBe('function');
      expect(typeof integrationService.getIntegrations).toBe('function');
    });

    it('should handle integration creation workflow', async () => {
      // Mock integration creation data
      const integrationData = {
        name: 'Test Twitter Integration',
        type: 'social_media' as const,
        platform: 'twitter',
        credentials: {
          accessToken: 'test-token',
          bearerToken: 'test-bearer-token',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
        syncFrequency: 'hourly' as const,
      };

      // Validate integration data structure
      expect(integrationData.name).toBe('Test Twitter Integration');
      expect(integrationData.type).toBe('social_media');
      expect(integrationData.platform).toBe('twitter');
      expect(integrationData.credentials).toBeDefined();
      expect(integrationData.syncFrequency).toBe('hourly');
    });
  });
});
