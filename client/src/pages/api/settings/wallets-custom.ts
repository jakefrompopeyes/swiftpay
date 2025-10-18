import { NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware'

const evmAddressRe = /^0x[a-fA-F0-9]{40}$/
const solAddressRe = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function validate(network: string, address: string): boolean {
  const n = (network || '').toLowerCase()
  if (['ethereum','polygon','base','arbitrum','binance','optimism','avalanche','fantom'].includes(n)) return evmAddressRe.test(address)
  if (n === 'solana') return solAddressRe.test(address)
  if (n === 'bitcoin') return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || address.startsWith('bc1')
  if (n === 'monero') return /^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$/.test(address)
  return false
}

export default function handler(req: AuthRequest, res: NextApiResponse) {
  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })
      const userId = req.user!.id

      if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
          .from('wallets')
          .select('id, address, network, currency, is_active, source')
          .eq('user_id', userId)
          .eq('source', 'custom')
        if (error) return res.status(500).json({ success: false, error: 'Failed to load custom wallets' })
        return res.json({ success: true, data: data || [] })
      }

      if (req.method === 'POST') {
        const { network, address, currency } = req.body || {}
        if (!network || !address) return res.status(400).json({ success: false, error: 'Missing network or address' })
        if (!validate(network, address)) return res.status(400).json({ success: false, error: 'Invalid address for network' })

        // Normalize currency by network if not provided
        const n = String(network).toLowerCase()
        const currencyDefaultMap: Record<string, string> = {
          ethereum: 'ETH',
          base: 'ETH',
          arbitrum: 'ETH',
          optimism: 'ETH',
          polygon: 'MATIC',
          binance: 'BNB',
          avalanche: 'AVAX',
          fantom: 'FTM',
          solana: 'SOL',
          bitcoin: 'BTC',
          monero: 'XMR'
        }
        const normalizedCurrency = (String(currency || '').trim() || currencyDefaultMap[n] || '').toUpperCase() || null

        // Insert with minimal fields; set private_key to empty string for legacy NOT NULL schemas
        const row: any = {
          user_id: userId,
          network: n,
          address: String(address),
          currency: normalizedCurrency,
          is_active: true,
          source: 'custom'
        }
        // Backward compatibility: some schemas require non-null private_key
        row.private_key = ''

        const { data, error } = await supabaseAdmin
          .from('wallets')
          .insert(row)
          .select('id, address, network, currency, is_active')
          .single()
        if (error) return res.status(500).json({ success: false, error: error.message || 'Failed to save custom wallet' })
        return res.json({ success: true, data })
      }

      if (req.method === 'DELETE') {
        const { id } = (req.query || {}) as any
        if (!id || typeof id !== 'string') return res.status(400).json({ success: false, error: 'Missing id' })
        const { error } = await supabaseAdmin.from('wallets').delete().eq('id', id).eq('user_id', userId)
        if (error) return res.status(500).json({ success: false, error: 'Failed to delete wallet' })
        return res.json({ success: true })
      }

      if (req.method === 'PATCH') {
        const { id, is_active } = req.body || {}
        if (!id) return res.status(400).json({ success: false, error: 'Missing id' })
        const { error } = await supabaseAdmin
          .from('wallets')
          .update({ is_active: Boolean(is_active) })
          .eq('id', id)
          .eq('user_id', userId)
        if (error) return res.status(500).json({ success: false, error: 'Failed to update wallet' })
        return res.json({ success: true })
      }

      return res.status(405).json({ success: false, error: 'Method not allowed' })
    } catch (e) {
      return res.status(500).json({ success: false, error: 'Internal server error' })
    }
  })
}


