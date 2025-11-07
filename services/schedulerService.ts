import { z } from 'zod';
import { db } from './neonService';
import { contentAdaptationService } from './contentAdaptationService';

export const schedulePayloadSchema = z.object({
  userId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  content: z.string().min(1),
  platforms: z
    .array(
      z.enum([
        'twitter',
        'linkedin',
        'facebook',
        'instagram',
        'bluesky',
        'reddit',
        'pinterest',
        'blogger',
      ])
    )
    .min(1),
  scheduleDate: z.string(), // ISO 8601
  mediaUrls: z.array(z.string().url()).optional(),
  options: z
    .object({
      tone: z.enum(['professional', 'casual', 'friendly', 'authoritative']).optional(),
      includeCallToAction: z.boolean().optional(),
      targetAudience: z.string().optional(),
    })
    .optional(),
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
    // Get user from Stack Auth (this would be passed from the frontend)
    // For now, we'll use a placeholder
    const user = null; // This should be passed from the authenticated user context
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

  // Store jobs in database
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable');
  }

  const postgres = (await import('postgres')).default;
  const pool = postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 20,
    idle_timeout: 30,
    connect_timeout: 2,
  });

  try {
    for (const job of jobs) {
      await pool`
        INSERT INTO post_jobs (
          user_id, post_id, platform, run_at, status, attempts, max_attempts,
          idempotency_key, content, media_urls, payload
        ) VALUES (
          ${job.user_id}, ${job.post_id}, ${job.platform}, ${job.run_at}, ${job.status},
          ${job.attempts}, ${job.max_attempts}, ${job.idempotency_key}, ${job.content},
          ${job.media_urls}, ${JSON.stringify(job.payload)}
        )
        ON CONFLICT (idempotency_key) DO NOTHING
      `;
    }
    console.log(`✅ Scheduled ${jobs.length} post jobs`);
  } catch (error) {
    console.error('Error storing scheduled jobs:', error);
    throw error;
  } finally {
    await pool.end();
  }
};
