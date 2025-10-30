import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { db } from '../../services/databaseService';

const createCampaignSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  theme: z.string().default(''),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  platforms: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'completed', 'paused']).default('draft'),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id ? z.string().min(1).parse(req.query.id) : undefined;
    if (req.method === 'GET') {
      const userId = z.string().min(1).parse(req.query.userId);
      const campaigns = await db.getCampaigns(userId);
      return res.status(200).json(campaigns);
    }

    if (req.method === 'POST') {
      const data = createCampaignSchema.parse(req.body);
      const created = await db.addCampaign({
        name: data.name,
        description: data.description,
        theme: data.theme,
        start_date: data.start_date,
        end_date: data.end_date,
        platforms: data.platforms,
        status: data.status,
        performance: {
          totalPosts: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          platformPerformance: {},
        },
      }, data.userId);
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
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
      const data = updateCampaignSchema.parse(req.body);
      const updated = await db.updateCampaign(id, data, data.userId);
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteCampaign(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('CAMPAIGNS handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


