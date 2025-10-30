import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id ? z.string().min(1).parse(req.query.id) : undefined;
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
    if (req.method === 'PUT' && id) {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().optional(),
          theme: z.string().optional(),
          total_posts: z.number().optional(),
          frequency: z.enum(['daily', 'weekly', 'biweekly']).optional(),
          current_post: z.number().optional(),
        })
        .parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result = await (pool as any)`
        UPDATE content_series SET
          name = COALESCE(${body.name || null}, name),
          theme = COALESCE(${body.theme || null}, theme),
          total_posts = COALESCE(${body.total_posts ?? null}, total_posts),
          frequency = COALESCE(${body.frequency || null}, frequency),
          current_post = COALESCE(${body.current_post ?? null}, current_post)
        WHERE id = ${id} AND user_id = ${body.userId}
        RETURNING *`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE' && id) {
      const body = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result =
        await (pool as any)`DELETE FROM content_series WHERE id = ${id} AND user_id = ${body.userId} RETURNING id`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('CONTENT SERIES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
