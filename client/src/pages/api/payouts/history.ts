import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'
import { authenticateApiKey } from '../../../lib/api-key-auth'

export default async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const header = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined
  const apiKey = header?.startsWith('Bearer ') ? header.slice(7) : header
  if (apiKey && apiKey.startsWith('sk_')) {
    const result = await authenticateApiKey(apiKey, 60)
    if (!result.ok) return res.status(401).json({ success: false, error: result.error })
    ;(req as any).user = { id: result.userId }
    return run(req, res)
  }

  return authenticateToken(req, res, () => run(req, res))

  async function run(req2: AuthRequest, res2: NextApiResponse) {
    try {
      if (!supabaseAdmin) return res2.status(500).json({ success: false, error: 'Database not configured' })
      const userId = (req2.user as any)!.id
      const { data, error } = await supabaseAdmin
        .from('payouts')
        .select('id, amount_usd, to_address, network, currency, status, tx_hash, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) return res2.status(500).json({ success: false, error: 'Failed to load payouts' })
      return res2.json({ success: true, data: data || [] })
    } catch (e) {
      return res2.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
}


