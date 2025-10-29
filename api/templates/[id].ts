import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = z.string().min(1).parse(req.query.id);
    const { pool } = await import('../../services/neonService');

    if (req.method === 'PUT') {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().optional(),
          category: z.string().optional(),
          industry: z.string().optional(),
          content_type: z.string().optional(),
          structure: z.array(z.any()).optional(),
          customizable_fields: z.array(z.any()).optional(),
          is_public: z.boolean().optional(),
        })
        .parse(req.body || {});
      const result = await (pool as any)`
        UPDATE content_templates SET
          name = COALESCE(${body.name || null}, name),
          category = COALESCE(${body.category || null}, category),
          industry = COALESCE(${body.industry || null}, industry),
          content_type = COALESCE(${body.content_type || null}, content_type),
          structure = COALESCE(${body.structure ? JSON.stringify(body.structure) : null}, structure),
          customizable_fields = COALESCE(${body.customizable_fields ? JSON.stringify(body.customizable_fields) : null}, customizable_fields),
          is_public = COALESCE(${typeof body.is_public === 'boolean' ? body.is_public : null}, is_public)
        WHERE id = ${id} AND user_id = ${body.userId}
        RETURNING *`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const body = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      const result =
        await (pool as any)`DELETE FROM content_templates WHERE id = ${id} AND user_id = ${body.userId} RETURNING id`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('TEMPLATES [id] error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
