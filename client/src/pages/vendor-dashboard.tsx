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
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import { backendAPI } from '../services/backendAPI'

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

export default function VendorDashboard() {
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('swiftpay_token')
    const userData = localStorage.getItem('swiftpay_user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userData)
    // For now, let's allow all users to access vendor dashboard
    // Later we can check if user.isVendor is true
    
    fetchVendorData()
  }, [router, selectedPeriod])

  const fetchVendorData = async () => {
    try {
      setIsLoading(true)
      
      // Try to get vendor profile and analytics
      try {
        const [profileResponse, analyticsResponse] = await Promise.all([
          backendAPI.vendors.getProfile(),
          backendAPI.vendors.getAnalytics()
        ])
        
        setVendorProfile(profileResponse.data)
        setAnalytics(analyticsResponse.data)
      } catch (error) {
        // If vendor profile doesn't exist, show empty state
        console.log('No vendor profile found, showing empty state')
        setVendorProfile(null)
        setAnalytics(null)
      }
      
    } catch (error) {
      console.error('Error fetching vendor data:', error)
      toast.error('Failed to load vendor data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('swiftpay_token')
    localStorage.removeItem('swiftpay_user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!vendorProfile) {
    return (
      <>
        <Head>
          <title>Vendor Dashboard - SwiftPay</title>
          <meta name="description" content="SwiftPay Vendor Dashboard" />
        </Head>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 mb-4">
              <span className="text-2xl">🏪</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to SwiftSpace!
            </h2>
            <p className="text-gray-600 mb-6">
              Start by creating a payment integration to start accepting crypto payments.
            </p>
            <Link
              href="/merchant-tools"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Set Up Payment Integration
            </Link>
          </div>
        </div>
      </>
    )
  }

  // Prepare chart data
  const chartData = analytics?.transactionsByCurrency?.map(item => ({
    currency: item.currency,
    volume: item._sum.fiatAmount || 0,
    count: item._count
  })) || []

  return (
    <>
      <Head>
        <title>Vendor Dashboard - SwiftPay</title>
        <meta name="description" content="SwiftPay Vendor Dashboard" />
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
                <span className="ml-4 text-sm text-gray-500">Vendor Portal</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  {vendorProfile.businessName}
                </span>
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
                      <dd className="text-lg font-medium text-gray-900">{analytics?.totalTransactions || 0}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">${(analytics?.totalVolumeUSD || 0).toFixed(2)}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{(analytics?.totalVolumeCrypto || 0).toFixed(4)}</dd>
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
                        ${(analytics?.totalTransactions || 0) > 0 ? ((analytics?.totalVolumeUSD || 0) / (analytics?.totalTransactions || 1)).toFixed(2) : '0.00'}
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
                    {(analytics?.recentTransactions || []).map((transaction) => (
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
                <Link href="/vendor/profile" className="btn-primary text-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Update Profile
                </Link>
                <Link href="/payment-link" className="btn-secondary text-center">
                  <ArrowDownIcon className="h-5 w-5 mr-2" />
                  Create Payment Link
                </Link>
                <Link href="/analytics" className="btn-secondary text-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  View Analytics
                </Link>
                <Link href="/settings" className="btn-secondary text-center">
                  <CogIcon className="h-5 w-5 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
