import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware';

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

        // Create a mock wallet with proper schema
        const currencyMap: { [key: string]: string } = {
          'ethereum': 'ETH',
          'bitcoin': 'BTC',
          'polygon': 'MATIC',
          'solana': 'SOL',
          'base': 'ETH'
        };

        const mockWallet = {
          id: `wallet_${Date.now()}`,
          user_id: req.user!.id,
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          private_key: `0x${Math.random().toString(16).substr(2, 64)}`,
          network,
          currency: currencyMap[network] || 'ETH',
          mnemonic: null,
          balance: 0,
          is_active: true,
          created_at: new Date().toISOString()
        };

        const { data: wallet, error } = await supabaseAdmin
          .from('wallets')
          .insert(mockWallet)
          .select('id, address, network, currency, balance, is_active, created_at')
          .single();

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create wallet'
          });
        }

        res.json({
          success: true,
          message: 'Wallet created successfully',
          data: wallet
        });
      } catch (error: any) {
        console.error('Create wallet error:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create wallet'
        });
      }
    });
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}
