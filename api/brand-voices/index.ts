import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  tone: z.string().default(''),
  style_guidelines: z.record(z.any()).default({}),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id ? z.string().min(1).parse(req.query.id) : undefined;
    if (req.method === 'GET') {
      const userId = z.string().min(1).parse(req.query.userId);
      const items = await db.getBrandVoices(userId);
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const data = createSchema.parse(req.body);
      const created = await db.addBrandVoice({
        name: data.name,
        tone: data.tone,
        style_guidelines: data.style_guidelines,
      }, data.userId);
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
      const updateSchema = z.object({
        userId: z.string().min(1),
        name: z.string().optional(),
        tone: z.string().optional(),
        style_guidelines: z.record(z.any()).optional(),
      });
      const data = updateSchema.parse(req.body);
      const updated = await db.updateBrandVoice(id, data, data.userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteBrandVoice(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('BRAND VOICES handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


