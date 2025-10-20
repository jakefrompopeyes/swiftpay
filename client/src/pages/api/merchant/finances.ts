import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'
import { getPrice } from '../../../lib/price'
import { authenticateApiKey } from '../../../lib/api-key-auth'

export default async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const header = (req.headers['authorization'] || req.headers['x-api-key']) as string | undefined
  const apiKey = header?.startsWith('Bearer ') ? header.slice(7) : header
  if (apiKey && apiKey.startsWith('sk_')) {
    const result = await authenticateApiKey(apiKey, 120)
    if (!result.ok) return res.status(401).json({ success: false, error: result.error })
    ;(req as any).user = { id: result.userId }
    return run(req, res)
  }

  return authenticateToken(req, res, () => run(req, res))

  async function run(req2: AuthRequest, res2: NextApiResponse) {
    try {
      if (!supabaseAdmin) {
        return res2.status(500).json({ success: false, error: 'Database not configured' })
      }

      const userId = (req2.user as any)!.id

      // Auto-expire old pending (>5m)
      const threshold = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'failed' })
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lt('created_at', threshold)

      const { data: rows, error } = await supabaseAdmin
        .from('payment_requests')
        .select('id, amount, currency, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Finances fetch error:', error)
        return res2.status(500).json({ success: false, error: 'Failed to load finances' })
      }

      const payments = rows || []
      // Preload prices
      const symbols: string[] = Array.from(new Set(payments.map((p: any) => String(p.currency || '').toUpperCase()))).filter(Boolean) as string[]
      const priceMap: Record<string, number> = {}
      await Promise.all(symbols.map(async (sym: string) => {
        try {
          const normalized: string = sym === 'POL' ? 'MATIC' : sym
          priceMap[sym] = await getPrice(normalized)
        } catch { priceMap[sym] = 0 }
      }))

      let availableUSD = 0
      let pendingUSD = 0
      const recentTransactions = payments.slice(0, 20).map((p: any) => {
        const sym = String(p.currency || '').toUpperCase()
        const amt = parseFloat(String(p.amount)) || 0
        const price = priceMap[sym] || 0
        const usd = price > 0 ? amt * price : 0
        if (String(p.status) === 'completed') availableUSD += usd
        else if (String(p.status) === 'pending') pendingUSD += usd
        return {
          id: p.id,
          type: 'payment',
          amount: usd,
          currency: 'USD',
          status: p.status,
          method: 'Crypto Payment',
          date: p.created_at,
          fee: 0
        }
      })

      // Subtract completed payouts from availableUSD
      const { data: payouts } = await supabaseAdmin
        .from('payouts')
        .select('amount_usd, status')
        .eq('user_id', userId)
      type PayoutRow = { amount_usd: number | string; status: string }
      const payoutRows: PayoutRow[] = (payouts || []) as PayoutRow[]
      const totalPaid = payoutRows
        .filter((p: PayoutRow) => p.status === 'completed')
        .reduce((s: number, p: PayoutRow) => s + Number(p.amount_usd || 0), 0)
      availableUSD = Math.max(0, availableUSD - totalPaid)

      return res2.json({ success: true, data: { availableUSD, pendingUSD, recentTransactions } })
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Finances error:', e)
      return res2.status(500).json({ success: false, error: 'Internal server error' })
    }
  }
}


