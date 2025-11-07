import { z } from 'zod';
import { db } from '../../../services/databaseService';

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
  theme: z.string().default(''),
  total_posts: z.number().default(0),
  frequency: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
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
      const series = await db.getContentSeries(userId);
      return res.status(200).json(series);
    }
    // POST, PUT, and DELETE are stubs unless add/update series is implemented in db
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('CONTENT SERIES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
