import { NextApiRequest, NextApiResponse } from 'next'
import { authenticateApiKey } from '../../../lib/api-key-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const header = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined
  const key = header?.startsWith('Bearer ') ? header.slice(7) : header
  const result = await authenticateApiKey(key, 60)
  if (!result.ok) return res.status(401).json({ success: false, error: result.error })
  return res.json({ success: true, data: { userId: result.userId } })
}


