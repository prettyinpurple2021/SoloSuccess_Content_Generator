import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const userId = z.string().min(1).parse(req.query.userId);
      const series = await db.getContentSeries(userId);
      return res.status(200).json(series);
    }
    if (req.method === 'POST') {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().min(1),
          theme: z.string().default(''),
          total_posts: z.number().default(0),
          frequency: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
        })
        .parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result = await (pool as any)`
        INSERT INTO content_series (user_id, name, theme, total_posts, frequency, current_post)
        VALUES (${body.userId}, ${body.name}, ${body.theme}, ${body.total_posts}, ${body.frequency}, 0)
        RETURNING *`;
      return res.status(201).json(result[0]);
    }
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('CONTENT SERIES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
