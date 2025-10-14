import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../../lib/auth-middleware';
import { getTokenInfo, toBaseUnits } from '../../../../lib/tokens'

// Chain monitoring endpoint to check for completed payments
// This would typically be called by a background job or cron service
// For now, we'll create a simple endpoint that can be called manually

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ success: false, error: 'Database not configured' });
      }

      const { paymentId } = req.body;

      if (!paymentId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing paymentId' 
        });
      }

      // Get the payment request
      const { data: payment, error: fetchError } = await supabaseAdmin
        .from('payment_requests')
        .select('id, user_id, to_address, amount, currency, network, status')
        .eq('id', paymentId)
        .single();

      if (fetchError || !payment) {
        return res.status(404).json({ 
          success: false, 
          error: 'Payment request not found' 
        });
      }

      if (payment.status !== 'pending') {
        return res.json({
          success: true,
          message: 'Payment already processed',
          data: { status: payment.status }
        });
      }

      // Real on-chain check
      const network = String(payment.network || '').toLowerCase()
      const currency = String(payment.currency || '').toUpperCase()
      const toAddress = String(payment.to_address)
      const amount = Number(payment.amount)

      const isEvm = ['ethereum', 'arbitrum', 'polygon', 'base', 'binance'].includes(network)
      const isSolana = network === 'solana'

      let foundTxHash: string | null = null

      if (isEvm) {
        // Etherscan V2 single endpoint with chainId param
        const baseUrl = 'https://api.etherscan.io/v2/api'
        const chainIds: Record<string, number> = {
          ethereum: 1,
          arbitrum: 42161,
          polygon: 137,
          base: 8453,
          binance: 56
        }
        const chainId = chainIds[network]
        const apiKey = process.env.ETHERSCAN_API_KEY

        const token = getTokenInfo(network, currency)
        const minConfirmations = 5

        // Helper to fetch JSON with no-store
        const fetchJson = async (url: string) => {
          const r = await fetch(url, { cache: 'no-store' })
          if (!r.ok) return null
          try { return await r.json() } catch { return null }
        }

        if (token && token.standard === 'erc20') {
          const units = toBaseUnits(amount, token.decimals)
          const url = `${baseUrl}?chainid=${chainId}&module=account&action=tokentx&address=${toAddress}&contractaddress=${token.address}&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
          const json: any = await fetchJson(url)
          const txs: any[] = json?.result || []
          const match = txs.find((tx: any) => {
            const toOk = String(tx.to).toLowerCase() === toAddress.toLowerCase()
            const valueOk = String(tx.value) === units
            const confOk = parseInt(tx.confirmations || '0', 10) >= minConfirmations
            return toOk && valueOk && confOk
          })
          if (match) foundTxHash = match.hash
        } else {
          // Native coin (ETH/BNB/MATIC, etc.)
          const wei = toBaseUnits(amount, 18)
          const url = `${baseUrl}?chainid=${chainId}&module=account&action=txlist&address=${toAddress}&startblock=0&endblock=99999999&sort=desc${apiKey ? `&apikey=${apiKey}` : ''}`
          const json: any = await fetchJson(url)
          const txs: any[] = json?.result || []
          const match = txs.find((tx: any) => {
            const toOk = String(tx.to).toLowerCase() === toAddress.toLowerCase()
            const valueOk = String(tx.value) === wei
            const successOk = tx.isError === '0'
            const confOk = parseInt(tx.confirmations || '0', 10) >= minConfirmations
            return toOk && valueOk && successOk && confOk
          })
          if (match) foundTxHash = match.hash
        }
      } else if (isSolana) {
        // Prefer Helius if available; else use public RPC
        const heliusKey = process.env.HELIUS_API_KEY
        const solRpc = process.env.SOLANA_RPC_URL || (heliusKey ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}` : 'https://api.mainnet-beta.solana.com')
        // Fetch recent signatures for the recipient address
        const sigsRes = await fetch(solRpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'getSignaturesForAddress', params: [toAddress, { limit: 20 }]
          })
        })
        const sigsJson: any = await sigsRes.json().catch(() => null)
        const signatures: any[] = sigsJson?.result || []
        if (signatures.length > 0) {
          for (const s of signatures) {
            const txRes = await fetch(solRpc, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [s.signature, { maxSupportedTransactionVersion: 0 }] })
            })
            const txJson: any = await txRes.json().catch(() => null)
            const tx = txJson?.result
            if (!tx) continue
            const err = tx?.meta?.err
            if (err) continue

            // Native SOL transfer: check postBalances-preBalances for recipient
            const token = getTokenInfo('solana', currency)
            if (!token) {
              // SOL
              const accountKeys: string[] = (tx.transaction?.message?.accountKeys || []).map((k: any) => (typeof k === 'string' ? k : k.pubkey))
              const idx = accountKeys.findIndex((a) => String(a) === toAddress)
              if (idx >= 0) {
                const pre = Number(tx.meta?.preBalances?.[idx] || 0)
                const post = Number(tx.meta?.postBalances?.[idx] || 0)
                const diffLamports = post - pre
                const expected = Number(toBaseUnits(amount, 9)) // 9 decimals for SOL
                if (diffLamports === expected) {
                  foundTxHash = s.signature
                  break
                }
              }
            } else {
              // SPL token transfer: inspect tokenBalances delta
              const postTokenBalances: any[] = tx.meta?.postTokenBalances || []
              const match = postTokenBalances.find((b: any) => {
                const ownerOk = String(b.owner) === toAddress
                const mintOk = String(b.mint) === token.address
                return ownerOk && mintOk
              })
              if (match) {
                // We have a token balance; compute diff with preTokenBalances
                const preTokenBalances: any[] = tx.meta?.preTokenBalances || []
                const pre = preTokenBalances.find((b: any) => String(b.owner) === toAddress && String(b.mint) === token.address)
                const preUi = pre ? Number(pre.uiTokenAmount.uiAmount) : 0
                const postUi = Number(match.uiTokenAmount.uiAmount)
                const delta = postUi - preUi
                if (Math.abs(delta - amount) < 1e-6) {
                  foundTxHash = s.signature
                  break
                }
              }
            }
          }
        }
      }

      if (!foundTxHash) {
        return res.json({ success: true, message: 'No matching transaction found', data: { status: 'pending' } })
      }

      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from('payment_requests')
        .update({
          status: 'completed',
          transaction_hash: foundTxHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select('id, status, transaction_hash')
        .single();

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        return res.status(500).json({ success: false, error: 'Failed to update payment status' });
      }

      return res.json({
        success: true,
        message: 'Payment confirmed on chain',
        data: { paymentId: updatedPayment.id, status: updatedPayment.status, transactionHash: updatedPayment.transaction_hash }
      })

    } catch (error: any) {
      console.error('Chain monitoring error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}

// Example of how to integrate with real blockchain APIs:
/*
async function checkEthereumTransaction(address: string, amount: string, network: string) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const baseUrl = network === 'ethereum' ? 'https://api.etherscan.io' : 
                  network === 'arbitrum' ? 'https://api.arbiscan.io' :
                  network === 'polygon' ? 'https://api.polygonscan.com' :
                  'https://api.basescan.org';
  
  const response = await fetch(
    `${baseUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
  );
  
  const data = await response.json();
  
  if (data.status === '1' && data.result.length > 0) {
    // Check for transactions matching the expected amount
    const matchingTx = data.result.find((tx: any) => {
      const txAmount = parseFloat(tx.value) / Math.pow(10, 18); // Convert from wei
      return Math.abs(txAmount - parseFloat(amount)) < 0.001; // Allow small variance
    });
    
    return matchingTx ? {
      hash: matchingTx.hash,
      confirmed: parseInt(matchingTx.confirmations) >= 12 // 12 confirmations for security
    } : null;
  }
  
  return null;
}

async function checkSolanaTransaction(address: string, amount: string) {
  const response = await fetch(`https://api.solscan.io/account/transactions?account=${address}&limit=10`);
  const data = await response.json();
  
  if (data.success && data.data.length > 0) {
    const matchingTx = data.data.find((tx: any) => {
      return tx.amount === parseFloat(amount) && tx.status === 'Success';
    });
    
    return matchingTx ? {
      hash: matchingTx.signature,
      confirmed: true // Solana transactions are final when successful
    } : null;
  }
  
  return null;
}
*/