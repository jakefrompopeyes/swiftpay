import { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../../lib/supabase-server'
import { getTokenInfo, toBaseUnits } from '../../../lib/tokens'

// Verify a payment on-chain (EVM via Etherscan V2; Solana via RPC)
async function checkOnChain(payment: any): Promise<string | null> {
  try {
    const network = String(payment.network || '').toLowerCase()
    const currency = String(payment.currency || '').toUpperCase()
    const toAddress = String(payment.to_address)
    const amount = Number(payment.amount)

    const isEvm = ['ethereum','arbitrum','polygon','base','binance','optimism','avalanche','fantom'].includes(network)
    const isSolana = network === 'solana'

    if (isEvm) {
      const baseUrl = 'https://api.etherscan.io/v2/api'
      const chainIds: Record<string, number> = { ethereum:1, arbitrum:42161, polygon:137, base:8453, binance:56, optimism:10, avalanche:43114, fantom:250 }
      const chainId = chainIds[network]
      const apiKey = process.env.ETHERSCAN_API_KEY

      const token = getTokenInfo(network, currency)
      const minConfirmations = 5
      const fetchJson = async (url: string) => { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) return null; try { return await r.json() } catch { return null } }

      if (token && token.standard === 'erc20') {
        const units = toBaseUnits(amount, token.decimals)
        const url = `${baseUrl}?chainid=${chainId}&module=account&action=tokentx&address=${toAddress}&contractaddress=${token.address}&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
        const json: any = await fetchJson(url)
        const txs: any[] = json?.result || []
        const match = txs.find((tx: any) => String(tx.to).toLowerCase() === toAddress.toLowerCase() && String(tx.value) === units && parseInt(tx.confirmations || '0',10) >= minConfirmations)
        return match?.hash || null
      } else {
        const wei = toBaseUnits(amount, 18)
        const url = `${baseUrl}?chainid=${chainId}&module=account&action=txlist&address=${toAddress}&startblock=0&endblock=99999999&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
        const json: any = await fetchJson(url)
        const txs: any[] = json?.result || []
        const match = txs.find((tx: any) => String(tx.to).toLowerCase() === toAddress.toLowerCase() && String(tx.value) === wei && tx.isError === '0' && parseInt(tx.confirmations || '0',10) >= 5)
        return match?.hash || null
      }
    }

    if (isSolana) {
      const heliusKey = process.env.HELIUS_API_KEY
      const solRpc = process.env.SOLANA_RPC_URL || (heliusKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}` : 'https://api.mainnet-beta.solana.com')
      const sigsRes = await fetch(solRpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getSignaturesForAddress', params:[toAddress, { limit: 5 }] }) })
      const sigsJson: any = await sigsRes.json().catch(() => null)
      const signatures: any[] = sigsJson?.result || []
      for (const s of signatures) {
        const txRes = await fetch(solRpc, { method:'POST', headers:{ 'Content-Type':'application/json' }, cache:'no-store', body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'getTransaction', params:[s.signature, { maxSupportedTransactionVersion:0 }] }) })
        const txJson: any = await txRes.json().catch(() => null)
        const tx = txJson?.result; if (!tx || tx?.meta?.err) continue
        const token = getTokenInfo('solana', currency)
        if (!token) {
          const accountKeys: string[] = (tx.transaction?.message?.accountKeys || []).map((k: any) => (typeof k === 'string' ? k : k.pubkey))
          const idx = accountKeys.findIndex((a) => String(a) === toAddress)
          if (idx >= 0) {
            const pre = Number(tx.meta?.preBalances?.[idx] || 0)
            const post = Number(tx.meta?.postBalances?.[idx] || 0)
            const diffLamports = post - pre
            const expected = Number(toBaseUnits(amount, 9))
            if (diffLamports === expected) return s.signature
          }
        } else {
          const postTokenBalances: any[] = tx.meta?.postTokenBalances || []
          const match = postTokenBalances.find((b: any) => String(b.owner) === toAddress && String(b.mint) === token.address)
          if (match) return s.signature
        }
      }
    }

    return null
  } catch { return null }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET or POST so Vercel Cron can trigger without custom method/body
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' })
  if (!supabaseAdmin) return res.status(500).json({ success: false, error: 'Database not configured' })

  // Accept either header or query fallback for Vercel Cron
  const headerSecret = req.headers['x-cron-secret'] as string | undefined
  const authHeader = (req.headers['authorization'] as string | undefined) || ''
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const querySecret = typeof req.query.secret === 'string' ? (req.query.secret as string) : undefined
  const provided = headerSecret || bearer || querySecret
  if ((process.env.CRON_SECRET || '') && (!provided || provided !== process.env.CRON_SECRET)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    const expireMinutes = Math.max(1, parseInt(String(process.env.PAYMENT_EXPIRE_MINUTES || '5'), 10))
    const fiveMinutesAgo = new Date(Date.now() - expireMinutes * 60 * 1000).toISOString()

    // Bulk expire first to ensure old items flip even if chain checks fail
    const { error: bulkErr } = await supabaseAdmin
      .from('payment_requests')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .filter('status', 'ilike', 'pending')
      .lt('created_at', fiveMinutesAgo)
    if (bulkErr) {
      console.error('Cron bulk expire error:', bulkErr)
    }

    const { data: pendings, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, to_address, amount, currency, network, status, created_at, method_selected')
      .ilike('status', 'pending')
      .lte('created_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ success: false, error: 'Failed to load pending', details: error.message })

    let completed = 0, failed = 0
    for (const p of pendings || []) {
      const isExpired = new Date(p.created_at).toISOString() < fiveMinutesAgo
      const txHash = p.method_selected ? await checkOnChain(p) : null
      if (txHash) {
        const { error: upCompErr } = await supabaseAdmin.from('payment_requests').update({ status:'completed', tx_hash: txHash, updated_at: new Date().toISOString() }).eq('id', p.id)
        if (upCompErr) console.error('Cron complete update error:', upCompErr)
        completed++
        continue
      }
      if (isExpired) {
        const { error: upFailErr } = await supabaseAdmin.from('payment_requests').update({ status:'failed', updated_at: new Date().toISOString() }).eq('id', p.id)
        if (upFailErr) console.error('Cron fail update error:', upFailErr)
        failed++
      }
    }

    return res.json({ success: true, data: { scanned: (pendings || []).length, completed, failed, expireMinutes } })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Cron monitor error:', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}


