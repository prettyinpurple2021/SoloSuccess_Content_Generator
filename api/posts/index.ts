import { z } from 'zod';
import { db } from '../../services/databaseService';

// Minimal API Request/Response types to avoid external deps
interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

const createPostSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1),
  // Align with DatabasePost: use schedule_date (ISO string) if provided
  schedule_date: z.string().optional(),
  // Optional mapped fields from our types
  topic: z.string().optional(),
  idea: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  headlines: z.array(z.string()).optional(),
  social_media_posts: z.record(z.any()).optional(),
  social_media_tones: z.record(z.any()).optional(),
  social_media_audiences: z.record(z.any()).optional(),
  selected_image: z.string().optional(),
  brand_voice_id: z.string().optional(),
  audience_profile_id: z.string().optional(),
  campaign_id: z.string().optional(),
  series_id: z.string().optional(),
  template_id: z.string().optional(),
  performance_score: z.number().optional(),
  optimization_suggestions: z.array(z.any()).optional(),
  image_style_id: z.string().optional(),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const id = req.query.id
      ? z
          .string()
          .min(1)
          .parse(req.query.id as string)
      : undefined;

    if (req.method === 'GET') {
      const userId = z
        .string()
        .min(1)
        .parse(req.query.userId as string);
      const posts = await db.getPosts(userId);
      return res.status(200).json(posts);
    }

    if (req.method === 'POST') {
      const data = createPostSchema.parse(req.body);
      const created = await db.addPost(
        {
          topic: data.topic || null,
          idea: data.idea || null,
          content: data.content,
          status: (data.status as any) || null,
          tags: data.tags || null,
          summary: data.summary || null,
          headlines: data.headlines || null,
          social_media_posts: (data.social_media_posts as any) || null,
          social_media_tones: (data.social_media_tones as any) || null,
          social_media_audiences: (data.social_media_audiences as any) || null,
          selected_image: data.selected_image || null,
          schedule_date: data.schedule_date || null,
          brand_voice_id: data.brand_voice_id || null,
          audience_profile_id: data.audience_profile_id || null,
          campaign_id: data.campaign_id || null,
          series_id: data.series_id || null,
          template_id: data.template_id || null,
          performance_score: data.performance_score || null,
          optimization_suggestions: (data.optimization_suggestions as any) || null,
          image_style_id: data.image_style_id || null,
        } as any,
        data.userId
      );
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
      const updatePostSchema = createPostSchema.partial().extend({ userId: z.string().min(1) });
      const data = updatePostSchema.parse(req.body);
      const updated = await db.updatePost(
        id,
        {
          topic: data.topic,
          idea: data.idea,
          content: data.content,
          status: data.status as any,
          tags: data.tags,
          summary: data.summary,
          headlines: data.headlines,
          social_media_posts: data.social_media_posts as any,
          social_media_tones: data.social_media_tones as any,
          social_media_audiences: data.social_media_audiences as any,
          selected_image: data.selected_image,
          schedule_date: data.schedule_date ?? null,
          brand_voice_id: data.brand_voice_id,
          audience_profile_id: data.audience_profile_id,
          campaign_id: data.campaign_id,
          series_id: data.series_id,
          template_id: data.template_id,
          performance_score: data.performance_score,
          optimization_suggestions: data.optimization_suggestions as any,
          image_style_id: data.image_style_id,
        } as any,
        data.userId
      );
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deletePost(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('POSTS handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
