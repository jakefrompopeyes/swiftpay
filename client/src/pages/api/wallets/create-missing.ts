import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';

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
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch existing wallets'
        });
      }

      // Find missing networks
      const existingCurrencies = new Set(
        existingWallets?.map(w => w.currency) || []
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

      // Create missing wallets
      const walletsToCreate = missingNetworks.map(network => ({
        id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: req.user!.id,
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        private_key: `0x${Math.random().toString(16).substr(2, 64)}`,
        network: network.network,
        currency: network.currency,
        mnemonic: null,
        balance: 0,
        is_active: true,
        created_at: new Date().toISOString()
      }));

      const { data: createdWallets, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert(walletsToCreate)
        .select('id, address, network, currency, created_at');

      if (createError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create missing wallets'
        });
      }

      res.json({
        success: true,
        message: `Created ${createdWallets?.length || 0} missing wallets`,
        data: { 
          created: createdWallets?.length || 0,
          wallets: createdWallets 
        }
      });
    } catch (error: any) {
      console.error('Create missing wallets error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create missing wallets'
      });
    }
  });
}
