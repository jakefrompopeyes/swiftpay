import { useState, useEffect } from 'react'
import Head from 'next/head'

interface CryptoData {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  image: string
}

export default function CryptoPrices() {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCryptoPrices()
  }, [])

  const fetchCryptoPrices = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // CoinGecko API - Free tier allows 10-50 calls per minute
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false'
      )

      if (!response.ok) {
        throw new Error('Failed to fetch crypto data')
      }

      const data = await response.json()
      setCryptoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(4)}`
    } else if (price < 100) {
      return `$${price.toFixed(2)}`
    } else {
      return `$${price.toLocaleString()}`
    }
  }

  const formatMarketCap = (marketCap: number) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCryptoPrices}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Live Crypto Prices - SwiftPay</title>
        <meta name="description" content="Real-time cryptocurrency prices" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">SwiftPay</h1>
                <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  LIVE PRICES
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={fetchCryptoPrices}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Live Crypto Prices</h1>
            <p className="mt-2 text-gray-600">
              Real-time cryptocurrency prices powered by CoinGecko API
            </p>
          </div>

          {/* Crypto Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cryptoData.map((crypto) => (
              <div key={crypto.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        src={crypto.image}
                        alt={crypto.name}
                        className="h-10 w-10 rounded-full"
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className = 'h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center'
                          fallback.innerHTML = crypto.symbol === 'btc' ? '🟠' : 
                                             crypto.symbol === 'eth' ? '🔷' : 
                                             crypto.symbol === 'matic' ? '🟣' : '💰'
                          target.parentNode?.insertBefore(fallback, target)
                        }}
                      />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {crypto.name}
                          </p>
                          <p className="text-xs text-gray-500 uppercase">
                            {crypto.symbol}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(crypto.current_price)}
                          </p>
                          <p className={`text-xs ${
                            crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                            {crypto.price_change_percentage_24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500">Market Cap</p>
                        <p className="font-medium text-gray-900">
                          {formatMarketCap(crypto.market_cap)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">24h Volume</p>
                        <p className="font-medium text-gray-900">
                          {formatMarketCap(crypto.total_volume)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* API Info */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-blue-400">ℹ️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Data Source Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    <strong>API:</strong> CoinGecko (Free Tier: 10-50 calls/minute)<br/>
                    <strong>Update Frequency:</strong> Real-time<br/>
                    <strong>Data Includes:</strong> Prices, logos, market cap, volume, 24h changes<br/>
                    <strong>Last Updated:</strong> {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

