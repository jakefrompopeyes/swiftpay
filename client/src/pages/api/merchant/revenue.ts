import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'
import { getPrice } from '../../../lib/price'

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' })
      }

      const userId = req.user!.id
      const days = Math.max(1, Math.min(60, parseInt(String(req.query.days || '30'), 10)))
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: rows, error } = await supabaseAdmin
        .from('payment_requests')
        .select('created_at, amount, currency, status')
        .eq('user_id', userId)
        .gte('created_at', since)
        .order('created_at', { ascending: true })

      if (error) {
        // eslint-disable-next-line no-console
        console.error('Revenue fetch error:', error)
        return res.status(500).json({ success: false, error: 'Failed to load revenue' })
      }

      const payments = rows || []
      // Collect unique symbols for pricing
      const symbols = Array.from(new Set(payments.map((p: any) => String(p.currency || '').toUpperCase()))).filter(Boolean)
      const priceMap: Record<string, number> = {}
      await Promise.all(symbols.map(async (sym) => {
        try {
          // Map POL to MATIC as elsewhere
          const normalized = sym === 'POL' ? 'MATIC' : sym
          priceMap[sym] = await getPrice(normalized)
        } catch {
          priceMap[sym] = 0
        }
      }))

      // Group by day (YYYY-MM-DD) and sum USD by status buckets
      const dayToCompletedUsd: Record<string, number> = {}
      const dayToPendingUsd: Record<string, number> = {}
      const dayToUnderpaidUsd: Record<string, number> = {}
      for (const p of payments) {
        const d = new Date(p.created_at)
        const dayKey = d.toISOString().slice(0, 10)
        const sym = String(p.currency || '').toUpperCase()
        const amt = parseFloat(String(p.amount)) || 0
        const price = priceMap[sym] || 0
        const usd = price > 0 ? amt * price : 0
        const status = String(p.status || '').toLowerCase()
        if (status === 'completed') dayToCompletedUsd[dayKey] = (dayToCompletedUsd[dayKey] || 0) + usd
        else if (status === 'pending') dayToPendingUsd[dayKey] = (dayToPendingUsd[dayKey] || 0) + usd
        else if (status === 'underpaid') dayToUnderpaidUsd[dayKey] = (dayToUnderpaidUsd[dayKey] || 0) + usd
      }

      // Build consecutive day labels for the window to avoid gaps
      const labels: string[] = []
      const completed: number[] = []
      const pending: number[] = []
      const underpaid: number[] = []
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (days - 1))
      for (let i = 0; i < days; i++) {
        const dt = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
        const key = dt.toISOString().slice(0, 10)
        labels.push(dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        completed.push(Number((dayToCompletedUsd[key] || 0).toFixed(2)))
        pending.push(Number((dayToPendingUsd[key] || 0).toFixed(2)))
        underpaid.push(Number((dayToUnderpaidUsd[key] || 0).toFixed(2)))
      }

      // Week-over-week for completed revenue (last 7 vs previous 7)
      const last7 = completed.slice(-7)
      const prev7 = completed.slice(-14, -7)
      const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
      const last7Sum = sum(last7)
      const prev7Sum = sum(prev7)
      const wowPct = prev7Sum > 0 ? ((last7Sum - prev7Sum) / prev7Sum) * 100 : (last7Sum > 0 ? 100 : 0)

      const chartData = {
        labels,
        datasets: [
          {
            label: 'Revenue ($)',
            data: completed,
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
          }
        ],
        meta: {
          buckets: {
            completed,
            pending,
            underpaid
          },
          summary: {
            totalCompletedUsd: Number(sum(completed).toFixed(2)),
            totalPendingUsd: Number(sum(pending).toFixed(2)),
            totalUnderpaidUsd: Number(sum(underpaid).toFixed(2)),
            wow: {
              current7dUsd: Number(last7Sum.toFixed(2)),
              prev7dUsd: Number(prev7Sum.toFixed(2)),
              pct: Number(wowPct.toFixed(2))
            }
          }
        }
      }

      res.json({ success: true, data: chartData })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Revenue error:', err)
      res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


