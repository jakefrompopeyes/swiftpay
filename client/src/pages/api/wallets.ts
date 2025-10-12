import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware';
import { coinbaseCloudService } from '../../lib/coinbase-cloud';

export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return authenticateToken(req, res, async () => {
      try {
        const { data: wallets, error } = await supabaseAdmin
          .from('wallets')
          .select('id, address, network, currency, balance, is_active, created_at')
          .eq('user_id', req.user!.id)
          .eq('is_active', true);

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch wallets'
          });
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
    });
  }

  if (req.method === 'POST') {
    return authenticateToken(req, res, async () => {
      try {
        const { network = 'ethereum' } = req.body;

        console.log(`Creating ${network} wallet for user ${req.user!.id}`);

        // Create wallet using Coinbase Cloud
        const walletResult = await coinbaseCloudService.createWallet(network);

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

        const { data: wallet, error } = await supabaseAdmin
          .from('wallets')
          .insert(walletData)
          .select('id, address, network, currency, balance, is_active, created_at')
          .single();

        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to save wallet to database'
          });
        }

        console.log(`✅ Created ${network} wallet: ${walletResult.address}`);

        res.json({
          success: true,
          message: `${walletResult.currency} wallet created successfully via Coinbase Cloud`,
          data: {
            ...wallet,
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
    });
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}
