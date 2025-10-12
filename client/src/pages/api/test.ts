import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    method: req.method
  });
}
