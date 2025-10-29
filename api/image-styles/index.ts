import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
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
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('IMAGE STYLES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
