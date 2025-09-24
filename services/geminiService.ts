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