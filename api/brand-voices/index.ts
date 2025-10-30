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

// DatabaseBrandVoice shape
const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  tone: z.string().default(''),
  vocabulary: z.array(z.string()).default([]),
  writing_style: z.string().default(''),
  target_audience: z.string().default(''),
  sample_content: z.array(z.string()).default([]),
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
      const items = await db.getBrandVoices(userId);
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const data = createSchema.parse(req.body);
      const created = await db.addBrandVoice(
        {
          name: data.name,
          tone: data.tone,
          vocabulary: data.vocabulary,
          writing_style: data.writing_style,
          target_audience: data.target_audience,
          sample_content: data.sample_content,
        },
        data.userId
      );
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
      const updateSchema = createSchema.partial().extend({ userId: z.string().min(1) });
      const data = updateSchema.parse(req.body);
      const updated = await db.updateBrandVoice(
        id,
        {
          name: data.name,
          tone: data.tone,
          vocabulary: data.vocabulary,
          writing_style: data.writing_style,
          target_audience: data.target_audience,
          sample_content: data.sample_content,
        },
        data.userId
      );
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE' && id) {
      const { userId } = z.object({ userId: z.string().min(1) }).parse(req.body || {});
      await db.deleteBrandVoice(id, userId);
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: unknown) {
    console.error('BRAND VOICES handler error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
