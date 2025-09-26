import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateTopic = async (): Promise<string> => {
    const prompt = `As a market researcher for solo entrepreneurs, identify the single most relevant and trending blog topic for the current market. Provide ONLY the topic title.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim().replace(/^"|"$/g, '');
};

export const generateIdeas = async (topic: string): Promise<string[]> => {
    const prompt = `Generate 5 unique, engaging blog post ideas for solo entrepreneurs on the topic: "${topic}".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ideas: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['ideas']
            }
        }
    });
    const result = JSON.parse(response.text);
    return result.ideas || [];
};

export const generateBlogPost = async (idea: string): Promise<string> => {
    const prompt = `Write a detailed, engaging, 500-word blog post about "${idea}" for a solo entrepreneur. Use markdown for headings, bold text, and bullet points. End with a strong call to action.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateTags = async (blogPost: string): Promise<string[]> => {
    const prompt = `Based on the following blog post, generate a list of 5-7 relevant, concise, and SEO-friendly tags or keywords. The tags should be lowercase and can be single or multi-word.

Blog Post:
${blogPost}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['tags']
            }
        }
    });
    const result = JSON.parse(response.text);
    return result.tags || [];
};

export const generateHeadlines = async (blogPost: string): Promise<string[]> => {
    const prompt = `Based on the following blog post, generate 5 alternative, catchy, and SEO-friendly headlines.

Blog Post:
${blogPost}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    headlines: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['headlines']
            }
        }
    });
    const result = JSON.parse(response.text);
    return result.headlines || [];
};

export const generateSummary = async (blogPost: string): Promise<string> => {
    const prompt = `Summarize the following blog post into a concise, 2-3 sentence paragraph.

Blog Post:
${blogPost}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};


export const generateSocialMediaPost = async (platform: string, blogPost: string, tone: string, audience: string): Promise<string> => {
    let prompt = `Based on the blog post below, write a social media post for ${platform}. The post should have a ${tone.toLowerCase()} tone and be targeted towards an audience of ${audience.toLowerCase()}.`;
    
    switch (platform) {
        case 'Twitter':
            prompt += ` Keep it under 280 characters and include 2-3 relevant hashtags.`;
            break;
        case 'LinkedIn':
            prompt += ` Make it professional and engaging. Include a few relevant hashtags.`;
            break;
        case 'Facebook':
            prompt += ` Make it friendly and conversational, and ask a question. Include a few relevant hashtags.`;
            break;
        case 'Instagram':
            prompt += ` Write a visually-driven caption. Suggest what kind of image or video should accompany it. Include 5-10 relevant hashtags.`;
            break;
        case 'Threads':
            prompt += ` Make it conversational and engaging. It can be a bit longer than a tweet. Include 3-5 relevant hashtags.`;
            break;
        case 'Bluesky':
            prompt += ` Keep it concise and witty, similar to a tweet. Include 2-3 relevant hashtags.`;
            break;
    }

    prompt += `\n\nBlog Post:\n${blogPost}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateImagePrompts = async (blogPost: string): Promise<string[]> => {
    const prompt = `Based on the blog post below, generate 3 distinct, detailed prompts for an AI image generator. The prompts should describe visual concepts that would effectively accompany the blog post.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['prompts']
            }
        }
    });
    const result = JSON.parse(response.text);
    return result.prompts || [];
};

