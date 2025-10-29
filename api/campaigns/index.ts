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

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('CAMPAIGNS handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


