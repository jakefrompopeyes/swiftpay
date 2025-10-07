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
import Layout from '../components/Layout'

export default function MerchantDashboard() {
  const [merchantStats, setMerchantStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeCustomers: 0,
    conversionRate: 0
  })

  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: 'tx-001',
      amount: 25.50,
      currency: 'USDC',
      customer: 'john@example.com',
      status: 'completed',
      timestamp: '2024-01-15T10:30:00Z',
      description: 'Coffee Order'
    },
    {
      id: 'tx-002',
      amount: 150.00,
      currency: 'ETH',
      customer: 'sarah@example.com',
      status: 'completed',
      timestamp: '2024-01-15T09:15:00Z',
      description: 'Consulting Service'
    },
    {
      id: 'tx-003',
      amount: 75.25,
      currency: 'BTC',
      customer: 'mike@example.com',
      status: 'pending',
      timestamp: '2024-01-15T08:45:00Z',
      description: 'Product Purchase'
    }
  ])

  const [integrationMethods] = useState([
    {
      name: 'Payment Button',
      description: 'Add crypto payment buttons to your website',
      icon: '🔘',
      status: 'active',
      usage: 'High'
    },
    {
      name: 'Direct Links',
      description: 'Share payment links via email or SMS',
      icon: '🔗',
      status: 'active',
      usage: 'Medium'
    },
    {
      name: 'QR Codes',
      description: 'Generate QR codes for in-person payments',
      icon: '📱',
      status: 'active',
      usage: 'High'
    },
    {
      name: 'API Integration',
      description: 'Integrate payments into your application',
      icon: '⚙️',
      status: 'setup',
      usage: 'Low'
    },
    {
      name: 'Embedded Checkout',
      description: 'Embed full checkout in your website',
      icon: '📦',
      status: 'setup',
      usage: 'Low'
    }
  ])

  useEffect(() => {
    // Simulate loading merchant data
    setMerchantStats({
      totalRevenue: 2847.50,
      totalTransactions: 47,
      activeCustomers: 23,
      conversionRate: 78.5
    })
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

  return (
    <Layout>
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
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, Demo Merchant!</h1>
            <p className="mt-2 text-gray-600">
              Manage your crypto payment integrations and track your business performance
            </p>
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
            <RevenueChart />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Integration Methods */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Integration Methods</h3>
                  <Link href="/merchant-tools" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    Manage →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {integrationMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">{method.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          method.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {method.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{method.usage} usage</p>
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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                  <Link href="/transactions" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    View all →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-medium text-gray-600">
                            {transaction.currency === 'BTC' ? '🟠' : 
                             transaction.currency === 'ETH' ? '🔷' : 
                             transaction.currency === 'USDC' ? '🔵' : '💰'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.customer}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
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
                  ))}
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
        </div>
      </div>
    </Layout>
  )
}
