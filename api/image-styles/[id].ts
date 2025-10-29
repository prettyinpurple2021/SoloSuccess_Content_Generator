import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = z.string().min(1).parse(req.query.id);

    if (req.method === 'PUT') {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().optional(),
          style_prompt: z.string().optional(),
          color_palette: z.array(z.string()).optional(),
          visual_elements: z.array(z.string()).optional(),
          brand_assets: z
            .array(z.object({ type: z.string(), data: z.string(), usage: z.string() }))
            .optional(),
        })
        .parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result = await (pool as any)`
        UPDATE image_styles SET
          name = COALESCE(${body.name || null}, name),
          style_prompt = COALESCE(${body.style_prompt || null}, style_prompt),
          color_palette = COALESCE(${body.color_palette ? JSON.stringify(body.color_palette) : null}, color_palette),
          visual_elements = COALESCE(${body.visual_elements ? JSON.stringify(body.visual_elements) : null}, visual_elements),
          brand_assets = COALESCE(${body.brand_assets ? JSON.stringify(body.brand_assets) : null}, brand_assets)
        WHERE id = ${id} AND user_id = ${body.userId}
        RETURNING *`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(result[0]);
    }

    if (req.method === 'DELETE') {
      const body = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result =
        await (pool as any)`DELETE FROM image_styles WHERE id = ${id} AND user_id = ${body.userId} RETURNING id`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('IMAGE STYLES [id] error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
