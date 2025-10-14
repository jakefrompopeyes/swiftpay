// Token registry for DEX conversions
// Maps token symbols to contract addresses on different networks

export interface TokenInfo {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}

export const TOKEN_REGISTRY: Record<string, Record<string, TokenInfo>> = {
  ethereum: {
    ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18, symbol: 'ETH', name: 'Ethereum' },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT', name: 'Tether' },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin' },
    LINK: { address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, symbol: 'LINK', name: 'Chainlink' },
    UNI: { address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, symbol: 'UNI', name: 'Uniswap' },
    ARB: { address: '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1', decimals: 18, symbol: 'ARB', name: 'Arbitrum' }
  },
  polygon: {
    MATIC: { address: '0x0000000000000000000000000000000000000000', decimals: 18, symbol: 'MATIC', name: 'Polygon' },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, symbol: 'USDT', name: 'Tether' },
    DAI: { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin' },
    LINK: { address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', decimals: 18, symbol: 'LINK', name: 'Chainlink' },
    UNI: { address: '0xb33EaAf8d1C4c4c4c4c4c4c4c4c4c4c4c4c4c4c4', decimals: 18, symbol: 'UNI', name: 'Uniswap' }
  },
  base: {
    ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18, symbol: 'ETH', name: 'Ethereum' },
    USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 6, symbol: 'USDT', name: 'Tether' },
    DAI: { address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin' }
  },
  arbitrum: {
    ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18, symbol: 'ETH', name: 'Ethereum' },
    USDC: { address: '0xaf88d065e77c8CC2239327C5EDb3A432268e5831', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
    USDT: { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6, symbol: 'USDT', name: 'Tether' },
    DAI: { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18, symbol: 'DAI', name: 'Dai Stablecoin' },
    LINK: { address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4', decimals: 18, symbol: 'LINK', name: 'Chainlink' },
    UNI: { address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0', decimals: 18, symbol: 'UNI', name: 'Uniswap' },
    ARB: { address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, symbol: 'ARB', name: 'Arbitrum' }
  }
};

export function getTokenAddress(network: string, symbol: string): string | null {
  const networkTokens = TOKEN_REGISTRY[network.toLowerCase()];
  if (!networkTokens) return null;
  
  const token = networkTokens[symbol.toUpperCase()];
  return token ? token.address : null;
}

export function getTokenInfo(network: string, symbol: string): TokenInfo | null {
  const networkTokens = TOKEN_REGISTRY[network.toLowerCase()];
  if (!networkTokens) return null;
  
  return networkTokens[symbol.toUpperCase()] || null;
}

export function getSupportedTokens(network: string): string[] {
  const networkTokens = TOKEN_REGISTRY[network.toLowerCase()];
  if (!networkTokens) return [];
  
  return Object.keys(networkTokens);
}

export function getSupportedNetworks(): string[] {
  return Object.keys(TOKEN_REGISTRY);
}
