// Lightweight price utilities for serverless routes
export async function getPrice(symbol: string): Promise<number> {
  const prices: Record<string, number> = {
    BTC: 45000,
    ETH: 2800,
    USDC: 1,
    USDT: 1,
    BNB: 320,
    ADA: 0.45,
    SOL: 95,
    DOT: 7.2,
    LINK: 14.5,
    MATIC: 0.7
  }
  return prices[symbol.toUpperCase()] || 0
}

export async function convertFromFiat(usdAmount: number, symbol: string): Promise<number> {
  const price = await getPrice(symbol)
  if (!price || price <= 0) return usdAmount
  const crypto = usdAmount / price
  // keep sensible precision for on-chain amounts
  return Number(crypto.toFixed(8))
}


