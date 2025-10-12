import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const cryptocurrencies = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', network: 'bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', network: 'ethereum' },
    { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', network: 'ethereum' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', network: 'ethereum' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', network: 'bsc' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', network: 'cardano' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', network: 'solana' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', network: 'polkadot' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', network: 'ethereum' }
  ];

  res.json({
    success: true,
    data: cryptocurrencies
  });
}
