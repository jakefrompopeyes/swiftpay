import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { coinbaseCloudService } from '../services/coinbaseCloud';

const router = Router();

// Get user's transactions
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    // Get user's wallets first
    const { data: userWallets } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', req.user!.id);

    if (!userWallets || userWallets.length === 0) {
      res.json({
        success: true,
        data: []
      });
      return;
    }

    const walletIds = userWallets.map(w => w.id);

    // Get transactions where user is sender or receiver
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        currency,
        status,
        tx_hash,
        created_at,
        from_wallet:wallets!from_wallet_id(address),
        to_wallet:wallets!to_wallet_id(address)
      `)
      .or(`from_wallet_id.in.(${walletIds.join(',')}),to_wallet_id.in.(${walletIds.join(',')})`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: transactions || []
    });

  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transactions'
    });
  }
}));

// Create new transaction
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { toAddress, amount, currency, network = 'ethereum' } = req.body;

  if (!toAddress || !amount || !currency) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: toAddress, amount, currency'
    });
    return;
  }

  try {
    // Get user's wallet for the specified network
    const { data: fromWallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, address, network, currency, coinbase_wallet_id')
      .eq('user_id', req.user!.id)
      .eq('network', network)
      .eq('currency', currency.toUpperCase())
      .single();

    if (walletError || !fromWallet) {
      res.status(404).json({
        success: false,
        error: `Wallet not found for ${currency} on ${network}`
      });
      return;
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        from_wallet_id: fromWallet.id,
        to_wallet_id: null, // External address
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        status: 'pending'
      })
      .select()
      .single();

    if (txError) {
      throw txError;
    }

    // Send transaction using Coinbase Cloud
    const txResult = await coinbaseCloudService.sendTransaction(
      fromWallet.coinbase_wallet_id || fromWallet.address,
      toAddress,
      amount,
      currency.toUpperCase(),
      network
    );

    // Update transaction with hash
    await supabaseAdmin
      .from('transactions')
      .update({ 
        tx_hash: txResult.txHash,
        status: 'completed'
      })
      .eq('id', transaction.id);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        id: transaction.id,
        txHash: txResult.txHash,
        explorerUrl: txResult.explorerUrl,
        status: 'completed'
      }
    });

  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create transaction'
    });
  }
}));

// Get transaction by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        amount,
        currency,
        status,
        tx_hash,
        created_at,
        from_wallet:wallets!from_wallet_id(address),
        to_wallet:wallets!to_wallet_id(address)
      `)
      .eq('id', id)
      .single();

    if (error || !transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
      return;
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction'
    });
  }
}));

export default router;