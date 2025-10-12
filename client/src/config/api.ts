// API Configuration for SwiftPay
export const API_CONFIG = {
  // SwiftPay Backend API Configuration
  BACKEND: {
    // Use Vercel Functions (same domain as frontend)
    BASE_URL: '',
    ENDPOINTS: {
      AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        VERIFY: '/api/auth/verify'
      },
      USERS: {
        PROFILE: '/api/users/profile'
      },
      WALLETS: {
        LIST: '/api/wallets',
        CREATE: '/api/wallets',
        BALANCE: '/api/wallets/:id/balance',
        DELETE: '/api/wallets/:id'
      },
      TRANSACTIONS: {
        LIST: '/api/transactions',
        CREATE: '/api/transactions',
        DETAIL: '/api/transactions/:id'
      },
      VENDORS: {
        PROFILE: '/api/vendors/profile',
        ANALYTICS: '/api/vendors/analytics'
      },
      PUBLIC: {
        HEALTH: '/api/health',
        PRICES: '/api/prices',
        CRYPTOCURRENCIES: '/api/cryptocurrencies'
      }
    }
  },

  // CoinGecko API Configuration
  COINGECKO: {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    API_KEY: 'CG-4t9T7hqedfTufESUnfqJu4mr',
    PRO_TIER_LIMIT: 10000, // calls per month with API key
    CACHE_DURATION: 30000, // 30 seconds cache (shorter with API key)
    ENDPOINTS: {
      MARKETS: '/coins/markets',
      PRICE: '/simple/price',
      COINS_LIST: '/coins/list',
      COIN_DETAIL: '/coins/{id}',
      TRENDING: '/search/trending',
      GLOBAL: '/global'
    }
  },

  // Alternative APIs (for fallback)
  ALTERNATIVES: {
    COINCAP: {
      BASE_URL: 'https://api.coincap.io/v2',
      ENDPOINTS: {
        ASSETS: '/assets',
        RATES: '/rates'
      }
    },
    CRYPTOCOMPARE: {
      BASE_URL: 'https://min-api.cryptocompare.com/data',
      ENDPOINTS: {
        PRICE_MULTI: '/pricemulti',
        PRICE_SINGLE: '/price'
      }
    }
  },

  // Request Configuration
  REQUEST_CONFIG: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 second
  }
}

// Supported Cryptocurrencies
export const SUPPORTED_CRYPTOS = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', emoji: '🟠' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', emoji: '🔷' },
  { id: 'matic-network', symbol: 'matic', name: 'Polygon', emoji: '🟣' },
  { id: 'usd-coin', symbol: 'usdc', name: 'USD Coin', emoji: '🔵' },
  { id: 'tether', symbol: 'usdt', name: 'Tether', emoji: '🟢' },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', emoji: '🟡' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', emoji: '🔵' },
  { id: 'solana', symbol: 'sol', name: 'Solana', emoji: '🟣' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', emoji: '🔴' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', emoji: '🔵' }
]

// Error Messages
export const ERROR_MESSAGES = {
  API_UNAVAILABLE: 'Crypto data service is temporarily unavailable',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  INVALID_DATA: 'Invalid data received from API',
  TIMEOUT: 'Request timed out. Please try again.'
}

// Cache Keys
export const CACHE_KEYS = {
  TOP_CRYPTOS: 'top-cryptos',
  CRYPTO_PRICE: 'crypto-price',
  MARKET_DATA: 'market-data',
  CRYPTO_LOGOS: 'crypto-logos'
}
