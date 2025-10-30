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

// Shape must match DatabaseAudienceProfile (see types.ts)
const createSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  age_range: z.string().default(''),
  industry: z.string().default(''),
  interests: z.array(z.string()).default([]),
  pain_points: z.array(z.string()).default([]),
  preferred_content_types: z.array(z.string()).default([]),
  engagement_patterns: z.record(z.any()).default({}),
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
      const items = await db.getAudienceProfiles(userId);
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      const data = createSchema.parse(req.body);
      const created = await db.addAudienceProfile(
        {
          name: data.name,
          age_range: data.age_range,
          industry: data.industry,
          interests: data.interests,
          pain_points: data.pain_points,
          preferred_content_types: data.preferred_content_types,
          engagement_patterns: data.engagement_patterns,
        },
        data.userId
      );
      return res.status(201).json(created);
    }

    if (req.method === 'PUT' && id) {
      const updateSchema = createSchema.partial().extend({ userId: z.string().min(1) });
      const data = updateSchema.parse(req.body);
      const updated = await db.updateAudienceProfile(
        id,
        {
          name: data.name,
          age_range: data.age_range,
          industry: data.industry,
          interests: data.interests,
          pain_points: data.pain_points,
          preferred_content_types: data.preferred_content_types,
          engagement_patterns: data.engagement_patterns,
        },
        data.userId
      );
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
