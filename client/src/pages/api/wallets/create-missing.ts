import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';
import { coinbaseCloudService } from '../../../lib/coinbase-cloud';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      // Define supported networks and their currencies
      const supportedNetworks = [
        { network: 'bitcoin', currency: 'BTC' },
        { network: 'ethereum', currency: 'ETH' },
        { network: 'solana', currency: 'SOL' },
        { network: 'tron', currency: 'TRX' },
        { network: 'binance', currency: 'BNB' }
      ];

      // Get existing wallets for the user
      const { data: existingWallets, error: fetchError } = await supabaseAdmin
        .from('wallets')
        .select('network, currency')
        .eq('user_id', req.user!.id)
        .eq('is_active', true);

      if (fetchError) {
        console.error('Fetch existing wallets error:', fetchError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch existing wallets',
          details: fetchError.message
        });
      }

      // Find missing networks (only for networks that produce real CDP wallets)
      const existingCurrencies = new Set(
        (existingWallets || [])
          .filter(w => ['ETH', 'SOL', 'BNB'].includes(w.currency))
          .map(w => w.currency)
      );
      
      const missingNetworks = supportedNetworks.filter(
        net => !existingCurrencies.has(net.currency)
      );

      if (missingNetworks.length === 0) {
        return res.json({
          success: true,
          message: 'All wallets already exist',
          data: { created: 0 }
        });
      }

      // Create missing wallets using Coinbase Cloud
      const walletsToCreate = [];
      
      for (const network of missingNetworks) {
        try {
          console.log(`Creating ${network.currency} wallet for user ${req.user!.id}`);
          
          // Create wallet using Coinbase Cloud
          const walletResult = await coinbaseCloudService.createWallet(network.network);
          
          // Prepare wallet data for database
          const walletData = {
            // Let Supabase generate the UUID automatically
            user_id: req.user!.id,
            address: walletResult.address,
            private_key: `coinbase_cloud_${walletResult.walletId}`, // Store Coinbase Cloud wallet ID
            network: walletResult.network,
            currency: walletResult.currency,
            mnemonic: null, // Coinbase Cloud handles key management
            balance: 0, // Will be updated with real balance later
            is_active: true,
            created_at: new Date().toISOString()
          };
          
          walletsToCreate.push(walletData);
          console.log(`✅ Created ${network.currency} wallet: ${walletResult.address}`);
          
        } catch (error: any) {
          console.error(`❌ Failed to create ${network.currency} wallet:`, error);
          // Continue with other wallets even if one fails
        }
      }

      if (walletsToCreate.length === 0) {
        return res.json({
          success: true,
          message: 'No wallets could be created',
          data: { created: 0, wallets: [] }
        });
      }

      const { data: createdWallets, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert(walletsToCreate)
        .select('id, address, network, currency, created_at');

      if (createError) {
        console.error('Create wallets error:', createError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create missing wallets',
          details: createError.message
        });
      }

      res.json({
        success: true,
        message: `Created ${createdWallets?.length || 0} missing wallets using Coinbase Cloud`,
        data: { 
          created: createdWallets?.length || 0,
          wallets: createdWallets 
        }
      });
    } catch (error: any) {
      console.error('Create missing wallets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create missing wallets',
        details: error.message || 'Unknown error'
      });
    }
  });
}
