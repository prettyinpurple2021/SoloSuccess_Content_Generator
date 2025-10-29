import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const updatePostSchema = z.object({
  userId: z.string().min(1),
  content: z.string().optional(),
  platform: z.string().optional(),
  scheduled_time: z.string().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = z.string().min(1).parse(req.query.id);

    if (req.method === 'PUT') {
      const data = updatePostSchema.parse(req.body);
      const updated = await db.updatePost(
        id,
        {
          content: data.content,
          platform: data.platform,
          scheduled_time: data.scheduled_time ?? null,
          metadata: data.metadata,
        },
        data.userId
      );
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deletePost(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('POSTS [id] handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


