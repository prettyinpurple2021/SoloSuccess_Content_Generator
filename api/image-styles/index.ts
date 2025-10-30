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
  style_prompt: z.string().default(''),
  color_palette: z.array(z.string()).default([]),
  visual_elements: z.array(z.string()).default([]),
  brand_assets: z
    .array(
      z.object({
        type: z.string(),
        data: z.string(),
        usage: z.string(),
      })
    )
    .default([]),
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
        .optional()
        .parse(req.query.userId as string | undefined);
      const styles = await db.getImageStyles(userId);
      return res.status(200).json(styles);
    }
    // POST, PUT, and DELETE are stubs unless create/update functions are added to db
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('IMAGE STYLES error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