export const generateImage = async (prompt: string): Promise<string[]> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 3,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const generateGenericContent = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const repurposeContent = async (blogPost: string, format: string): Promise<string> => {
    let prompt = '';
    switch (format) {
        case 'Video Script':
            prompt = `Transform the following blog post into a concise and engaging script for a 30-60 second short-form video (e.g., TikTok, Instagram Reel, YouTube Short). The script should be punchy and easy to follow. Include suggestions for visuals, on-screen text, and a call to action. Use markdown for formatting.

Blog Post:
${blogPost}`;
            break;
        case 'Email Newsletter':
            prompt = `Adapt the following blog post into a compelling segment for an email newsletter. It should have a catchy subject line suggestion, a brief and engaging summary of the key points, and a clear call-to-action prompting readers to click through to the full blog post. Use markdown for formatting.

Blog Post:
${blogPost}`;
            break;
        case 'LinkedIn Article':
            prompt = `Repurpose the following blog post into a professional and insightful LinkedIn article. Create a strong, attention-grabbing headline. Structure the content for easy readability on the platform using short paragraphs, bullet points, and emojis where appropriate. Conclude with a question to encourage engagement and include 3-5 relevant hashtags. Use markdown for formatting.

Blog Post:
${blogPost}`;
            break;
        default:
            return "Invalid format selected.";
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

// Enhanced Content Personalization Functions

export const generatePersonalizedContent = async (
    idea: string, 
    brandVoice?: { tone: string; writingStyle: string; vocabulary: string[]; targetAudience: string },
    audienceProfile?: { ageRange: string; industry: string; interests: string[]; painPoints: string[] }
): Promise<string> => {
    let prompt = `Write a detailed, engaging, 500-word blog post about "${idea}" for a solo entrepreneur.`;
    
    if (brandVoice) {
        prompt += ` Use a ${brandVoice.tone} tone with a ${brandVoice.writingStyle} writing style.`;
        if (brandVoice.vocabulary.length > 0) {
            prompt += ` Incorporate these key terms naturally: ${brandVoice.vocabulary.join(', ')}.`;
        }
        if (brandVoice.targetAudience) {
            prompt += ` The content should resonate with ${brandVoice.targetAudience}.`;
        }
    }
    
    if (audienceProfile) {
        prompt += ` Target audience: ${audienceProfile.ageRange} professionals in ${audienceProfile.industry}.`;
        if (audienceProfile.interests.length > 0) {
            prompt += ` They are interested in: ${audienceProfile.interests.join(', ')}.`;
        }
        if (audienceProfile.painPoints.length > 0) {
            prompt += ` Address these pain points: ${audienceProfile.painPoints.join(', ')}.`;
        }
    }
    
    prompt += ` Use markdown for headings, bold text, and bullet points. End with a strong call to action.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const analyzeBrandVoice = async (sampleContent: string[]): Promise<{
    tone: string;
    writingStyle: string;
    vocabulary: string[];
    characteristics: string[];
}> => {
    const combinedContent = sampleContent.join('\n\n---\n\n');
    const prompt = `Analyze the following content samples to extract brand voice characteristics. Identify the tone, writing style, key vocabulary, and distinctive characteristics.

Content Samples:
${combinedContent}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tone: { type: Type.STRING },
                    writingStyle: { type: Type.STRING },
                    vocabulary: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    characteristics: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['tone', 'writingStyle', 'vocabulary', 'characteristics']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        tone: result.tone || 'professional',
        writingStyle: result.writingStyle || 'informative',
        vocabulary: result.vocabulary || [],
        characteristics: result.characteristics || []
    };
};

export const generateAudienceInsights = async (
    targetAudience: string,
    industry?: string,
    contentGoals?: string[]
): Promise<{
    demographics: { ageRange: string; industry: string; jobTitles: string[] };
    interests: string[];
    painPoints: string[];
    contentPreferences: string[];
    engagementTips: string[];
}> => {
    let prompt = `Analyze the target audience "${targetAudience}" and provide detailed insights for content creation.`;
    
    if (industry) {
        prompt += ` Focus on the ${industry} industry.`;
    }
    
    if (contentGoals && contentGoals.length > 0) {
        prompt += ` Content goals: ${contentGoals.join(', ')}.`;
    }
    
    prompt += ` Provide demographics, interests, pain points, content preferences, and engagement tips.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    demographics: {
                        type: Type.OBJECT,
                        properties: {
                            ageRange: { type: Type.STRING },
                            industry: { type: Type.STRING },
                            jobTitles: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ['ageRange', 'industry', 'jobTitles']
                    },
                    interests: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    painPoints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    contentPreferences: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    engagementTips: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['demographics', 'interests', 'painPoints', 'contentPreferences', 'engagementTips']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        demographics: result.demographics || { ageRange: '25-45', industry: 'General', jobTitles: [] },
        interests: result.interests || [],
        painPoints: result.painPoints || [],
        contentPreferences: result.contentPreferences || [],
        engagementTips: result.engagementTips || []
    };
};

// Campaign and Series Content Generation Functions

export const generateSeriesContent = async (
    seriesTheme: string,
    postNumber: number,
    totalPosts: number,
    previousPosts?: string[],
    brandVoice?: { tone: string; writingStyle: string }
): Promise<{
    title: string;
    content: string;
    connectionToPrevious: string;
    nextPostTeaser: string;
}> => {
    let prompt = `Generate content for post ${postNumber} of ${totalPosts} in a content series about "${seriesTheme}".`;
    
    if (previousPosts && previousPosts.length > 0) {
        prompt += ` Previous posts in the series covered: ${previousPosts.join(', ')}.`;
        prompt += ` Ensure this post builds upon previous content while providing standalone value.`;
    }
    
    if (brandVoice) {
        prompt += ` Use a ${brandVoice.tone} tone with a ${brandVoice.writingStyle} writing style.`;
    }
    
    prompt += ` Create a cohesive 500-word blog post that fits the series narrative. Include a title, main content, connection to previous posts, and teaser for the next post.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    connectionToPrevious: { type: Type.STRING },
                    nextPostTeaser: { type: Type.STRING }
                },
                required: ['title', 'content', 'connectionToPrevious', 'nextPostTeaser']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        title: result.title || `${seriesTheme} - Part ${postNumber}`,
        content: result.content || '',
        connectionToPrevious: result.connectionToPrevious || '',
        nextPostTeaser: result.nextPostTeaser || ''
    };
};

