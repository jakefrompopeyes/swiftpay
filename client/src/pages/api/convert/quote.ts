import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-server';
import { authenticateToken, AuthRequest } from '../../lib/auth-middleware';
import { getTokenAddress } from '../../lib/conversion-tokens';

// Get conversion quote from DEX aggregator (1inch)
export default function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  return authenticateToken(req, res, async () => {
    try {
      const { fromToken, toToken, amount, network, slippage } = req.body;

      if (!fromToken || !toToken || !amount || !network) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields' 
        });
      }

      // Map network names to chain IDs
      const chainIds: Record<string, number> = {
        ethereum: 1,
        polygon: 137,
        base: 8453,
        arbitrum: 42161
      };

      const chainId = chainIds[network.toLowerCase()];
      if (!chainId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported network' 
        });
      }

      // Get token addresses
      const fromTokenAddress = getTokenAddress(network, fromToken);
      const toTokenAddress = getTokenAddress(network, toToken);
      
      if (!fromTokenAddress || !toTokenAddress) {
        return res.status(400).json({ 
          success: false, 
          error: 'Unsupported token pair' 
        });
      }

      // Get quote from 1inch API
      const oneInchApiKey = process.env.ONEINCH_API_KEY || 'your-api-key';
      const quoteUrl = `https://api.1inch.io/v5.2/${chainId}/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&slippage=${slippage || 0.5}`;
      
      const quoteResponse = await fetch(quoteUrl, {
        headers: {
          'Authorization': `Bearer ${oneInchApiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!quoteResponse.ok) {
        console.error('1inch API error:', await quoteResponse.text());
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to get quote from DEX' 
        });
      }

      const quoteData = await quoteResponse.json();

      // Calculate price impact
      const priceImpact = quoteData.priceImpact ? parseFloat(quoteData.priceImpact) * 100 : 0;

      const quote = {
        fromAmount: amount,
        toAmount: quoteData.toAmount,
        fromToken,
        toToken,
        priceImpact,
        minimumReceived: quoteData.minimumReceived || quoteData.toAmount,
        gasEstimate: quoteData.estimatedGas || '0',
        route: quoteData.protocols || []
      };

      res.json({ success: true, data: quote });

    } catch (error: any) {
      console.error('Quote error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get conversion quote'
      });
    }
  });
}
