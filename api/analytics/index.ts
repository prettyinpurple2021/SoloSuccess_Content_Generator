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

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
});

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    if (req.method === 'GET') {
      const q = querySchema.parse(req.query);
      const end = q.end ? new Date(q.end) : new Date();
      const start = q.start ? new Date(q.start) : new Date(new Date().getTime() - 30 * 86400000);
      const data = await db.getAnalyticsByTimeframe(start, end);
      return res.status(200).json(data);
    }
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('ANALYTICS error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
