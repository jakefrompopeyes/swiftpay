import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { cryptoAPI, CryptoPrice } from '../services/cryptoAPI'

export default function TestCryptoAPI() {
  const [cryptoData, setCryptoData] = useState<CryptoPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await cryptoAPI.getTopCryptos(10)
      setCryptoData(data)
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <Head>
        <title>CoinGecko API Test - SwiftPay</title>
        <meta name="description" content="Test CoinGecko API integration" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/demo" className="text-2xl font-bold text-indigo-600">
                  SwiftPay
                </Link>
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  API TEST
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/demo" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">CoinGecko API Test</h1>
            <p className="mt-2 text-gray-600">
              Testing real-time cryptocurrency data integration
            </p>
          </div>

          {/* Controls */}
          <div className="mb-6 bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">API Status</h3>
                <p className="text-sm text-gray-500">
                  {lastUpdate ? `Last updated: ${lastUpdate.toLocaleString()}` : 'No data loaded yet'}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {isLoading ? 'Loading...' : 'Refresh Data'}
                </button>
                <button
                  onClick={() => cryptoAPI.clearCache()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 text-red-400">⚠️</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">API Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-blue-800 font-medium">Loading cryptocurrency data...</span>
              </div>
            </div>
          )}

          {/* Crypto Data Grid */}
          {cryptoData.length > 0 && (
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
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const fallback = document.createElement('div')
                            fallback.className = 'h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center'
                            fallback.innerHTML = cryptoAPI.getCryptoEmoji(crypto.symbol)
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
                              {cryptoAPI.formatPrice(crypto.current_price)}
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
                            {cryptoAPI.formatMarketCap(crypto.market_cap)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">24h Volume</p>
                          <p className="font-medium text-gray-900">
                            {cryptoAPI.formatVolume(crypto.total_volume)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* API Information */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">CoinGecko API</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <span className="text-green-600 font-medium">Pro tier: 10,000 calls/month</span></li>
                  <li>• Real-time prices</li>
                  <li>• High-quality logos</li>
                  <li>• Market data & volume</li>
                  <li>• 24h price changes</li>
                  <li>• <span className="text-green-600">✓ API Key Active</span></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cache Status</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Cache duration: 30 seconds</li>
                  <li>• Cached items: {cryptoAPI.getCacheStats().size}</li>
                  <li>• Cache keys: {cryptoAPI.getCacheStats().keys.length}</li>
                  <li>• Last update: {lastUpdate?.toLocaleString() || 'Never'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
