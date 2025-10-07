// Crypto API Service - CoinGecko Integration
import { API_CONFIG, SUPPORTED_CRYPTOS, ERROR_MESSAGES, CACHE_KEYS } from '../config/api'

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
  last_updated: string
}

export interface CryptoLogo {
  id: string
  symbol: string
  name: string
  image: string
}

class CryptoAPIService {
  private baseURL = API_CONFIG.COINGECKO.BASE_URL
  private apiKey = API_CONFIG.COINGECKO.API_KEY
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = API_CONFIG.COINGECKO.CACHE_DURATION

  // Get top cryptocurrencies with prices
  async getTopCryptos(limit: number = 20): Promise<CryptoPrice[]> {
    const cacheKey = `${CACHE_KEYS.TOP_CRYPTOS}-${limit}`
    const cached = this.getCachedData(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const url = `${this.baseURL}${API_CONFIG.COINGECKO.ENDPOINTS.MARKETS}?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&x_cg_demo_api_key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(ERROR_MESSAGES.RATE_LIMIT)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching crypto prices:', error)
      throw error
    }
  }

  // Get specific cryptocurrency price
  async getCryptoPrice(coinId: string): Promise<CryptoPrice | null> {
    const cacheKey = `crypto-price-${coinId}`
    const cached = this.getCachedData(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const url = `${this.baseURL}${API_CONFIG.COINGECKO.ENDPOINTS.MARKETS}?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&x_cg_demo_api_key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const result = data.length > 0 ? data[0] : null
      this.setCachedData(cacheKey, result)
      return result
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error)
      return null
    }
  }

  // Get multiple cryptocurrency prices
  async getMultipleCryptoPrices(coinIds: string[]): Promise<CryptoPrice[]> {
    const cacheKey = `multiple-crypto-prices-${coinIds.join(',')}`
    const cached = this.getCachedData(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const url = `${this.baseURL}${API_CONFIG.COINGECKO.ENDPOINTS.MARKETS}?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&x_cg_demo_api_key=${this.apiKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-cg-demo-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching multiple crypto prices:', error)
      return []
    }
  }

  // Get crypto logos
  async getCryptoLogos(): Promise<CryptoLogo[]> {
    const cacheKey = 'crypto-logos'
    const cached = this.getCachedData(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      const response = await fetch(
        `${this.baseURL}/coins/list?include_platform=false`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this.setCachedData(cacheKey, data)
      return data
    } catch (error) {
      console.error('Error fetching crypto logos:', error)
      return []
    }
  }

  // Get crypto logo URL
  getCryptoLogoUrl(coinId: string, size: 'small' | 'large' = 'large'): string {
    const sizeMap = {
      small: 'thumb',
      large: 'large'
    }
    return `https://assets.coingecko.com/coins/images/${coinId}/${sizeMap[size]}/${coinId}.png`
  }

  // Get fallback emoji for crypto
  getCryptoEmoji(symbol: string): string {
    const crypto = SUPPORTED_CRYPTOS.find(c => c.symbol.toLowerCase() === symbol.toLowerCase())
    return crypto?.emoji || '💰'
  }

  // Format price for display
  formatPrice(price: number): string {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`
    } else if (price < 1) {
      return `$${price.toFixed(4)}`
    } else if (price < 100) {
      return `$${price.toFixed(2)}`
    } else {
      return `$${price.toLocaleString()}`
    }
  }

  // Format market cap
  formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`
    } else {
      return `$${marketCap.toLocaleString()}`
    }
  }

  // Format volume
  formatVolume(volume: number): string {
    return this.formatMarketCap(volume)
  }

  // Cache management
  private getCachedData(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const cryptoAPI = new CryptoAPIService()
