import { z } from 'zod';

export const schedulePayloadSchema = z.object({
  userId: z.string().min(1),
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
  mediaUrls: z.array(z.string()).optional(),
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
 * Schedule a post for future publication via Upstash QStash
 * Saves post to Neon Postgres with status='scheduled'
 * Upstash cron will process it automatically every 15 minutes
 */
export const schedulePost = async (payload: SchedulePayload): Promise<void> => {
  const parsed = schedulePayloadSchema.parse(payload);

  if (!parsed.userId) {
    throw new Error('User ID is required');
  }

  // Validate schedule date is not in the past
  const scheduleTime = new Date(parsed.scheduleDate);
  if (scheduleTime <= new Date()) {
    throw new Error('Schedule date must be in the future');
  }

  // Validate schedule date is not more than 30 days in future
  const maxScheduleTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (scheduleTime > maxScheduleTime) {
    throw new Error('Cannot schedule posts more than 30 days in advance');
  }

  // Call API to save post to database
  const response = await fetch('/api/scheduled-posts/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: parsed.userId,
      content: parsed.content,
      platforms: parsed.platforms,
      scheduledAt: parsed.scheduleDate,
      mediaUrls: parsed.mediaUrls,
      options: parsed.options,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to schedule posts' }));
    throw new Error(error.error || 'Failed to schedule posts');
  }

  const result = await response.json();
  // Don't log - keep service clean

  // Upstash QStash will automatically process this when the time comes
  // No need to trigger immediate processing
};
