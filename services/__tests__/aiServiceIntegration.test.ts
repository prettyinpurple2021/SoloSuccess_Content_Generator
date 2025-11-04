/**
 * AI Service Integration Test Suite
 *
 * Integration tests for AI content generation features
 * These tests validate the actual functionality without complex mocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock environment for testing
process.env.API_KEY = 'test-gemini-api-key';
process.env.GEMINI_API_KEY = 'test-gemini-api-key';

describe('AI Service Integration Tests', () => {
  beforeEach(() => {
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Gemini Service', () => {
    it('should initialize enhanced service correctly', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      expect(enhancedGeminiService).toBeDefined();

      const metrics = enhancedGeminiService.getUsageMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(0);
      expect(metrics.failedRequests).toBeGreaterThanOrEqual(0);
    });

    it('should provide health status', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      const health = enhancedGeminiService.getHealthStatus();

      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.successRate).toBeGreaterThanOrEqual(0);
      expect(health.successRate).toBeLessThanOrEqual(100);
      expect(health.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(health.rateLimitHits).toBeGreaterThanOrEqual(0);
    });

    it('should allow configuration updates', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Test retry configuration update
      expect(() => {
        enhancedGeminiService.updateRetryConfig({
          maxRetries: 5,
          baseDelay: 500,
        });
      }).not.toThrow();

      // Test rate limit configuration update
      expect(() => {
        enhancedGeminiService.updateRateLimits({
          requestsPerMinute: 100,
          requestsPerHour: 5000,
        });
      }).not.toThrow();
    });

    it('should reset metrics correctly', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.resetMetrics();

      const metrics = enhancedGeminiService.getUsageMetrics();
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.rateLimitHits).toBe(0);
    });
  });

  describe('AI Service Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key
      const originalApiKey = process.env.API_KEY;
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      delete process.env.API_KEY;
      delete process.env.GEMINI_API_KEY;

      // Import fresh instance
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Should still initialize without throwing
      expect(enhancedGeminiService).toBeDefined();

      // Restore API keys
      process.env.API_KEY = originalApiKey;
      process.env.GEMINI_API_KEY = originalGeminiKey;
    });

    it('should provide fallback content when service fails', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Reset metrics for clean test
      enhancedGeminiService.resetMetrics();

      // These should return fallback content instead of throwing errors
      // (since the actual API calls will fail with test keys)
      const topic = await enhancedGeminiService.generateTopic();
      expect(typeof topic).toBe('string');
      expect(topic.length).toBeGreaterThan(0);

      const ideas = await enhancedGeminiService.generateIdeas('test topic');
      expect(Array.isArray(ideas)).toBe(true);
      expect(ideas.length).toBeGreaterThan(0);

      const blogPost = await enhancedGeminiService.generateBlogPost('test idea');
      expect(typeof blogPost).toBe('string');
      expect(blogPost.length).toBeGreaterThan(0);

      const tags = await enhancedGeminiService.generateTags('test content');
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);

      const headlines = await enhancedGeminiService.generateHeadlines('test content');
      expect(Array.isArray(headlines)).toBe(true);
      expect(headlines.length).toBeGreaterThan(0);

      const summary = await enhancedGeminiService.generateSummary('test content');
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);

      const socialPost = await enhancedGeminiService.generateSocialMediaPost(
        'Twitter',
        'test content',
        'professional',
        'entrepreneurs'
      );
      expect(typeof socialPost).toBe('string');
      expect(socialPost.length).toBeGreaterThan(0);

      const imagePrompts = await enhancedGeminiService.generateImagePrompts('test content');
      expect(Array.isArray(imagePrompts)).toBe(true);
      expect(imagePrompts.length).toBeGreaterThan(0);
    });

    it('should handle image generation errors appropriately', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Image generation should throw error (no fallback for images)
      await expect(enhancedGeminiService.generateImage('test prompt')).rejects.toThrow();
    });
  });

  describe('AI Service Utility Functions', () => {
    it('should export utility functions', async () => {
      const { getAIServiceMetrics, getAIServiceHealth, resetAIServiceMetrics } = await import(
        '../enhancedGeminiService'
      );

      expect(typeof getAIServiceMetrics).toBe('function');
      expect(typeof getAIServiceHealth).toBe('function');
      expect(typeof resetAIServiceMetrics).toBe('function');

      const metrics = getAIServiceMetrics();
      expect(metrics).toBeDefined();

      const health = getAIServiceHealth();
      expect(health).toBeDefined();

      expect(() => resetAIServiceMetrics()).not.toThrow();
    });

    it('should export all original service functions', async () => {
      const {
        generateTopic,
        generateIdeas,
        generateBlogPost,
        generatePersonalizedContent,
        generateTags,
        generateHeadlines,
        generateSummary,
        generateSocialMediaPost,
        generateImage,
        generateImagePrompts,
      } = await import('../enhancedGeminiService');

      expect(typeof generateTopic).toBe('function');
      expect(typeof generateIdeas).toBe('function');
      expect(typeof generateBlogPost).toBe('function');
      expect(typeof generatePersonalizedContent).toBe('function');
      expect(typeof generateTags).toBe('function');
      expect(typeof generateHeadlines).toBe('function');
      expect(typeof generateSummary).toBe('function');
      expect(typeof generateSocialMediaPost).toBe('function');
      expect(typeof generateImage).toBe('function');
      expect(typeof generateImagePrompts).toBe('function');
    });
  });

  describe('Content Validation', () => {
    it('should generate appropriate fallback content structure', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      // Test topic fallback
      const topic = await enhancedGeminiService.generateTopic();
      expect(topic).toContain('Entrepreneur');

      // Test ideas fallback
      const ideas = await enhancedGeminiService.generateIdeas('business');
      expect(ideas.length).toBeGreaterThanOrEqual(3);
      ideas.forEach((idea) => {
        expect(typeof idea).toBe('string');
        expect(idea.length).toBeGreaterThan(0);
      });

      // Test blog post fallback
      const blogPost = await enhancedGeminiService.generateBlogPost('productivity');
      expect(blogPost).toContain('#');
      expect(blogPost).toContain('Call to Action');

      // Test tags fallback
      const tags = await enhancedGeminiService.generateTags('business content');
      expect(tags.length).toBeGreaterThanOrEqual(3);
      tags.forEach((tag) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });

      // Test headlines fallback
      const headlines = await enhancedGeminiService.generateHeadlines('business content');
      expect(headlines.length).toBeGreaterThanOrEqual(3);
      headlines.forEach((headline) => {
        expect(typeof headline).toBe('string');
        expect(headline.length).toBeGreaterThan(0);
      });

      // Test summary fallback
      const summary = await enhancedGeminiService.generateSummary('business content');
      expect(summary.length).toBeGreaterThan(50);
      expect(summary.length).toBeLessThan(500);

      // Test social media post fallback
      const socialPost = await enhancedGeminiService.generateSocialMediaPost(
        'Twitter',
        'content',
        'professional',
        'entrepreneurs'
      );
      expect(socialPost).toContain('#');
      expect(socialPost.length).toBeLessThan(300);

      // Test image prompts fallback
      const imagePrompts = await enhancedGeminiService.generateImagePrompts('business content');
      expect(imagePrompts.length).toBeGreaterThanOrEqual(3);
      imagePrompts.forEach((prompt) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(20);
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.resetMetrics();

      // Make multiple concurrent requests
      const promises = [
        enhancedGeminiService.generateTopic(),
        enhancedGeminiService.generateIdeas('test'),
        enhancedGeminiService.generateBlogPost('test'),
        enhancedGeminiService.generateTags('test'),
        enhancedGeminiService.generateSummary('test'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
        if (Array.isArray(result)) {
          expect(result.length).toBeGreaterThan(0);
        } else {
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        }
      });

      const metrics = enhancedGeminiService.getUsageMetrics();
      expect(metrics.totalRequests).toBeGreaterThanOrEqual(5);
    });

    it('should maintain service health under load', async () => {
      const { enhancedGeminiService } = await import('../enhancedGeminiService');

      enhancedGeminiService.resetMetrics();

      // Make multiple requests to test service stability
      for (let i = 0; i < 10; i++) {
        await enhancedGeminiService.generateTopic();
      }

      const health = enhancedGeminiService.getHealthStatus();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);

      const metrics = enhancedGeminiService.getUsageMetrics();
      expect(metrics.totalRequests).toBe(10);
    });
  });
});
