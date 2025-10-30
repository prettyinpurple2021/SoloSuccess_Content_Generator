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
    const id = req.query.id ? z.string().min(1).parse(req.query.id) : undefined;
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

    if (req.method === 'PUT' && id) {
      const updateSchema = z.object({
        userId: z.string().min(1),
        name: z.string().optional(),
        demographics: z.record(z.any()).optional(),
        interests: z.array(z.string()).optional(),
        behaviors: z.record(z.any()).optional(),
        pain_points: z.array(z.string()).optional(),
        preferred_content: z.array(z.string()).optional(),
      });
      const data = updateSchema.parse(req.body);
      const updated = await db.updateAudienceProfile(id, data, data.userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteAudienceProfile(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('AUDIENCE PROFILES handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


