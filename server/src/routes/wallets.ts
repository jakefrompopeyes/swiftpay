import { Router, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { coinbaseCloudService } from '../services/coinbaseCloud';

const router = Router();

// Get user's wallets
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { data: wallets, error } = await supabaseAdmin
      .from('wallets')
      .select('id, address, network, currency, created_at')
      .eq('user_id', req.user!.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: wallets || []
    });

  } catch (error: any) {
    console.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallets'
    });
  }
}));

// Create new wallet using Coinbase Cloud
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { network = 'ethereum' } = req.body;

  try {
    // Create wallet using Coinbase Cloud WaaS
    const walletResult = await coinbaseCloudService.createWallet(req.user!.id, network);

    // Save wallet reference to our database
    const { data: savedWallet, error } = await supabaseAdmin
      .from('wallets')
      .insert({
        user_id: req.user!.id,
        address: walletResult.address,
        private_key: `coinbase_cloud_${walletResult.walletId}`, // Store Coinbase Cloud wallet ID instead of private key
        network: walletResult.network,
        currency: walletResult.currency,
        mnemonic: null // Coinbase Cloud handles key management
      })
      .select('id, address, network, currency, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      message: `${walletResult.currency} wallet created successfully via Coinbase Cloud`,
      data: {
        ...savedWallet,
        coinbaseWalletId: walletResult.walletId
      }
    });

  } catch (error: any) {
    console.error('Create wallet error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create wallet'
    });
  }
}));

// Get wallet balance using Coinbase Cloud
router.get('/:id/balance', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    // Get wallet from database
    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .select('address, network, currency, private_key')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !wallet) {
      res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
      return;
    }

    // Get balance using Coinbase Cloud service
    const balance = await coinbaseCloudService.getWalletBalance(wallet.address, wallet.network);

    res.json({
      success: true,
      data: {
        address: wallet.address,
        network: wallet.network,
        currency: wallet.currency,
        balance: balance,
        provider: 'Coinbase Cloud'
      }
    });

  } catch (error: any) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet balance'
    });
  }
}));

// Request faucet funds for testing
router.post('/:id/faucet', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { token = 'eth' } = req.body;

  try {
    // Get wallet from database
    const { data: wallet, error } = await supabaseAdmin
      .from('wallets')
      .select('address, network, currency')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !wallet) {
      res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
      return;
    }

    // Request faucet funds
    const faucetResult = await coinbaseCloudService.requestFaucet(wallet.address, wallet.network, token);

    res.json({
      success: true,
      data: {
        transactionHash: faucetResult.transactionHash,
        explorerUrl: faucetResult.explorerUrl,
        network: wallet.network,
        currency: wallet.currency
      }
    });

  } catch (error: any) {
    console.error('Faucet request error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to request faucet funds'
    });
  }
}));

// Delete wallet
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('wallets')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Wallet deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete wallet'
    });
  }
}));

// Get supported networks from Coinbase Cloud
router.get('/networks', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const networks = await coinbaseCloudService.getSupportedNetworks();
    
    res.json({
      success: true,
      data: networks.map((network: any) => ({
        network: network.network,
        name: network.name,
        currency: network.currency,
        provider: 'Coinbase Cloud'
      }))
    });
  } catch (error: any) {
    console.error('Get networks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported networks'
    });
  }
}));

// Create missing auto-wallets for existing users
router.post('/create-missing', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Get existing wallets for this user
    const { data: existingWallets, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('currency')
      .eq('user_id', userId);

    if (walletError) {
      throw walletError;
    }

    const existingCurrencies = existingWallets.map(w => w.currency);
    const autoCreateNetworks = ['ethereum', 'bitcoin', 'solana', 'tron', 'bsc'];
    const autoCreateCurrencies = ['ETH', 'BTC', 'SOL', 'TRX', 'BNB'];
    
    const missingWallets = [];
    
    for (let i = 0; i < autoCreateNetworks.length; i++) {
      const network = autoCreateNetworks[i];
      const currency = autoCreateCurrencies[i];
      
      if (!existingCurrencies.includes(currency)) {
        try {
          const walletResult = await coinbaseCloudService.createWallet(userId, network);
          
          // Save wallet to database
          const { data: savedWallet, error: saveError } = await supabaseAdmin
            .from('wallets')
            .insert({
              user_id: userId,
              address: walletResult.address,
              private_key: `coinbase_cloud_${walletResult.walletId}`,
              network: walletResult.network,
              currency: walletResult.currency,
              mnemonic: null
            })
            .select('id, address, network, currency, created_at')
            .single();

          if (saveError) {
            throw saveError;
          }

          missingWallets.push(savedWallet);
          console.log(`✅ Created missing ${currency} wallet for user ${userId}`);
        } catch (error: any) {
          console.error(`❌ Failed to create ${currency} wallet:`, error.message);
        }
      }
    }

    res.json({
      success: true,
      message: `Created ${missingWallets.length} missing wallets`,
      data: missingWallets
    });

  } catch (error: any) {
    console.error('Create missing wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create missing wallets'
    });
  }
}));

export default router;