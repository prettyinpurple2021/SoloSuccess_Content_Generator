import { z } from 'zod';
import { db } from '../../services/databaseService';

interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
}

const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(''),
  theme: z.string().default(''),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  platforms: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'completed', 'paused']).default('draft'),
  performance: z.any().optional(),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const id = req.query.id
      ? z
          .string()
          .min(1)
          .parse(req.query.id as string)
      : undefined;
    if (req.method === 'GET') {
      const userId = z
        .string()
        .min(1)
        .parse(req.query.userId as string);
      const campaigns = await db.getCampaigns(userId);
      return res.status(200).json(campaigns);
    }

    if (req.method === 'POST') {
      const data = createSchema.parse(req.body);
      const created = await db.addCampaign(
        {
          name: data.name,
          description: data.description,
          theme: data.theme,
          start_date: data.start_date,
          end_date: data.end_date,
          platforms: data.platforms,
          status: data.status,
          performance: data.performance || {
            totalPosts: 0,
            totalEngagement: 0,
            avgEngagementRate: 0,
            platformPerformance: {},
          },
        },
        data.userId
      );
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
      const updateSchema = createSchema.partial().extend({ userId: z.string().min(1) });
      const data = updateSchema.parse(req.body);
      const updated = await db.updateCampaign(
        id,
        {
          name: data.name,
          description: data.description,
          theme: data.theme,
          start_date: data.start_date,
          end_date: data.end_date,
          platforms: data.platforms,
          status: data.status,
          performance: data.performance,
        },
        data.userId
      );
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
