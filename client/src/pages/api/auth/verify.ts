import { NextApiResponse } from 'next'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  return authenticateToken(req, res, () => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' })
      return
    }
    res.json({ success: true, data: { user: req.user } })
  })
}


