import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../../lib/auth-middleware';
import { getTokenAddress } from '../../../lib/conversion-tokens';

// Execute conversion transaction
export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      const { fromWallet, toToken, amount, quote, slippage } = req.body;

      if (!fromWallet || !toToken || !amount || !quote) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Get wallet details
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('id, address, network, currency, user_id')
        .eq('id', fromWallet)
        .eq('user_id', req.user!.id)
        .single();

      if (walletError || !wallet) {
        return res.status(404).json({ 
          success: false, 
          error: 'Wallet not found' 
        });
      }

      // Map network names to chain IDs
      const chainIds: Record<string, number> = {
        ethereum: 1,
        polygon: 137,
        base: 8453,
        arbitrum: 42161
      };

      const chainId = chainIds[wallet.network.toLowerCase()];
      if (!chainId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported network' 
        });
      }

      // Get token addresses
      const fromTokenAddress = getTokenAddress(wallet.network, wallet.currency);
      const toTokenAddress = getTokenAddress(wallet.network, toToken);
      
      if (!fromTokenAddress || !toTokenAddress) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported token pair' 
        });
      }

      // Get swap transaction data from 1inch
      const oneInchApiKey = process.env.ONEINCH_API_KEY || 'your-api-key';
      const swapUrl = `https://api.1inch.io/v5.2/${chainId}/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${wallet.address}&slippage=${slippage || 0.5}`;
      
      const swapResponse = await fetch(swapUrl, {
        headers: {
          'Authorization': `Bearer ${oneInchApiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!swapResponse.ok) {
        console.error('1inch swap API error:', await swapResponse.text());
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to prepare swap transaction' 
        });
      }

      const swapData = await swapResponse.json();

      // For now, return the transaction data for the user to sign
      // In a full implementation, you'd integrate with wallet providers like WalletConnect
      // or MetaMask to automatically sign and broadcast the transaction
      
      const transactionData = {
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value,
        gasPrice: swapData.tx.gasPrice,
        gasLimit: swapData.tx.gas,
        chainId: chainId
      };

      // Log the conversion attempt
      await supabaseAdmin
        .from('conversions')
        .insert({
          user_id: req.user!.id,
          from_wallet_id: fromWallet,
          from_token: wallet.currency,
          to_token: toToken,
          from_amount: amount,
          to_amount: quote.toAmount,
          network: wallet.network,
          status: 'pending',
          transaction_data: transactionData,
          quote_data: quote
        });

      res.json({ 
        success: true, 
        data: {
          message: 'Transaction prepared. Please sign and broadcast using your wallet.',
          transaction: transactionData,
          instructions: [
            'Copy the transaction data above',
            'Open your wallet (MetaMask, etc.)',
            'Paste the transaction data',
            'Review and confirm the transaction',
            'Wait for confirmation on the blockchain'
          ]
        }
      });

    } catch (error: any) {
      console.error('Conversion error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to execute conversion'
      });
    }
  });
}
