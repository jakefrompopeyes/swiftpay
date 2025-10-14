export type TokenInfo = {
  standard: 'erc20' | 'spl'
  address: string
  decimals: number
  symbol: string
  name?: string
}

// Token registry: per-network supported stablecoins and popular tokens
// Note: Contracts/mints are mainnet addresses.
export const TOKEN_REGISTRY: Record<string, Record<string, TokenInfo>> = {
  ethereum: {
    USDC: { standard: 'erc20', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { standard: 'erc20', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT', name: 'Tether USD' },
    DAI:  { standard: 'erc20', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI',  name: 'Dai Stablecoin' },
    LINK: { standard: 'erc20', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, symbol: 'LINK', name: 'Chainlink' },
    UNI:  { standard: 'erc20', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, symbol: 'UNI',  name: 'Uniswap' }
  },
  base: {
    USDC: { standard: 'erc20', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC', name: 'USD Coin' }
  },
  arbitrum: {
    USDC: { standard: 'erc20', address: '0xaf88d065e77c8CC2239327C5EDb3A432268e5831', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { standard: 'erc20', address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6, symbol: 'USDT', name: 'Tether USD' },
    DAI:  { standard: 'erc20', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18, symbol: 'DAI',  name: 'Dai Stablecoin' },
    LINK: { standard: 'erc20', address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, symbol: 'LINK', name: 'Chainlink' },
    UNI:  { standard: 'erc20', address: '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0', decimals: 18, symbol: 'UNI',  name: 'Uniswap' },
    ARB:  { standard: 'erc20', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, symbol: 'ARB',  name: 'Arbitrum' }
  },
  polygon: {
    USDC: { standard: 'erc20', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, symbol: 'USDC', name: 'USD Coin (PoS)' },
    USDT: { standard: 'erc20', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, symbol: 'USDT', name: 'Tether USD (PoS)' },
    DAI:  { standard: 'erc20', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, symbol: 'DAI',  name: 'Dai Stablecoin (PoS)' }
  },
  binance: {
    // Binance-Peg tokens typically use 18 decimals
    USDC: { standard: 'erc20', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18, symbol: 'USDC', name: 'USD Coin (BEP-20)' },
    USDT: { standard: 'erc20', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, symbol: 'USDT', name: 'Tether USD (BEP-20)' },
    DAI:  { standard: 'erc20', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, symbol: 'DAI',  name: 'Dai Stablecoin (BEP-20)' }
  },
  solana: {
    USDC: { standard: 'spl', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { standard: 'spl', address: 'Es9vMFrzaCERG1bG1Nsx3Rp3XIanFkFJxux1kvZWS9G', decimals: 6, symbol: 'USDT', name: 'Tether USD' }
  }
}

export function getTokenInfo(network: string, symbol: string): TokenInfo | undefined {
  const net = (network || '').toLowerCase()
  const sym = (symbol || '').toUpperCase()
  const byNet = TOKEN_REGISTRY[net]
  if (!byNet) return undefined
  return byNet[sym]
}

export function isTokenSupported(network: string, symbol: string): boolean {
  return !!getTokenInfo(network, symbol)
}

export function toBaseUnits(amount: number, decimals: number): string {
  if (!Number.isFinite(amount) || decimals < 0) return '0'
  const fixed = amount.toFixed(decimals)
  const [ints, decs] = fixed.split('.')
  const joined = `${ints}${decs || ''}`.replace(/^0+/, '')
  return joined === '' ? '0' : joined
}