export const generateCampaignTheme = async (
    campaignGoal: string,
    targetAudience: string,
    platforms: string[],
    duration: string
): Promise<{
    theme: string;
    description: string;
    keyMessages: string[];
    contentPillars: string[];
    platformStrategy: { [platform: string]: string };
}> => {
    const prompt = `Create a comprehensive campaign theme for a ${duration} campaign with the goal: "${campaignGoal}". 
    Target audience: ${targetAudience}. 
    Platforms: ${platforms.join(', ')}.
    
    Provide a cohesive theme, description, key messages, content pillars, and platform-specific strategies.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    theme: { type: Type.STRING },
                    description: { type: Type.STRING },
                    keyMessages: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    contentPillars: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    platformStrategy: {
                        type: Type.OBJECT,
                        additionalProperties: { type: Type.STRING }
                    }
                },
                required: ['theme', 'description', 'keyMessages', 'contentPillars', 'platformStrategy']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        theme: result.theme || campaignGoal,
        description: result.description || '',
        keyMessages: result.keyMessages || [],
        contentPillars: result.contentPillars || [],
        platformStrategy: result.platformStrategy || {}
    };
};

export const ensureContentContinuity = async (
    currentContent: string,
    seriesContext: {
        theme: string;
        previousPosts: string[];
        brandVoice: { tone: string; writingStyle: string };
    }
): Promise<{
    continuityScore: number;
    suggestions: string[];
    revisedContent?: string;
}> => {
    const prompt = `Analyze the following content for continuity within a series about "${seriesContext.theme}".
    
    Previous posts covered: ${seriesContext.previousPosts.join(', ')}.
    Brand voice: ${seriesContext.brandVoice.tone} tone, ${seriesContext.brandVoice.writingStyle} style.
    
    Current content:
    ${currentContent}
    
    Evaluate continuity (0-100 score) and provide improvement suggestions. If score is below 70, provide revised content.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    continuityScore: { type: Type.NUMBER },
                    suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    revisedContent: { type: Type.STRING }
                },
                required: ['continuityScore', 'suggestions']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        continuityScore: result.continuityScore || 0,
        suggestions: result.suggestions || [],
        revisedContent: result.revisedContent
    };
};

// Advanced Hashtag and Trending Topic Functions

