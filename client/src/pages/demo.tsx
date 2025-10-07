import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { cryptoAPI, CryptoPrice } from '../services/cryptoAPI'
import RevenueChart from '../components/RevenueChart'
import Layout from '../components/Layout'

export default function Demo() {
  const [user, setUser] = useState({
    id: 'demo-user-1',
    email: 'demo@swiftpay.com',
    username: 'demouser',
    firstName: 'Demo',
    lastName: 'User',
    isVendor: false
  })

  const [cryptoHoldings, setCryptoHoldings] = useState([
    {
      currency: 'ETH',
      symbol: 'Ethereum',
      balance: 2.4567,
      fiatValue: 5120.25,
      change24h: 2.4,
      icon: '🔷',
      image: ''
    },
    {
      currency: 'BTC',
      symbol: 'Bitcoin',
      balance: 0.1234,
      fiatValue: 3085.00,
      change24h: -1.2,
      icon: '🟠',
      image: ''
    },
    {
      currency: 'MATIC',
      symbol: 'Polygon',
      balance: 150.7890,
      fiatValue: 113.09,
      change24h: 5.8,
      icon: '🟣',
      image: ''
    },
    {
      currency: 'USDC',
      symbol: 'USD Coin',
      balance: 500.0000,
      fiatValue: 500.00,
      change24h: 0.0,
      icon: '🔵',
      image: ''
    }
  ])

  const [marketData, setMarketData] = useState<CryptoPrice[]>([])
  const [isLoadingCrypto, setIsLoadingCrypto] = useState(true)

  useEffect(() => {
    // Load real crypto data from CoinGecko
    loadCryptoData()
  }, [])

  const loadCryptoData = async () => {
    try {
      setIsLoadingCrypto(true)
      
      // Get market data for top cryptos
      const marketPrices = await cryptoAPI.getTopCryptos(10)
      setMarketData(marketPrices)

      // Update holdings with real prices
      const updatedHoldings = cryptoHoldings.map(holding => {
        const marketPrice = marketPrices.find(price => 
          price.symbol.toLowerCase() === holding.currency.toLowerCase()
        )
        
        if (marketPrice) {
          return {
            ...holding,
            fiatValue: holding.balance * marketPrice.current_price,
            change24h: marketPrice.price_change_percentage_24h,
            image: marketPrice.image
          }
        }
        return holding
      })
      
      setCryptoHoldings(updatedHoldings)
    } catch (error) {
      console.error('Error loading crypto data:', error)
      // Keep mock data if API fails
    } finally {
      setIsLoadingCrypto(false)
    }
  }

  const [transactions] = useState([
    {
      id: 'tx-1',
      amount: 0.1,
      currency: 'ETH',
      fiatAmount: 208.50,
      status: 'CONFIRMED',
      description: 'Coffee & Pastry - Crypto Coffee Co.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-2',
      amount: 0.05,
      currency: 'BTC',
      fiatAmount: 1250.00,
      status: 'CONFIRMED',
      description: 'Electronics Store Purchase',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-3',
      amount: 25.0,
      currency: 'MATIC',
      fiatAmount: 18.75,
      status: 'PENDING',
      description: 'Gas Fee Payment',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-4',
      amount: 0.2,
      currency: 'ETH',
      fiatAmount: 417.00,
      status: 'CONFIRMED',
      description: 'Freelance Payment Received',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-5',
      amount: 0.01,
      currency: 'BTC',
      fiatAmount: 250.00,
      status: 'CONFIRMED',
      description: 'Charity Donation',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-6',
      amount: 0.15,
      currency: 'ETH',
      fiatAmount: 312.75,
      status: 'CONFIRMED',
      description: 'NFT Marketplace Purchase',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-7',
      amount: 100.0,
      currency: 'USDC',
      fiatAmount: 100.00,
      status: 'CONFIRMED',
      description: 'Stablecoin Transfer',
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-8',
      amount: 0.08,
      currency: 'ETH',
      fiatAmount: 166.80,
      status: 'CONFIRMED',
      description: 'DeFi Yield Reward',
      createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-9',
      amount: 0.03,
      currency: 'ETH',
      fiatAmount: 62.55,
      status: 'CONFIRMED',
      description: 'Gaming Platform Payment',
      createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tx-10',
      amount: 0.12,
      currency: 'ETH',
      fiatAmount: 250.20,
      status: 'CONFIRMED',
      description: 'Subscription Service',
      createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString()
    }
  ])

  const router = useRouter()

  const handleLogout = () => {
    router.push('/')
  }

  const handleTryVendorMode = () => {
    router.push('/demo-vendor')
  }

  // Calculate total USD value of all crypto holdings
  const totalHoldingsUSD = cryptoHoldings.reduce((sum, holding) => sum + holding.fiatValue, 0)
  
  // Get USDC amount specifically
  const usdcHolding = cryptoHoldings.find(holding => holding.currency === 'USDC')
  const usdcValue = usdcHolding ? usdcHolding.balance : 0
  
  // Calculate this week's transactions
  const thisWeekTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.createdAt)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return txDate >= weekAgo
  })

  return (
    <Layout>
      <Head>
        <title>Demo Dashboard - SwiftPay</title>
        <meta name="description" content="SwiftPay Demo Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  DEMO MODE
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.firstName} {user.lastName}
                </span>
                <button
                  onClick={handleTryVendorMode}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  Try Vendor Mode
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Demo Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-yellow-400">🎮</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Demo Mode Active
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You're viewing SwiftPay in demo mode with sample data. 
                    <Link href="/register" className="font-medium underline text-yellow-800 hover:text-yellow-900">
                      Create a real account
                    </Link> to start using SwiftPay with your own crypto wallets.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-gray-400">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Holdings</dt>
                      <dd className="text-lg font-medium text-gray-900">${totalHoldingsUSD.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-gray-400">🔵</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">USD Value</dt>
                      <dd className="text-lg font-medium text-gray-900">{usdcValue.toFixed(2)} USDC</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-gray-400">👛</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Currencies</dt>
                      <dd className="text-lg font-medium text-gray-900">{cryptoHoldings.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-gray-400">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                      <dd className="text-lg font-medium text-gray-900">{transactions.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Market Overview */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Market Overview</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Live prices</span>
                  <button
                    onClick={loadCryptoData}
                    disabled={isLoadingCrypto}
                    className="text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 text-sm font-medium"
                  >
                    {isLoadingCrypto ? '🔄' : '↻'} Refresh
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {isLoadingCrypto ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="p-3 border rounded-lg animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-8"></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  marketData.slice(0, 4).map((crypto) => (
                    <div key={crypto.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img
                            src={crypto.image}
                            alt={crypto.name}
                            className="w-6 h-6 rounded-full mr-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = document.createElement('span')
                              fallback.className = 'text-lg mr-2'
                              fallback.textContent = cryptoAPI.getCryptoEmoji(crypto.symbol)
                              target.parentNode?.insertBefore(fallback, target)
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{crypto.symbol.toUpperCase()}</p>
                            <p className="text-xs text-gray-500">{crypto.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {cryptoAPI.formatPrice(crypto.current_price)}
                          </p>
                          <p className={`text-xs ${crypto.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {crypto.price_change_percentage_24h >= 0 ? '+' : ''}{crypto.price_change_percentage_24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Wallet Holdings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Wallet Holdings</h3>
                  <div className="flex space-x-2">
                    <Link href="/convert-usdc" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Convert to USDC
                    </Link>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Manage Wallet
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {cryptoHoldings.map((holding) => (
                    <div key={holding.currency} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          {holding.image ? (
                            <img
                              src={holding.image}
                              alt={holding.currency}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = document.createElement('span')
                                fallback.className = 'text-lg'
                                fallback.textContent = holding.icon
                                target.parentNode?.insertBefore(fallback, target)
                              }}
                            />
                          ) : (
                            <span className="text-lg">{holding.icon}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {holding.currency} ({holding.symbol})
                          </p>
                          <p className="text-xs text-gray-500">
                            {holding.balance.toFixed(4)} {holding.currency}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${holding.fiatValue.toFixed(2)}
                        </p>
                        <p className={`text-xs ${holding.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {holding.change24h >= 0 ? '+' : ''}{holding.change24h.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">This Week's Transactions</h3>
                    <p className="text-sm text-gray-500">Last 7 days activity ({thisWeekTransactions.length} transactions)</p>
                  </div>
                  <Link href="/transactions" className="text-indigo-600 hover:text-indigo-500 text-sm">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {thisWeekTransactions
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((transaction) => {
                      const txDate = new Date(transaction.createdAt)
                      const now = new Date()
                      const diffInHours = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60))
                      const timeAgo = diffInHours < 24 ? `${diffInHours}h ago` : `${Math.floor(diffInHours / 24)}d ago`
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm">
                                {transaction.currency === 'ETH' ? '🔷' : 
                                 transaction.currency === 'BTC' ? '🟠' : 
                                 transaction.currency === 'MATIC' ? '🟣' : 
                                 transaction.currency === 'USDC' ? '🔵' : '💰'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.amount} {transaction.currency} • {timeAgo}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${transaction.fiatAmount?.toFixed(2)}
                            </p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                              transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-6">
            <RevenueChart />
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/merchant-dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                  <span className="mr-2">🏪</span>
                  Merchant Tools
                </Link>
                <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">
                  <span className="mr-2">📥</span>
                  Receive Payment
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">
                  <span className="mr-2">🔄</span>
                  Swap Tokens
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">
                  <span className="mr-2">⚙️</span>
                  Settings
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                  View all activity
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { type: 'payment', action: 'Sent payment', amount: '0.1 ETH', time: '2h ago', status: 'completed', icon: '💸' },
                  { type: 'deposit', action: 'Received payment', amount: '0.05 BTC', time: '5h ago', status: 'completed', icon: '📥' },
                  { type: 'swap', action: 'Token swap', amount: 'MATIC → ETH', time: '1d ago', status: 'completed', icon: '🔄' },
                  { type: 'alert', action: 'Price alert triggered', amount: 'ETH > $2,000', time: '2d ago', status: 'info', icon: '🔔' },
                  { type: 'security', action: 'Login from new device', amount: 'Mobile app', time: '3d ago', status: 'warning', icon: '🔒' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                        <span className="text-sm">{activity.icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.amount} • {activity.time}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'info' ? 'bg-blue-100 text-blue-800' :
                      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}