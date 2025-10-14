
import { z } from 'zod';
import { supabase } from './supabaseService';
import { contentAdaptationService } from './contentAdaptationService';

export const schedulePayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  content: z.string().min(1),
  platforms: z.array(z.enum(['twitter','linkedin','facebook','instagram','bluesky','reddit','pinterest','blogger'])).min(1),
  scheduleDate: z.string(), // ISO 8601
  mediaUrls: z.array(z.string().url()).optional(),
  options: z.object({
    tone: z.enum(['professional','casual','friendly','authoritative']).optional(),
    includeCallToAction: z.boolean().optional(),
    targetAudience: z.string().optional(),
  }).optional(),
});

export type SchedulePayload = z.infer<typeof schedulePayloadSchema>;

/**
 * Create one job per platform, content adapted strictly to platform limits.
 */
export const schedulePost = async (payload: SchedulePayload): Promise<void> => {
  const parsed = schedulePayloadSchema.parse(payload);

  // Resolve user id if not provided
  let userId = parsed.userId || '';
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    userId = user.id;
  }

  // Adapt content per platform
  const adaptations = await contentAdaptationService.adaptContentForMultiplePlatforms(
    parsed.content,
    parsed.platforms,
    {
      tone: parsed.options?.tone,
      includeCallToAction: parsed.options?.includeCallToAction,
      targetAudience: parsed.options?.targetAudience,
    }
  );

  const idempotencyBase = `${userId}:${parsed.postId || 'ad-hoc'}:${parsed.scheduleDate}`;

  const jobs = parsed.platforms.map((platform) => ({
    user_id: userId,
    post_id: parsed.postId || null,
    platform,
    run_at: parsed.scheduleDate,
    status: 'pending',
    attempts: 0,
    max_attempts: 5,
    idempotency_key: `${idempotencyBase}:${platform}`,
    content: adaptations[platform]?.content || parsed.content,
    media_urls: parsed.mediaUrls || [],
    payload: {},
  }));

  const { error } = await supabase.from('post_jobs').insert(jobs);
  if (error) {
    throw new Error(error.message);
  }
};
