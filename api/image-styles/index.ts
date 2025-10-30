import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id ? z.string().min(1).parse(req.query.id) : undefined;
    if (req.method === 'GET') {
      const userId = z.string().optional().parse(req.query.userId);
      const styles = await db.getImageStyles(userId);
      return res.status(200).json(styles);
    }
    if (req.method === 'POST') {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().min(1),
          style_prompt: z.string().default(''),
          color_palette: z.array(z.string()).default([]),
          visual_elements: z.array(z.string()).default([]),
          brand_assets: z
            .array(z.object({ type: z.string(), data: z.string(), usage: z.string() }))
            .default([]),
        })
        .parse(req.body || {});
      const created = await (async () => {
        // direct insert (no dedicated db method yet)
        const { pool } = await import('../../services/neonService');
        const result = await (pool as any)`
          INSERT INTO image_styles (user_id, name, style_prompt, color_palette, visual_elements, brand_assets)
          VALUES (${body.userId}, ${body.name}, ${body.style_prompt}, ${JSON.stringify(body.color_palette)}, ${JSON.stringify(body.visual_elements)}, ${JSON.stringify(body.brand_assets)})
          RETURNING *`;
        return result[0];
      })();
      return res.status(201).json(created);
    }
    if (req.method === 'PUT' && id) {
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

    if (req.method === 'DELETE' && id) {
      const body = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result =
        await (pool as any)`DELETE FROM image_styles WHERE id = ${id} AND user_id = ${body.userId} RETURNING id`;
      if (!result[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('IMAGE STYLES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
