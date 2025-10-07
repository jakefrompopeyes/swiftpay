import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface TransactionStats {
  totalTransactions: number
  totalVolumeUSD: number
  totalVolumeCrypto: number
  averageTransaction: number
  successRate: number
  topCurrency: string
  recentActivity: number
}

export default function TransactionStats() {
  const [stats, setStats] = useState<TransactionStats>({
    totalTransactions: 0,
    totalVolumeUSD: 0,
    totalVolumeCrypto: 0,
    averageTransaction: 0,
    successRate: 0,
    topCurrency: '',
    recentActivity: 0
  })

  useEffect(() => {
    // Mock stats calculation
    const mockStats: TransactionStats = {
      totalTransactions: 127,
      totalVolumeUSD: 15420.50,
      totalVolumeCrypto: 8.4567,
      averageTransaction: 121.42,
      successRate: 94.5,
      topCurrency: 'ETH',
      recentActivity: 23
    }
    setStats(mockStats)
  }, [])

  return (
    <>
      <Head>
        <title>Transaction Statistics - SwiftPay</title>
        <meta name="description" content="SwiftPay Transaction Statistics" />
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
                <span className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  DEMO MODE
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/transactions" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  All Transactions
                </Link>
                <Link href="/demo" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Transaction Statistics</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive analytics and insights about your transaction activity
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-indigo-600">📊</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalTransactions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-green-600">💰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Volume (USD)</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.totalVolumeUSD.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-blue-600">📈</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Average Transaction</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.averageTransaction.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 text-green-600">✅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.successRate}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
            {/* Transaction Volume Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Transaction Volume by Currency
                </h3>
                <div className="space-y-4">
                  {[
                    { currency: 'ETH', amount: 4.2, usdValue: 8750.00, percentage: 56.7 },
                    { currency: 'BTC', amount: 0.15, usdValue: 3750.00, percentage: 24.3 },
                    { currency: 'MATIC', amount: 1250.0, usdValue: 1875.00, percentage: 12.2 },
                    { currency: 'USDC', amount: 1045.5, usdValue: 1045.50, percentage: 6.8 }
                  ].map((item) => (
                    <div key={item.currency} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm">
                            {item.currency === 'ETH' ? '🔷' : 
                             item.currency === 'BTC' ? '🟠' : 
                             item.currency === 'MATIC' ? '🟣' : '🔵'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.currency}</p>
                          <p className="text-xs text-gray-500">{item.amount} {item.currency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${item.usdValue.toFixed(2)}</p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transaction Status Breakdown */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Transaction Status Breakdown
                </h3>
                <div className="space-y-4">
                  {[
                    { status: 'CONFIRMED', count: 120, percentage: 94.5, color: 'bg-green-500' },
                    { status: 'PENDING', count: 5, percentage: 3.9, color: 'bg-yellow-500' },
                    { status: 'FAILED', count: 2, percentage: 1.6, color: 'bg-red-500' }
                  ].map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                        <span className="text-sm font-medium text-gray-900">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{item.count}</p>
                        <p className="text-xs text-gray-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
                <Link href="/transactions" className="text-indigo-600 hover:text-indigo-500 text-sm">
                  View all transactions
                </Link>
              </div>
              
              <div className="space-y-3">
                {[
                  { time: '2 hours ago', action: 'Sent 0.1 ETH', amount: '$208.50', status: 'confirmed' },
                  { time: '5 hours ago', action: 'Received 0.05 BTC', amount: '$1,250.00', status: 'confirmed' },
                  { time: '1 day ago', action: 'Sent 25 MATIC', amount: '$18.75', status: 'pending' },
                  { time: '2 days ago', action: 'Received 0.2 ETH', amount: '$417.00', status: 'confirmed' },
                  { time: '3 days ago', action: 'Sent 0.01 BTC', amount: '$250.00', status: 'confirmed' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm">
                          {activity.action.includes('Sent') ? '📤' : '📥'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{activity.amount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/transactions" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors duration-200">
                  View All Transactions
                </Link>
                <Link href="/payment-demo" className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md text-center transition-colors duration-200">
                  Make Payment
                </Link>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors duration-200">
                  Export Data
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors duration-200">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

