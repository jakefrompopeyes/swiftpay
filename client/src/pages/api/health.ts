import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  res.json({
    success: true,
    message: 'SwiftPay API is running',
    timestamp: new Date().toISOString()
  });
}
