/**
 * Gemini AI Service Test Suite
 *
 * Comprehensive tests for all AI content generation features
 * to ensure production quality and reliability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the Google GenAI SDK
const mockGenerateContent = vi.fn();
const mockGenerateImages = vi.fn();

const mockGoogleGenAI = vi.fn().mockImplementation(() => ({
  models: {
    generateContent: mockGenerateContent,
    generateImages: mockGenerateImages,
  },
}));

// Mock environment variables
process.env.API_KEY = 'test-gemini-api-key';

// Mock the Google GenAI module
vi.mock('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAI,
  Type: {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    NUMBER: 'number',
  },
}));

describe('Gemini AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Core Content Generation Functions', () => {
    describe('generateTopic', () => {
      it('should generate a topic successfully', async () => {
        const mockResponse = {
          text: '"AI-Powered Productivity Tools for Solo Entrepreneurs"',
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateTopic } = await import('../geminiService');
        const result = await generateTopic();

        expect(result).toBe('AI-Powered Productivity Tools for Solo Entrepreneurs');
        expect(mockGenerateContent).toHaveBeenCalledWith({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('market researcher for solo entrepreneurs'),
        });
      });

      it('should handle empty response', async () => {
        const mockResponse = { text: null };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateTopic } = await import('../geminiService');

        await expect(generateTopic()).rejects.toThrow(
          'Failed to generate topic: No response text received'
        );
      });

      it('should handle API errors', async () => {
        mockGenerateContent.mockRejectedValue(new Error('API Error'));

        const { generateTopic } = await import('../geminiService');

        await expect(generateTopic()).rejects.toThrow('API Error');
      });
    });

    describe('generateIdeas', () => {
      it('should generate ideas successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            ideas: [
              'How to Automate Your Content Creation Process',
              'Building a Personal Brand as a Solo Entrepreneur',
              'Time Management Strategies for One-Person Businesses',
              'Leveraging AI Tools for Business Growth',
              'Creating Passive Income Streams',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateIdeas } = await import('../geminiService');
        const result = await generateIdeas('AI productivity tools');

        expect(result).toHaveLength(5);
        expect(result[0]).toBe('How to Automate Your Content Creation Process');
        expect(mockGenerateContent).toHaveBeenCalledWith({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('AI productivity tools'),
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        });
      });

      it('should handle malformed JSON response', async () => {
        const mockResponse = { text: 'invalid json' };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateIdeas } = await import('../geminiService');

        await expect(generateIdeas('test topic')).rejects.toThrow();
      });

      it('should return empty array for missing ideas property', async () => {
        const mockResponse = {
          text: JSON.stringify({ notIdeas: [] }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateIdeas } = await import('../geminiService');
        const result = await generateIdeas('test topic');

        expect(result).toEqual([]);
      });
    });

    describe('generateBlogPost', () => {
      it('should generate blog post successfully', async () => {
        const mockResponse = {
          text: '# How to Build a Personal Brand\n\nBuilding a personal brand is essential...\n\n## Call to Action\n\nStart building your brand today!',
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateBlogPost } = await import('../geminiService');
        const result = await generateBlogPost('Building a Personal Brand');

        expect(result).toContain('# How to Build a Personal Brand');
        expect(result).toContain('Call to Action');
        expect(mockGenerateContent).toHaveBeenCalledWith({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('Building a Personal Brand'),
        });
      });

      it('should handle empty response', async () => {
        const mockResponse = { text: '' };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateBlogPost } = await import('../geminiService');

        await expect(generateBlogPost('test idea')).rejects.toThrow(
          'Failed to generate blog post: No response text received'
        );
      });
    });

    describe('generateTags', () => {
      it('should generate tags successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            tags: [
              'productivity',
              'ai tools',
              'automation',
              'business growth',
              'solo entrepreneur',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateTags } = await import('../geminiService');
        const result = await generateTags('Blog post about AI productivity tools...');

        expect(result).toHaveLength(5);
        expect(result).toContain('productivity');
        expect(result).toContain('ai tools');
      });

      it('should handle empty tags array', async () => {
        const mockResponse = {
          text: JSON.stringify({ tags: [] }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateTags } = await import('../geminiService');
        const result = await generateTags('test content');

        expect(result).toEqual([]);
      });
    });

    describe('generateHeadlines', () => {
      it('should generate headlines successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            headlines: [
              '5 AI Tools That Will Transform Your Business',
              'The Ultimate Guide to AI-Powered Productivity',
              'How Solo Entrepreneurs Can Leverage AI for Growth',
              'AI Tools Every Entrepreneur Should Know About',
              'Boost Your Productivity with These AI Solutions',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateHeadlines } = await import('../geminiService');
        const result = await generateHeadlines('Blog post about AI tools...');

        expect(result).toHaveLength(5);
        expect(result[0]).toContain('AI Tools');
      });
    });

    describe('generateSummary', () => {
      it('should generate summary successfully', async () => {
        const mockResponse = {
          text: 'This blog post explores how AI tools can revolutionize productivity for solo entrepreneurs. It covers the top 5 AI tools and provides practical implementation strategies.',
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateSummary } = await import('../geminiService');
        const result = await generateSummary('Long blog post content...');

        expect(result).toContain('AI tools');
        expect(result).toContain('solo entrepreneurs');
      });
    });
  });

  describe('Social Media Generation Functions', () => {
    describe('generateSocialMediaPost', () => {
      it('should generate Twitter post successfully', async () => {
        const mockResponse = {
          text: '🚀 Just discovered 5 AI tools that can 10x your productivity as a solo entrepreneur! Which one should I try first? #AI #Productivity #SoloEntrepreneur',
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateSocialMediaPost } = await import('../geminiService');
        const result = await generateSocialMediaPost(
          'Twitter',
          'Blog post about AI tools...',
          'excited',
          'entrepreneurs'
        );

        expect(result).toContain('#AI');
        expect(result).toContain('#Productivity');
        expect(result.length).toBeLessThanOrEqual(280);
      });

      it('should generate LinkedIn post successfully', async () => {
        const mockResponse = {
          text: "As a solo entrepreneur, I've learned that the right AI tools can be game-changers for productivity. Here are 5 tools that have transformed my workflow... #AI #Productivity #Entrepreneurship",
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateSocialMediaPost } = await import('../geminiService');
        const result = await generateSocialMediaPost(
          'LinkedIn',
          'Blog post about AI tools...',
          'professional',
          'business professionals'
        );

        expect(result).toContain('solo entrepreneur');
        expect(result).toContain('#AI');
      });

      it('should handle different platforms correctly', async () => {
        const platforms = ['Twitter', 'LinkedIn', 'Facebook', 'Instagram', 'Threads', 'Bluesky'];

        for (const platform of platforms) {
          const mockResponse = {
            text: `${platform} post content with relevant hashtags`,
          };
          mockGenerateContent.mockResolvedValue(mockResponse);

          const { generateSocialMediaPost } = await import('../geminiService');
          const result = await generateSocialMediaPost(
            platform,
            'test content',
            'professional',
            'entrepreneurs'
          );

          expect(result).toContain(platform);
          expect(mockGenerateContent).toHaveBeenCalledWith({
            model: 'gemini-2.5-flash',
            contents: expect.stringContaining(platform),
          });
        }
      });
    });
  });

  describe('Image Generation Functions', () => {
    describe('generateImagePrompts', () => {
      it('should generate image prompts successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            prompts: [
              'A modern workspace with AI-powered tools and productivity apps on multiple screens',
              'An entrepreneur working efficiently with AI assistants visualized as holographic interfaces',
              'A futuristic office setup showing the integration of AI tools in daily workflow',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateImagePrompts } = await import('../geminiService');
        const result = await generateImagePrompts('Blog post about AI productivity tools...');

        expect(result).toHaveLength(3);
        expect(result[0]).toContain('workspace');
        expect(result[1]).toContain('entrepreneur');
      });
    });

    describe('generateImage', () => {
      it('should generate images successfully', async () => {
        const mockResponse = {
          generatedImages: [
            { image: { imageBytes: 'base64encodedimage1' } },
            { image: { imageBytes: 'base64encodedimage2' } },
            { image: { imageBytes: 'base64encodedimage3' } },
          ],
        };
        mockGenerateImages.mockResolvedValue(mockResponse);

        const { generateImage } = await import('../geminiService');
        const result = await generateImage('A modern workspace with AI tools');

        expect(result).toHaveLength(3);
        expect(result[0]).toBe('data:image/png;base64,base64encodedimage1');
        expect(mockGenerateImages).toHaveBeenCalledWith({
          model: 'imagen-4.0-generate-001',
          prompt: 'A modern workspace with AI tools',
          config: {
            numberOfImages: 3,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
          },
        });
      });

      it('should handle platform-specific aspect ratios', async () => {
        const mockResponse = {
          generatedImages: [{ image: { imageBytes: 'base64encodedimage1' } }],
        };
        mockGenerateImages.mockResolvedValue(mockResponse);

        const { generateImage } = await import('../geminiService');

        // Test Instagram (should be 1:1)
        await generateImage('test prompt', { platform: 'instagram' });
        expect(mockGenerateImages).toHaveBeenCalledWith(
          expect.objectContaining({
            config: expect.objectContaining({
              aspectRatio: '1:1',
            }),
          })
        );

        // Test TikTok (should be 9:16)
        await generateImage('test prompt', { platform: 'tiktok' });
        expect(mockGenerateImages).toHaveBeenCalledWith(
          expect.objectContaining({
            config: expect.objectContaining({
              aspectRatio: '9:16',
            }),
          })
        );
      });

      it('should apply image style options', async () => {
        const mockResponse = {
          generatedImages: [{ image: { imageBytes: 'base64encodedimage1' } }],
        };
        mockGenerateImages.mockResolvedValue(mockResponse);

        const imageStyle = {
          stylePrompt: 'minimalist and modern',
          colorPalette: ['blue', 'white', 'gray'],
          visualElements: ['clean lines', 'geometric shapes'],
          brandAssets: [
            { type: 'logo', data: 'company logo', usage: 'always' },
            { type: 'font', data: 'Helvetica', usage: 'optional' },
          ],
        };

        const { generateImage } = await import('../geminiService');
        await generateImage('test prompt', { imageStyle });

        expect(mockGenerateImages).toHaveBeenCalledWith(
          expect.objectContaining({
            prompt: expect.stringContaining('minimalist and modern'),
          })
        );
      });

      it('should handle empty image response', async () => {
        const mockResponse = { generatedImages: null };
        mockGenerateImages.mockResolvedValue(mockResponse);

        const { generateImage } = await import('../geminiService');

        await expect(generateImage('test prompt')).rejects.toThrow(
          'Failed to generate images: No images received'
        );
      });
    });

    describe('generateImageVariations', () => {
      it('should generate image variations successfully', async () => {
        const mockResponse = {
          generatedImages: [
            { image: { imageBytes: 'variation1' } },
            { image: { imageBytes: 'variation2' } },
            { image: { imageBytes: 'variation3' } },
          ],
        };
        mockGenerateImages.mockResolvedValue(mockResponse);

        const imageStyle = {
          stylePrompt: 'modern and clean',
          colorPalette: ['blue', 'white'],
          visualElements: ['minimalist'],
          brandAssets: [],
        };

        const { generateImageVariations } = await import('../geminiService');
        const result = await generateImageVariations('workspace setup', imageStyle, 3);

        expect(result.variations).toHaveLength(3);
        expect(result.styleConsistencyScore).toBeGreaterThanOrEqual(80);
        expect(result.styleConsistencyScore).toBeLessThanOrEqual(100);
        expect(result.recommendations).toBeInstanceOf(Array);
      });
    });
  });

  describe('Enhanced Personalization Functions', () => {
    describe('generatePersonalizedContent', () => {
      it('should generate personalized content with brand voice', async () => {
        const mockResponse = {
          text: "# Building Your Personal Brand: A Friendly Guide\n\nHey there, fellow entrepreneur! Let's dive into the exciting world of personal branding...",
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const brandVoice = {
          tone: 'friendly',
          writingStyle: 'conversational',
          vocabulary: ['entrepreneur', 'exciting', 'journey'],
          targetAudience: 'solo entrepreneurs',
        };

        const { generatePersonalizedContent } = await import('../geminiService');
        const result = await generatePersonalizedContent('Building a Personal Brand', brandVoice);

        expect(result).toContain('entrepreneur');
        expect(mockGenerateContent).toHaveBeenCalledWith({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('friendly tone'),
        });
      });

      it('should generate personalized content with audience profile', async () => {
        const mockResponse = {
          text: '# AI Tools for Tech Professionals\n\nAs a tech professional in your 30s, you understand the importance of staying ahead...',
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const audienceProfile = {
          ageRange: '25-35',
          industry: 'technology',
          interests: ['AI', 'automation', 'productivity'],
          painPoints: ['time management', 'staying updated with tech'],
        };

        const { generatePersonalizedContent } = await import('../geminiService');
        const result = await generatePersonalizedContent(
          'AI Productivity Tools',
          undefined,
          audienceProfile
        );

        expect(result).toContain('tech professional');
        expect(mockGenerateContent).toHaveBeenCalledWith({
          model: 'gemini-2.5-flash',
          contents: expect.stringContaining('technology'),
        });
      });
    });

    describe('analyzeBrandVoice', () => {
      it('should analyze brand voice from content samples', async () => {
        const mockResponse = {
          text: JSON.stringify({
            tone: 'friendly',
            writingStyle: 'conversational',
            vocabulary: ['awesome', 'amazing', 'journey', 'entrepreneur'],
            characteristics: [
              'uses exclamation points',
              'asks rhetorical questions',
              'includes personal anecdotes',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const sampleContent = [
          'Hey there! Welcome to my awesome journey as an entrepreneur...',
          "Isn't it amazing how AI can transform our businesses?",
          'Let me share a personal story about my first startup...',
        ];

        const { analyzeBrandVoice } = await import('../geminiService');
        const result = await analyzeBrandVoice(sampleContent);

        expect(result.tone).toBe('friendly');
        expect(result.writingStyle).toBe('conversational');
        expect(result.vocabulary).toContain('awesome');
        expect(result.characteristics).toContain('uses exclamation points');
      });
    });

    describe('generateAudienceInsights', () => {
      it('should generate audience insights successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            demographics: {
              ageRange: '25-45',
              industry: 'Technology',
              jobTitles: ['Software Developer', 'Product Manager', 'Tech Lead'],
            },
            interests: ['AI', 'productivity', 'career growth'],
            painPoints: ['work-life balance', 'staying updated', 'imposter syndrome'],
            contentPreferences: ['how-to guides', 'case studies', 'video tutorials'],
            engagementTips: [
              'use technical examples',
              'include code snippets',
              'share industry insights',
            ],
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateAudienceInsights } = await import('../geminiService');
        const result = await generateAudienceInsights('tech professionals', 'technology', [
          'education',
          'engagement',
        ]);

        expect(result.demographics.industry).toBe('Technology');
        expect(result.interests).toContain('AI');
        expect(result.painPoints).toContain('work-life balance');
        expect(result.contentPreferences).toContain('how-to guides');
        expect(result.engagementTips).toContain('use technical examples');
      });
    });
  });

  describe('Content Series and Campaign Functions', () => {
    describe('generateSeriesContent', () => {
      it('should generate series content successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            title: 'AI Tools for Content Creation - Part 2',
            content:
              '# AI Tools for Content Creation - Part 2\n\nBuilding on our previous discussion...',
            connectionToPrevious: 'In our last post, we covered the basics of AI tools...',
            nextPostTeaser: "Next week, we'll explore advanced AI automation techniques...",
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateSeriesContent } = await import('../geminiService');
        const result = await generateSeriesContent(
          'AI Tools for Entrepreneurs',
          2,
          5,
          ['Introduction to AI Tools'],
          { tone: 'professional', writingStyle: 'informative' }
        );

        expect(result.title).toContain('Part 2');
        expect(result.content).toContain('Building on our previous discussion');
        expect(result.connectionToPrevious).toContain('last post');
        expect(result.nextPostTeaser).toContain('Next week');
      });
    });

    describe('generateCampaignTheme', () => {
      it('should generate campaign theme successfully', async () => {
        const mockResponse = {
          text: JSON.stringify({
            theme: 'AI-Powered Productivity Revolution',
            description:
              'A comprehensive campaign showcasing how AI tools can transform productivity for solo entrepreneurs',
            keyMessages: [
              'AI democratizes productivity',
              'Small businesses can compete with big corporations',
              'Automation frees up time for creativity',
            ],
            contentPillars: [
              'Tool Reviews',
              'Implementation Guides',
              'Success Stories',
              'Future Trends',
            ],
            platformStrategy: {
              LinkedIn: 'Professional insights and case studies',
              Twitter: 'Quick tips and tool recommendations',
              Instagram: 'Visual before/after productivity transformations',
            },
          }),
        };
        mockGenerateContent.mockResolvedValue(mockResponse);

        const { generateCampaignTheme } = await import('../geminiService');
        const result = await generateCampaignTheme(
          'Increase brand awareness for AI productivity tools',
          'solo entrepreneurs',
          ['LinkedIn', 'Twitter', 'Instagram'],
          '3 months'
        );

        expect(result.theme).toContain('AI-Powered Productivity');
        expect(result.keyMessages).toHaveLength(3);
        expect(result.contentPillars).toContain('Tool Reviews');
        expect(result.platformStrategy['LinkedIn']).toContain('Professional insights');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network timeout'));

      const { generateTopic } = await import('../geminiService');

      await expect(generateTopic()).rejects.toThrow('Network timeout');
    });

    it('should handle rate limiting errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Rate limit exceeded'));

      const { generateIdeas } = await import('../geminiService');

      await expect(generateIdeas('test topic')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed API responses', async () => {
      mockGenerateContent.mockResolvedValue({ text: null });

      const { generateBlogPost } = await import('../geminiService');

      await expect(generateBlogPost('test idea')).rejects.toThrow('No response text received');
    });

    it('should handle empty or invalid prompts', async () => {
      const mockResponse = { text: 'Generated content' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateBlogPost } = await import('../geminiService');

      // Should still work with empty string
      const result = await generateBlogPost('');
      expect(result).toBe('Generated content');
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockGenerateContent.mockResolvedValue({ text: 'invalid json {' });

      const { generateTags } = await import('../geminiService');

      await expect(generateTags('test content')).rejects.toThrow();
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests', async () => {
      const mockResponse = { text: 'Generated content' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateBlogPost } = await import('../geminiService');

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) => generateBlogPost(`Test idea ${i}`));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toBe('Generated content');
      });
    });

    it('should handle large content inputs', async () => {
      const mockResponse = { text: 'Generated summary' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const { generateSummary } = await import('../geminiService');

      // Create a large content string
      const largeContent = 'Lorem ipsum '.repeat(1000);
      const result = await generateSummary(largeContent);

      expect(result).toBe('Generated summary');
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Lorem ipsum'),
      });
    });
  });

  describe('Content Repurposing Functions', () => {
    describe('repurposeContent', () => {
      it('should repurpose content for different formats', async () => {
        const formats = ['Video Script', 'Email Newsletter', 'LinkedIn Article', 'Twitter Thread'];

        for (const format of formats) {
          const mockResponse = {
            text: `Repurposed content for ${format} format with proper structure and formatting`,
          };
          mockGenerateContent.mockResolvedValue(mockResponse);

          const { repurposeContent } = await import('../geminiService');
          const result = await repurposeContent('Original blog post content...', format);

          expect(result).toContain(format);
          expect(mockGenerateContent).toHaveBeenCalledWith({
            model: 'gemini-2.5-flash',
            contents: expect.stringContaining(format),
          });
        }
      });

      it('should handle invalid format gracefully', async () => {
        const { repurposeContent } = await import('../geminiService');
        const result = await repurposeContent('test content', 'Invalid Format');

        expect(result).toContain('Invalid format selected');
      });
    });
  });
});
