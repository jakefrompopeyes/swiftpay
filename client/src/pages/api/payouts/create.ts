import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'
import { authenticateApiKey } from '../../../lib/api-key-auth'
import { getPrice } from '../../../lib/price'
import { getTokenInfo } from '../../../lib/tokens'

export default async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const header = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined
  const apiKey = header?.startsWith('Bearer ') ? header.slice(7) : header
  if (apiKey && apiKey.startsWith('sk_')) {
    const result = await authenticateApiKey(apiKey, 30)
    if (!result.ok) return res.status(401).json({ success: false, error: result.error })
    ;(req as any).user = { id: result.userId }
    return run(req, res)
  }

  return authenticateToken(req, res, () => run(req, res))

  async function run(req2: AuthRequest, res2: NextApiResponse) {
    try {
      if (!supabaseAdmin) return res2.status(500).json({ success: false, error: 'Database not configured' })
      const { amountUsd, toAddress, network = 'ethereum', currency = 'USDC' } = req2.body || {}
      if (!amountUsd || !toAddress) return res2.status(400).json({ success: false, error: 'Missing amountUsd or toAddress' })

      const userId = (req2.user as any)!.id

      // Compute on-chain amount in token units using live price
      const price = await getPrice(currency)
      if (!price || price <= 0) return res2.status(400).json({ success: false, error: 'Price unavailable' })
      const token = getTokenInfo(network, currency)
      if (!token) return res2.status(400).json({ success: false, error: 'Unsupported token/network' })
      const tokenAmount = (Number(amountUsd) / price).toFixed(6)

      // Record payout as pending
      const { data: payout, error } = await supabaseAdmin
        .from('payouts')
        .insert({ user_id: userId, amount_usd: amountUsd, to_address: toAddress, network, currency, status: 'processing' })
        .select('id')
        .single()
      if (error) return res2.status(500).json({ success: false, error: 'Failed to create payout' })

      // Find a wallet for the network/currency to send from
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('id, address, network, currency')
        .eq('user_id', userId)
        .eq('network', network)
        .maybeSingle()

      if (!wallet) return res2.status(400).json({ success: false, error: 'No source wallet for this network' })

      // BYO mode: we do not sign or send on-chain payouts server-side.
      // Record the payout request; merchants should transfer manually from their wallet.
      await supabaseAdmin.from('payouts').update({ status: 'pending' }).eq('id', payout.id)
      return res2.json({ success: true, data: { id: payout.id, message: 'Payout recorded. Please send manually from your wallet.' } })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Payout create error:', e)
      return res2.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
}


