import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  demographics: z.record(z.any()).default({}),
  interests: z.array(z.string()).default([]),
  behaviors: z.record(z.any()).default({}),
  pain_points: z.array(z.string()).default([]),
  preferred_content: z.array(z.string()).default([]),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const userId = z.string().min(1).parse(req.query.userId);
      const items = await db.getAudienceProfiles(userId);
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const data = createSchema.parse(req.body);
      const created = await db.addAudienceProfile({
        name: data.name,
        demographics: data.demographics,
        interests: data.interests,
        behaviors: data.behaviors,
        pain_points: data.pain_points,
        preferred_content: data.preferred_content,
      }, data.userId);
      return res.status(201).json(created);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('AUDIENCE PROFILES handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


