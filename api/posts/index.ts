import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const createPostSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1),
  platform: z.string().min(1),
  scheduled_time: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const userId = z.string().min(1).parse(req.query.userId);
      const posts = await db.getPosts(userId);
      return res.status(200).json(posts);
    }

    if (req.method === 'POST') {
      const data = createPostSchema.parse(req.body);
      const created = await db.addPost(
        {
          content: data.content,
          platform: data.platform,
          scheduled_time: data.scheduled_time || null,
          metadata: data.metadata || {},
        },
        data.userId
      );
      return res.status(201).json(created);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('POSTS handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


