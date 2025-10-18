// Live CoinGecko-backed price utilities with simple in-memory cache
type CacheEntry = { price: number; ts: number }
const CACHE: Record<string, CacheEntry> = {}
const CACHE_TTL_MS = 60_000 // 60s

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XMR: 'monero',
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  BNB: 'binancecoin',
  ADA: 'cardano',
  SOL: 'solana',
  DOT: 'polkadot',
  LINK: 'chainlink',
  UNI: 'uniswap',
  ARB: 'arbitrum',
  // Use the correct CoinGecko ID for MATIC (gas token on Polygon PoS)
  MATIC: 'matic-network',
  // Support POL (new Polygon token) in case we ever need it
  POL: 'polygon-ecosystem-token'
}

async function fetchCoinGeckoPrice(symbol: string): Promise<number> {
  const id = COINGECKO_IDS[symbol.toUpperCase()]
  if (!id) return 0
  const apiKey = process.env.COINGECKO_API_KEY || process.env.NEXT_PUBLIC_COINGECKO_API_KEY
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`
  const headers: Record<string, string> = {}
  if (apiKey) {
    // CoinGecko accepts demo/pro keys via this header
    headers['x-cg-demo-api-key'] = apiKey
    headers['x-cg-api-key'] = apiKey
  }
  const res = await fetch(url, { headers, cache: 'no-store' })
  if (!res.ok) return 0
  const json: any = await res.json()
  const price = json?.[id]?.usd
  return typeof price === 'number' ? price : 0
}

export async function getPrice(symbol: string): Promise<number> {
  const key = symbol.toUpperCase()
  const now = Date.now()
  const cached = CACHE[key]
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.price
  try {
    const price = await fetchCoinGeckoPrice(key)
    if (price > 0) {
      CACHE[key] = { price, ts: now }
      return price
    }
  } catch {}
  // Fallbacks if API fails
  const defaults: Record<string, number> = {
    BTC: 45000,
    ETH: 2800,
    XMR: 150,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    BNB: 320,
    ADA: 0.45,
    SOL: 95,
    DOT: 7.2,
    LINK: 14.5,
    MATIC: 0.7
  }
  return defaults[key] || 0
}

export async function convertFromFiat(usdAmount: number, symbol: string): Promise<number> {
  const price = await getPrice(symbol)
  if (!price || price <= 0) return usdAmount
  const crypto = usdAmount / price
  // keep sensible precision for on-chain amounts
  return Number(crypto.toFixed(8))
}


