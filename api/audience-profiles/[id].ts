import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const updateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  demographics: z.record(z.any()).optional(),
  interests: z.array(z.string()).optional(),
  behaviors: z.record(z.any()).optional(),
  pain_points: z.array(z.string()).optional(),
  preferred_content: z.array(z.string()).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = z.string().min(1).parse(req.query.id);

    if (req.method === 'PUT') {
      const data = updateSchema.parse(req.body);
      const updated = await db.updateAudienceProfile(id, data, data.userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteAudienceProfile(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('AUDIENCE PROFILES [id] handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


