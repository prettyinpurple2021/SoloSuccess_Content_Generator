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

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('BRAND VOICES handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


