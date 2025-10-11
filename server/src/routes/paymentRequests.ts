import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { broadcast } from '../utils/realtime';
import { PriceService } from '../services/price';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { BlockchainService } from '../services/blockchain';
import { subscriptionService } from '../services/subscriptions';

const router = Router();

// Helper: derive network from currency
function getNetworkForCurrency(currency: string): string {
  const map: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'TRX': 'tron',
    'BNB': 'bsc',
    'MATIC': 'polygon',
    'USDC': 'ethereum',
    'USDT': 'ethereum'
  };
  return map[currency?.toUpperCase?.()] || 'ethereum';
}

// Create a payment request (authenticated)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency, description } = req.body || {};
    if (!amount || !currency) {
      res.status(400).json({ success: false, error: 'amount and currency are required' });
      return;
    }

    const network = getNetworkForCurrency(currency);

    // Convert USD amount to crypto amount
    const priceService = new PriceService()
    const usd = parseFloat(String(amount))
    const cryptoAmount = await priceService.convertFromFiat(usd, currency.toUpperCase(), 'USD')

    // Find recipient address from user's wallets for this currency
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, address, network, currency')
      .eq('user_id', req.user!.id)
      .eq('currency', currency.toUpperCase())
      .single();

    if (walletError || !wallet) {
      res.status(404).json({ success: false, error: `No ${currency.toUpperCase()} wallet found` });
      return;
    }

    // Insert payment request
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: req.user!.id,
        amount: cryptoAmount,
        currency: currency.toUpperCase(),
        network,
        description: description || null,
        status: 'pending',
        to_address: wallet.address
      })
      .select('id, amount, currency, network, description, status, to_address, created_at')
      .single();

    if (error) throw error;

    // Preserve the correct client host/port
    const host = req.headers.host || 'localhost:3000'
    const protocol = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http')
    const base = `${protocol}://${host}`
    const checkoutUrl = `${base}/pay/${pr.id}`;

    // Subscribe address for webhook-based monitoring (no-op if not configured)
    await subscriptionService.subscribeAddress(pr.to_address, pr.network)
    // Notify listeners
    broadcast({ type: 'payment_request_updated', id: pr.id, status: pr.status })
    res.status(201).json({ success: true, data: { ...pr, checkoutUrl } });
  } catch (e: any) {
    console.error('Create payment request error:', e);
    res.status(500).json({ success: false, error: e.message || 'Failed to create payment request' });
  }
});

// Public: get payment request by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, amount, currency, network, description, status, to_address, created_at, tx_hash')
      .eq('id', id)
      .single();
    if (error || !pr) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }
    broadcast({ type: 'payment_request_updated', id: pr.id, status: pr.status, txHash: pr.tx_hash || undefined })
    res.json({ success: true, data: pr });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Failed to get payment request' });
  }
});

// List payment requests for current user (authenticated)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, amount, currency, network, description, status, to_address, created_at, tx_hash')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Failed to list payment requests' })
  }
})

// Public: status endpoint for polling
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .select('status, tx_hash')
      .eq('id', id)
      .single();
    if (error || !pr) {
      res.status(404).json({ success: false, error: 'Payment request not found' });
      return;
    }
    res.json({ success: true, data: pr });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

// Mark paid (authenticated administrative action for now)
router.post('/:id/mark-paid', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { txHash } = req.body || {};
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .update({ status: 'completed', tx_hash: txHash || null })
      .eq('id', id)
      .select('id, status, tx_hash')
      .single();
    if (error || !pr) throw error || new Error('Failed to update');
    res.json({ success: true, data: pr });
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Failed to mark paid' });
  }
});

// Lightweight on-chain watcher: check for incoming funds and mark paid if detected
router.post('/:id/check-chain', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, to_address, amount, currency, network, status')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single()

    if (error || !pr) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    if (pr.status === 'completed') {
      res.json({ success: true, data: { status: 'completed' } })
      return
    }

    const chain = new BlockchainService()
    if (pr.network === 'bitcoin') {
      // Not implemented: skip for now
      res.json({ success: true, data: { status: 'pending' } })
      return
    }

    const balanceStr = await chain.getBalance(pr.network, pr.to_address)
    const current = parseFloat(balanceStr || '0')
    const target = parseFloat(pr.amount)
    if (current >= target && target > 0) {
      await supabaseAdmin.from('payment_requests')
        .update({ status: 'completed' })
        .eq('id', pr.id)
      // Unsubscribe after completion
      await subscriptionService.unsubscribeAddress(pr.to_address, pr.network)
      broadcast({ type: 'payment_request_updated', id: pr.id, status: 'completed' })
      res.json({ success: true, data: { status: 'completed' } })
      return
    }

    res.json({ success: true, data: { status: 'pending' } })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Chain check failed' })
  }
})

// Public: list merchant currency options for a payment request
router.get('/:id/options', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { data: pr, error } = await supabaseAdmin
      .from('payment_requests')
      .select('id, user_id, amount, currency, network, status, to_address')
      .eq('id', id)
      .single()

    if (error || !pr) {
      res.status(404).json({ success: false, error: 'Payment request not found' })
      return
    }

    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('address, network, currency, id')
      .eq('user_id', pr.user_id)

    res.json({
      success: true,
      data: {
        request: {
          id: pr.id,
          amount: pr.amount,
          currency: pr.currency,
          network: pr.network,
          status: pr.status,
          toAddress: pr.to_address
        },
        wallets: wallets || []
      }
    })
  } catch (e: any) {
    res.status(500).json({ success: false, error: 'Failed to load payment options' })
  }
})

export default router;


