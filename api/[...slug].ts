import type { VercelRequest, VercelResponse } from '@vercel/node';
import { routeRequest } from '../server/apiRoutes/router';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await routeRequest(req, res);
  } catch (error) {
    console.error('API router error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
