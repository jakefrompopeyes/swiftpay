import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ShareIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  WalletIcon
} from '@heroicons/react/24/outline'
import RevenueChart from '../components/RevenueChart'
import { useRouter } from 'next/router'

export default function MerchantDashboard() {
  const router = useRouter()
  const [merchantStats, setMerchantStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeCustomers: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recentTransactions, setRecentTransactions] = useState<any[]>([])

  // Removed mock Integration Methods list

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('swiftpay_token')
        if (!token) {
          setError('Please log in to view merchant data')
          return
        }

        const response = await fetch('/api/merchant/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const result = await response.json()
        if (result.success) {
          setMerchantStats(result.data.stats)
          setRecentTransactions(result.data.recentTransactions)
        } else {
          setError(result.error || 'Failed to load merchant data')
        }
      } catch (err) {
        console.error('Error fetching merchant data:', err)
        setError('Failed to load merchant data')
      } finally {
        setLoading(false)
      }
    }

    fetchMerchantData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCurrencyIcon = (currency: string) => {
    const icons: Record<string, string> = {
      'BTC': '🟠',
      'ETH': '🔷',
      'USDC': '🔵',
      'USDT': '🟢',
      'DAI': '🟡',
      'LINK': '🔵',
      'UNI': '🟣',
      'ARB': '🔵',
      'SOL': '🟣',
      'BNB': '🟡',
      'MATIC': '🟣'
    }
    return icons[currency] || '💰'
  }

  return (
    <>
      <Head>
        <title>Merchant Dashboard - SwiftPay</title>
        <meta name="description" content="Manage your SwiftPay merchant account" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  MERCHANT DASHBOARD
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/demo" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading merchant data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-red-600 font-medium mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Merchant Dashboard</h1>
                <p className="mt-2 text-gray-600">Track revenue and recent payments in real time</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                          <dd className="text-lg font-medium text-gray-900">{formatCurrency(merchantStats.totalRevenue)}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                          <dd className="text-lg font-medium text-gray-900">{merchantStats.totalTransactions}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <UsersIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Customers</dt>
                          <dd className="text-lg font-medium text-gray-900">{merchantStats.activeCustomers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                          <dd className="text-lg font-medium text-gray-900">{merchantStats.conversionRate}%</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="mb-8">
                <RevenueChartWrapper />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Transactions */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                      {/* Removed link to transactions page (deleted) */}
                    </div>
                    
                    <div className="space-y-3">
                      {recentTransactions.length > 0 ? recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-gray-600">
                                {getCurrencyIcon(transaction.currency)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-xs text-gray-500">{transaction.customer}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount)} {transaction.currency}
                            </p>
                            <div className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No transactions yet</p>
                          <Link href="/merchant-tools" className="text-indigo-600 hover:text-indigo-500 text-sm">
                            Create your first payment →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link href="/merchant-tools" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                      <CodeBracketIcon className="h-5 w-5 mr-2" />
                      Integration Tools
                    </Link>
                    
                    <Link href="/checkout-generator" className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                      <ShareIcon className="h-5 w-5 mr-2" />
                      Create Payment Link
                    </Link>
                    
                    <Link href="/merchant-payments" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Access Funds
                    </Link>
                    
                    <Link href="/vendor-wallets" className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                      <WalletIcon className="h-5 w-5 mr-2" />
                      Manage Wallets
                    </Link>
                    
                    <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors duration-200 flex items-center justify-center">
                      <CogIcon className="h-5 w-5 mr-2" />
                      Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Getting Started with SwiftPay
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Choose your integration method from the tools above</li>
                        <li>Generate payment buttons, links, or QR codes</li>
                        <li>Test payments in our sandbox environment</li>
                        <li>Go live and start accepting crypto payments!</li>
                      </ol>
                    </div>
                    <div className="mt-4">
                      <Link href="/merchant-tools" className="text-blue-800 hover:text-blue-900 font-medium">
                        Start integrating →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function RevenueChartWrapper() {
  const [chartData, setChartData] = useState<any | null>(null)
  const [meta, setMeta] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<number>(30)

  const load = async (d: number) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('swiftpay_token')
      if (!token) { setChartData(null); setMeta(null); return }
      const r = await fetch(`/api/merchant/revenue?days=${d}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await r.json()
      if (j.success) { setChartData(j.data); setMeta(j.data?.meta || null) }
      else { setChartData(null); setMeta(null) }
    } catch { setChartData(null); setMeta(null) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load(days)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Revenue</div>
        <div className="space-x-2">
          <a
            href={`/api/merchant/revenue?days=${days}&format=csv`}
            className="px-2 py-1 text-xs rounded-md border bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Export CSV
          </a>
          {[7,14,30,60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2 py-1 text-xs rounded-md border ${days===d ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>
      <RevenueChart data={chartData} />
      {/* Buckets & WoW Summary */}
      {meta && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 rounded-lg bg-indigo-50">
            <div className="text-xs text-indigo-700">Completed</div>
            <div className="text-lg font-semibold text-indigo-900">${meta.summary.totalCompletedUsd.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-50">
            <div className="text-xs text-yellow-700">Pending</div>
            <div className="text-lg font-semibold text-yellow-900">${meta.summary.totalPendingUsd.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50">
            <div className="text-xs text-red-700">Underpaid</div>
            <div className="text-lg font-semibold text-red-900">${meta.summary.totalUnderpaidUsd.toFixed(2)}</div>
          </div>
          <div className={`p-3 rounded-lg ${meta.summary.wow.pct >= 0 ? 'bg-green-50' : 'bg-rose-50'}`}>
            <div className={`text-xs ${meta.summary.wow.pct >= 0 ? 'text-green-700' : 'text-rose-700'}`}>WoW (last 7d vs prev 7d)</div>
            <div className={`text-lg font-semibold ${meta.summary.wow.pct >= 0 ? 'text-green-900' : 'text-rose-900'}`}>
              {meta.summary.wow.pct.toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}