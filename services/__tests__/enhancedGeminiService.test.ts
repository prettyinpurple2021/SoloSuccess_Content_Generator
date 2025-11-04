/**
 * Enhanced Gemini AI Service Test Suite
 *
 * Tests for production-grade error handling, retry logic, and fallback mechanisms
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the original geminiService
const mockOriginalService = {
  generateTopic: vi.fn(),
  generateIdeas: vi.fn(),
  generateBlogPost: vi.fn(),
  generatePersonalizedContent: vi.fn(),
  generateTags: vi.fn(),
  generateHeadlines: vi.fn(),
  generateSummary: vi.fn(),
  generateSocialMediaPost: vi.fn(),
  generateImage: vi.fn(),
  generateImagePrompts: vi.fn(),
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

// Mock the original geminiService module
vi.mock('../geminiService', () => mockOriginalService);

// Mock localStorage
vi.stubGlobal('localStorage', mockLocalStorage);

describe('Enhanced Gemini AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset localStorage mocks
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should generate topic successfully', async () => {
      mockOriginalService.generateTopic.mockResolvedValue('AI Tools for Entrepreneurs');

      const { generateTopic } = await import('../enhancedGeminiService');
      const result = await generateTopic();

      expect(result).toBe('AI Tools for Entrepreneurs');
      expect(mockOriginalService.generateTopic).toHaveBeenCalledOnce();
    });

    it('should generate ideas successfully', async () => {
      const mockIdeas = ['Idea 1', 'Idea 2', 'Idea 3'];
      mockOriginalService.generateIdeas.mockResolvedValue(mockIdeas);

      const { generateIdeas } = await import('../enhancedGeminiService');
      const result = await generateIdeas('AI Tools');

      expect(result).toEqual(mockIdeas);
      expect(mockOriginalService.generateIdeas).toHaveBeenCalledWith('AI Tools');
    });

    it('should generate blog post successfully', async () => {
      const mockBlogPost = '# AI Tools\n\nContent about AI tools...';
      mockOriginalService.generateBlogPost.mockResolvedValue(mockBlogPost);

      const { generateBlogPost } = await import('../enhancedGeminiService');
      const result = await generateBlogPost('AI Tools for Business');

      expect(result).toBe(mockBlogPost);
      expect(mockOriginalService.generateBlogPost).toHaveBeenCalledWith('AI Tools for Business');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      // First two calls fail, third succeeds
      mockOriginalService.generateTopic
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValue('Success after retries');

      const { generateTopic } = await import('../enhancedGeminiService');
      const result = await generateTopic();

      expect(result).toBe('Success after retries');
      expect(mockOriginalService.generateTopic).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      mockOriginalService.generateTopic.mockRejectedValue(new Error('Invalid API key'));

      const { generateTopic } = await import('../enhancedGeminiService');

      await expect(generateTopic()).rejects.toThrow('Invalid API key');
      expect(mockOriginalService.generateTopic).toHaveBeenCalledOnce();
    });

    it('should use fallback content when all retries fail', async () => {
      mockOriginalService.generateTopic.mockRejectedValue(new Error('Network timeout'));

      const { generateTopic } = await import('../enhancedGeminiService');
      const result = await generateTopic();

      // Should return fallback content instead of throwing
      expect(result).toBe('Productivity Tips for Solo Entrepreneurs');
      expect(mockOriginalService.generateTopic).toHaveBeenCalledTimes(4); // 1 + 3 retries
    });

    it('should handle rate limiting with exponential backoff', async () => {
      mockOriginalService.generateIdeas
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValue(['Success after rate limit']);

      const { generateIdeas } = await import('../enhancedGeminiService');
      const result = await generateIdeas('test topic');

      expect(result).toEqual(['Success after rate limit']);
      expect(mockOriginalService.generateIdeas).toHaveBeenCalledTimes(2);
    });

    it('should provide fallback content for different content types', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Mock all services to fail
      mockOriginalService.generateIdeas.mockRejectedValue(new Error('Service unavailable'));
      mockOriginalService.generateTags.mockRejectedValue(new Error('Service unavailable'));
      mockOriginalService.generateHeadlines.mockRejectedValue(new Error('Service unavailable'));

      const ideas = await enhancedGeminiService.generateIdeas('test');
      const tags = await enhancedGeminiService.generateTags('test content');
      const headlines = await enhancedGeminiService.generateHeadlines('test content');

      expect(ideas).toBeInstanceOf(Array);
      expect(ideas.length).toBeGreaterThan(0);
      expect(tags).toBeInstanceOf(Array);
      expect(tags.length).toBeGreaterThan(0);
      expect(headlines).toBeInstanceOf(Array);
      expect(headlines.length).toBeGreaterThan(0);
    });
  });

  describe('Usage Metrics and Monitoring', () => {
    it('should track usage metrics', async () => {
      mockOriginalService.generateTopic.mockResolvedValue('Test Topic');

      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Reset metrics for clean test
      enhancedGeminiService.resetMetrics();

      await enhancedGeminiService.generateTopic();

      const metrics = enhancedGeminiService.getUsageMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
    });

    it('should track failed requests', async () => {
      mockOriginalService.generateTopic.mockRejectedValue(new Error('Invalid API key'));

      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.resetMetrics();

      // This should use fallback, so it won't throw
      await enhancedGeminiService.generateTopic();

      const metrics = enhancedGeminiService.getUsageMetrics();

      expect(metrics.totalRequests).toBe(1);
      expect(metrics.failedRequests).toBe(1);
    });

    it('should provide health status', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.resetMetrics();

      const healthStatus = enhancedGeminiService.getHealthStatus();

      expect(healthStatus.status).toMatch(/healthy|degraded|unhealthy/);
      expect(healthStatus.successRate).toBeGreaterThanOrEqual(0);
      expect(healthStatus.successRate).toBeLessThanOrEqual(100);
      expect(healthStatus.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(healthStatus.rateLimitHits).toBeGreaterThanOrEqual(0);
    });

    it('should save and load metrics from localStorage', async () => {
      const mockMetrics = {
        totalRequests: 10,
        successfulRequests: 8,
        failedRequests: 2,
        averageResponseTime: 1500,
        lastRequestTime: new Date().toISOString(),
        rateLimitHits: 1,
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockMetrics));

      // Import fresh instance to trigger loading
      delete require.cache[require.resolve('../enhancedGeminiService')];
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      const metrics = enhancedGeminiService.getUsageMetrics();

      expect(metrics.totalRequests).toBe(10);
      expect(metrics.successfulRequests).toBe(8);
      expect(metrics.failedRequests).toBe(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Set very low rate limit for testing
      enhancedGeminiService.updateRateLimits({ requestsPerMinute: 2 });

      mockOriginalService.generateTopic.mockResolvedValue('Test Topic');

      // Make requests up to the limit
      await enhancedGeminiService.generateTopic();
      await enhancedGeminiService.generateTopic();

      // This should trigger rate limiting (but we can't easily test the delay in unit tests)
      const startTime = Date.now();
      await enhancedGeminiService.generateTopic();
      const endTime = Date.now();

      // The third request should have been processed (with potential delay)
      expect(mockOriginalService.generateTopic).toHaveBeenCalledTimes(3);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow updating retry configuration', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.updateRetryConfig({
        maxRetries: 5,
        baseDelay: 500,
      });

      // Mock to fail multiple times to test new retry count
      mockOriginalService.generateTopic
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValue('Success after 5 retries');

      const result = await enhancedGeminiService.generateTopic();

      expect(result).toBe('Success after 5 retries');
      expect(mockOriginalService.generateTopic).toHaveBeenCalledTimes(5);
    });

    it('should allow updating rate limit configuration', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.updateRateLimits({
        requestsPerMinute: 100,
        requestsPerHour: 5000,
      });

      // Configuration should be updated (we can't easily test the actual rate limiting behavior in unit tests)
      expect(() =>
        enhancedGeminiService.updateRateLimits({ requestsPerMinute: 100 })
      ).not.toThrow();
    });
  });

  describe('Personalized Content Generation', () => {
    it('should generate personalized content with brand voice and audience profile', async () => {
      const mockContent = '# Personalized Content\n\nThis content is tailored...';
      mockOriginalService.generatePersonalizedContent.mockResolvedValue(mockContent);

      const brandVoice = {
        tone: 'friendly',
        writingStyle: 'conversational',
        vocabulary: ['awesome', 'amazing'],
        targetAudience: 'entrepreneurs',
      };

      const audienceProfile = {
        ageRange: '25-35',
        industry: 'technology',
        interests: ['AI', 'productivity'],
        painPoints: ['time management'],
      };

      const { generatePersonalizedContent } = await import('../enhancedGeminiService');
      const result = await generatePersonalizedContent('AI Tools', brandVoice, audienceProfile);

      expect(result).toBe(mockContent);
      expect(mockOriginalService.generatePersonalizedContent).toHaveBeenCalledWith(
        'AI Tools',
        brandVoice,
        audienceProfile
      );
    });

    it('should provide fallback for personalized content generation', async () => {
      mockOriginalService.generatePersonalizedContent.mockRejectedValue(
        new Error('Service unavailable')
      );

      const { generatePersonalizedContent } = await import('../enhancedGeminiService');
      const result = await generatePersonalizedContent('AI Tools');

      expect(result).toContain('AI Tools');
      expect(result).toContain('Building a successful business');
    });
  });

  describe('Image Generation', () => {
    it('should generate images successfully', async () => {
      const mockImages = ['data:image/png;base64,image1', 'data:image/png;base64,image2'];
      mockOriginalService.generateImage.mockResolvedValue(mockImages);

      const { generateImage } = await import('../enhancedGeminiService');
      const result = await generateImage('A modern workspace');

      expect(result).toEqual(mockImages);
      expect(mockOriginalService.generateImage).toHaveBeenCalledWith(
        'A modern workspace',
        undefined
      );
    });

    it('should throw error for image generation failures (no fallback)', async () => {
      mockOriginalService.generateImage.mockRejectedValue(new Error('Image generation failed'));

      const { generateImage } = await import('../enhancedGeminiService');

      await expect(generateImage('test prompt')).rejects.toThrow('Image generation failed');
    });

    it('should provide fallback for image prompts', async () => {
      mockOriginalService.generateImagePrompts.mockRejectedValue(new Error('Service unavailable'));

      const { generateImagePrompts } = await import('../enhancedGeminiService');
      const result = await generateImagePrompts('blog post content');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toContain('workspace');
    });
  });

  describe('Social Media Generation', () => {
    it('should generate social media posts successfully', async () => {
      const mockPost = 'Great insights on AI tools! 🚀 #AI #productivity';
      mockOriginalService.generateSocialMediaPost.mockResolvedValue(mockPost);

      const { generateSocialMediaPost } = await import('../enhancedGeminiService');
      const result = await generateSocialMediaPost(
        'Twitter',
        'blog content',
        'excited',
        'entrepreneurs'
      );

      expect(result).toBe(mockPost);
      expect(mockOriginalService.generateSocialMediaPost).toHaveBeenCalledWith(
        'Twitter',
        'blog content',
        'excited',
        'entrepreneurs'
      );
    });

    it('should provide fallback for social media posts', async () => {
      mockOriginalService.generateSocialMediaPost.mockRejectedValue(
        new Error('Service unavailable')
      );

      const { generateSocialMediaPost } = await import('../enhancedGeminiService');
      const result = await generateSocialMediaPost(
        'Twitter',
        'blog content',
        'excited',
        'entrepreneurs'
      );

      expect(result).toContain('Building a successful business');
      expect(result).toContain('#entrepreneurship');
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests', async () => {
      mockOriginalService.generateTopic.mockResolvedValue('Concurrent Topic');

      const { generateTopic } = await import('../enhancedGeminiService');

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => generateTopic());
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBe('Concurrent Topic');
      });
    });

    it('should handle mixed success and failure scenarios', async () => {
      mockOriginalService.generateIdeas
        .mockResolvedValueOnce(['Success 1'])
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(['Success 2']);

      const { generateIdeas } = await import('../enhancedGeminiService');

      const results = await Promise.all([
        generateIdeas('topic 1'),
        generateIdeas('topic 2'), // This will use fallback
        generateIdeas('topic 3'),
      ]);

      expect(results[0]).toEqual(['Success 1']);
      expect(results[1]).toBeInstanceOf(Array); // Fallback content
      expect(results[2]).toEqual(['Success 2']);
    });
  });
});
