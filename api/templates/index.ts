import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const userId = z.string().optional().parse(req.query.userId);
      const templates = await db.getContentTemplates(userId);
      return res.status(200).json(templates);
    }
    if (req.method === 'POST') {
      const body = z
        .object({
          userId: z.string().min(1),
          name: z.string().min(1),
          category: z.string().default('general'),
          industry: z.string().default('general'),
          content_type: z.string().min(1),
          structure: z.array(z.any()).default([]),
          customizable_fields: z.array(z.any()).default([]),
          is_public: z.boolean().default(false),
        })
        .parse(req.body || {});
      const { pool } = await import('../../services/neonService');
      const result = await (pool as any)`
        INSERT INTO content_templates (user_id, name, category, industry, content_type, structure, customizable_fields, is_public)
        VALUES (${body.userId}, ${body.name}, ${body.category}, ${body.industry}, ${body.content_type}, ${JSON.stringify(body.structure)}, ${JSON.stringify(body.customizable_fields)}, ${body.is_public})
        RETURNING *`;
      return res.status(201).json(result[0]);
    }
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('TEMPLATES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