export const generateHashtagSuggestions = async (
    content: string,
    platform: string,
    targetAudience?: string
): Promise<{
    hashtags: Array<{
        tag: string;
        engagementScore: number;
        popularity: 'high' | 'medium' | 'low';
        competition: 'high' | 'medium' | 'low';
        relevance: number;
    }>;
    platformOptimized: string[];
    recommendations: string[];
}> => {
    let prompt = `Analyze the following content and generate relevant hashtags for ${platform}.`;
    
    if (targetAudience) {
        prompt += ` Target audience: ${targetAudience}.`;
    }
    
    prompt += ` Provide hashtags with engagement scores (0-100), popularity levels, competition levels, and relevance scores.
    
    Content:
    ${content}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hashtags: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                tag: { type: Type.STRING },
                                engagementScore: { type: Type.NUMBER },
                                popularity: { 
                                    type: Type.STRING,
                                    enum: ['high', 'medium', 'low']
                                },
                                competition: { 
                                    type: Type.STRING,
                                    enum: ['high', 'medium', 'low']
                                },
                                relevance: { type: Type.NUMBER }
                            },
                            required: ['tag', 'engagementScore', 'popularity', 'competition', 'relevance']
                        }
                    },
                    platformOptimized: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    recommendations: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['hashtags', 'platformOptimized', 'recommendations']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        hashtags: result.hashtags || [],
        platformOptimized: result.platformOptimized || [],
        recommendations: result.recommendations || []
    };
};

export const analyzeTrendingTopics = async (
    industry: string,
    contentType: string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<{
    trendingTopics: Array<{
        topic: string;
        trendScore: number;
        category: string;
        relevanceToIndustry: number;
        suggestedAngles: string[];
    }>;
    integrationSuggestions: string[];
    timingSuggestions: string[];
}> => {
    const prompt = `Analyze current trending topics relevant to the ${industry} industry for ${contentType} content over the ${timeframe} timeframe. 
    
    Provide trending topics with trend scores (0-100), categories, industry relevance scores, and suggested content angles.
    Include integration suggestions and optimal timing recommendations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    trendingTopics: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                topic: { type: Type.STRING },
                                trendScore: { type: Type.NUMBER },
                                category: { type: Type.STRING },
                                relevanceToIndustry: { type: Type.NUMBER },
                                suggestedAngles: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ['topic', 'trendScore', 'category', 'relevanceToIndustry', 'suggestedAngles']
                        }
                    },
                    integrationSuggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    timingSuggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['trendingTopics', 'integrationSuggestions', 'timingSuggestions']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        trendingTopics: result.trendingTopics || [],
        integrationSuggestions: result.integrationSuggestions || [],
        timingSuggestions: result.timingSuggestions || []
    };
};

export const optimizeHashtagsForPlatform = async (
    hashtags: string[],
    platform: string,
    contentGoal: 'reach' | 'engagement' | 'conversion' = 'engagement'
): Promise<{
    optimizedHashtags: string[];
    platformLimits: {
        maxHashtags: number;
        recommendedCount: number;
        placement: string;
    };
    performancePrediction: {
        expectedReach: string;
        expectedEngagement: string;
        competitionLevel: string;
    };
    alternatives: string[];
}> => {
    const prompt = `Optimize the following hashtags for ${platform} with the goal of maximizing ${contentGoal}.
    
    Hashtags: ${hashtags.join(', ')}
    
    Consider platform-specific limits, best practices, and performance optimization. Provide optimized hashtags, platform limits, performance predictions, and alternative suggestions.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    optimizedHashtags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    platformLimits: {
                        type: Type.OBJECT,
                        properties: {
                            maxHashtags: { type: Type.NUMBER },
                            recommendedCount: { type: Type.NUMBER },
                            placement: { type: Type.STRING }
                        },
                        required: ['maxHashtags', 'recommendedCount', 'placement']
                    },
                    performancePrediction: {
                        type: Type.OBJECT,
                        properties: {
                            expectedReach: { type: Type.STRING },
                            expectedEngagement: { type: Type.STRING },
                            competitionLevel: { type: Type.STRING }
                        },
                        required: ['expectedReach', 'expectedEngagement', 'competitionLevel']
                    },
                    alternatives: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                },
                required: ['optimizedHashtags', 'platformLimits', 'performancePrediction', 'alternatives']
            }
        }
    });
    
    const result = JSON.parse(response.text);
    return {
        optimizedHashtags: result.optimizedHashtags || hashtags.slice(0, 5),
        platformLimits: result.platformLimits || { maxHashtags: 30, recommendedCount: 5, placement: 'end of post' },
        performancePrediction: result.performancePrediction || { 
            expectedReach: 'medium', 
            expectedEngagement: 'medium', 
            competitionLevel: 'medium' 
        },
        alternatives: result.alternatives || []
    };
};