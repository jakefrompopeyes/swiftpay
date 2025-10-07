import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  EyeIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'

interface VendorProfile {
  id: string
  businessName: string
  description: string
  website: string
  logo: string
  isVerified: boolean
}

interface Analytics {
  period: string
  totalTransactions: number
  totalVolumeUSD: number
  totalVolumeCrypto: number
  transactionsByCurrency: Array<{
    currency: string
    _sum: { amount: number; fiatAmount: number }
    _count: number
  }>
  recentTransactions: Array<{
    id: string
    amount: number
    currency: string
    fiatAmount: number
    status: string
    createdAt: string
    fromUser: {
      username: string
      firstName: string
      lastName: string
    }
  }>
}

export default function DemoVendor() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const router = useRouter()

  useEffect(() => {
    // Demo mode - create mock data
    const mockVendorProfile: VendorProfile = {
      id: 'vendor-1',
      businessName: 'Crypto Coffee Co.',
      description: 'Premium coffee shop accepting cryptocurrency payments',
      website: 'https://cryptocoffee.com',
      logo: '/logo-placeholder.png',
      isVerified: true
    }

    const mockAnalytics: Analytics = {
      period: '30d',
      totalTransactions: 127,
      totalVolumeUSD: 15420.50,
      totalVolumeCrypto: 8.4567,
      transactionsByCurrency: [
        { currency: 'ETH', _sum: { amount: 4.2, fiatAmount: 8750.00 }, _count: 45 },
        { currency: 'BTC', _sum: { amount: 0.15, fiatAmount: 4200.00 }, _count: 12 },
        { currency: 'MATIC', _sum: { amount: 1250.0, fiatAmount: 1250.00 }, _count: 38 },
        { currency: 'USDC', _sum: { amount: 1220.5, fiatAmount: 1220.50 }, _count: 32 }
      ],
      recentTransactions: [
        {
          id: 'tx-1',
          amount: 0.05,
          currency: 'ETH',
          fiatAmount: 104.25,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          fromUser: { username: 'coffee_lover', firstName: 'Alice', lastName: 'Johnson' }
        },
        {
          id: 'tx-2',
          amount: 0.01,
          currency: 'BTC',
          fiatAmount: 250.00,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          fromUser: { username: 'crypto_trader', firstName: 'Bob', lastName: 'Smith' }
        },
        {
          id: 'tx-3',
          amount: 50.0,
          currency: 'MATIC',
          fiatAmount: 37.50,
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          fromUser: { username: 'polygon_user', firstName: 'Carol', lastName: 'Davis' }
        },
        {
          id: 'tx-4',
          amount: 25.0,
          currency: 'USDC',
          fiatAmount: 25.00,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          fromUser: { username: 'stable_user', firstName: 'David', lastName: 'Wilson' }
        },
        {
          id: 'tx-5',
          amount: 0.1,
          currency: 'ETH',
          fiatAmount: 208.50,
          status: 'CONFIRMED',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          fromUser: { username: 'eth_enthusiast', firstName: 'Eva', lastName: 'Brown' }
        }
      ]
    }

    setVendorProfile(mockVendorProfile)
    setAnalytics(mockAnalytics)
    setIsLoading(false)
  }, [selectedPeriod])

  const handleLogout = () => {
    router.push('/')
  }

  const handleTryUserMode = () => {
    router.push('/demo')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!vendorProfile || !analytics) {
    return null
  }

  // Prepare chart data
  const chartData = analytics.transactionsByCurrency.map(item => ({
    currency: item.currency,
    volume: item._sum.fiatAmount || 0,
    count: item._count
  }))

  return (
    <>
      <Head>
        <title>Vendor Demo Dashboard - SwiftPay</title>
        <meta name="description" content="SwiftPay Vendor Demo Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                  SwiftPay
                </Link>
                <span className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  VENDOR DEMO
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {vendorProfile.businessName}
                </span>
                <button
                  onClick={handleTryUserMode}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  <PlayCircleIcon className="h-4 w-4 mr-1 inline" />
                  Try User Mode
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Demo Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <PlayCircleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Vendor Demo Mode Active
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You're viewing SwiftPay's vendor dashboard with sample analytics data. 
                    <Link href="/register" className="font-medium underline text-yellow-800 hover:text-yellow-900">
                      Create a vendor account
                    </Link> to start accepting crypto payments for your business.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Period Selector */}
          <div className="mb-6">
            <div className="flex space-x-2">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedPeriod === period
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalTransactions}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Volume (USD)</dt>
                      <dd className="text-lg font-medium text-gray-900">${analytics.totalVolumeUSD.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowUpIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Crypto Volume</dt>
                      <dd className="text-lg font-medium text-gray-900">{analytics.totalVolumeCrypto.toFixed(4)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EyeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg Transaction</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        ${analytics.totalTransactions > 0 ? (analytics.totalVolumeUSD / analytics.totalTransactions).toFixed(2) : '0.00'}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Volume by Currency Chart */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Volume by Currency
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Volume']} />
                    <Bar dataKey="volume" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transaction Count by Currency */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Transaction Count by Currency
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="currency" />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Count']} />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                <Link href="/transactions" className="text-indigo-600 hover:text-indigo-500 text-sm">
                  View all
                </Link>
              </div>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        USD Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.fromUser.firstName} {transaction.fromUser.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.amount} {transaction.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${transaction.fiatAmount?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button className="btn-primary text-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Update Profile
                </button>
                <button className="btn-secondary text-center">
                  <ArrowDownIcon className="h-5 w-5 mr-2" />
                  Create Payment Link
                </button>
                <button className="btn-secondary text-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Analytics
                </button>
                <button className="btn-secondary text-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
