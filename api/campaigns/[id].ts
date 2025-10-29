import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const updateCampaignSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  theme: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'completed', 'paused']).optional(),
  performance: z.any().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = z.string().min(1).parse(req.query.id);

    if (req.method === 'PUT') {
      const data = updateCampaignSchema.parse(req.body);
      const updated = await db.updateCampaign(id, data, data.userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteCampaign(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('CAMPAIGNS [id] handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


