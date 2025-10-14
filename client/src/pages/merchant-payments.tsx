import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

export default function MerchantPayments() {
  const [selectedTab, setSelectedTab] = useState('withdraw')
  const [withdrawalMethod, setWithdrawalMethod] = useState('crypto')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [selectedCrypto, setSelectedCrypto] = useState('USDC')

  const [availableBalance, setAvailableBalance] = useState(0)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const withdrawalMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Withdraw to your crypto wallet',
      icon: '₿',
      color: 'orange',
      fees: '0.5%',
      time: '1-2 hours'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      description: 'Transfer to your bank account',
      icon: '🏦',
      color: 'blue',
      fees: '1.5%',
      time: '1-3 business days'
    },
    {
      id: 'card',
      name: 'Debit Card',
      description: 'Load to your debit card',
      icon: '💳',
      color: 'green',
      fees: '2.0%',
      time: 'Instant'
    }
  ]

  const [cryptoOptions, setCryptoOptions] = useState<Array<{symbol:string,name:string,balance:number,icon:string}>>([])

  const recentTransactions = history

  const navigationItems = [
    { id: 'withdraw', name: 'Withdraw Funds', icon: ArrowDownTrayIcon, active: true },
    { id: 'history', name: 'Transaction History', icon: DocumentTextIcon, active: false },
    { id: 'pending', name: 'Pending Payments', icon: ClockIcon, active: false },
    { id: 'settings', name: 'Payment Settings', icon: CogIcon, active: false },
    { id: 'analytics', name: 'Payment Analytics', icon: ChartBarIcon, active: false }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'withdrawal' ? '📤' : '📥'
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('swiftpay_token')
        const r = await fetch('/api/merchant/finances', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const j = await r.json()
        if (j.success) {
          setAvailableBalance(j.data.availableUSD || 0)
          setPendingBalance(j.data.pendingUSD || 0)
          setHistory(j.data.recentTransactions || [])
          // Build crypto options from vendor wallets balances if available later; for now show USDC as default
          setCryptoOptions([{ symbol: 'USDC', name: 'USD Coin', balance: j.data.availableUSD || 0, icon: '🔵' }])
        } else {
          setError(j.error || 'Failed to load data')
        }
      } catch (e) {
        setError('Failed to load data')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <>
      <Head>
        <title>Merchant Payments - {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}</title>
        <meta name="description" content="Manage your merchant payments and withdrawals" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  MERCHANT PAYMENTS
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/merchant-dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Right Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Payment Center
                  </h3>
                  
                  <nav className="space-y-2">
                    {navigationItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedTab(item.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          selectedTab === item.id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </button>
                    ))}
                  </nav>

                  {/* Balance Summary */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Account Balance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Available</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${availableBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending</span>
                        <span className="text-sm font-medium text-gray-900">
                          ${pendingBalance.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          ${(availableBalance + pendingBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Withdraw Funds Tab */}
              {selectedTab === 'withdraw' && (
                <div className="space-y-6">
                  {/* Balance Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Available Balance</dt>
                              <dd className="text-lg font-medium text-gray-900">${availableBalance.toFixed(2)}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ClockIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Pending Balance</dt>
                              <dd className="text-lg font-medium text-gray-900">${pendingBalance.toFixed(2)}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Form */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Withdraw Funds
                      </h3>

                      {/* Withdrawal Method Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Withdrawal Method
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {withdrawalMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() => setWithdrawalMethod(method.id)}
                              className={`p-4 border rounded-lg text-left transition-colors duration-200 ${
                                withdrawalMethod === method.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{method.icon}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                  <p className="text-xs text-gray-500">{method.description}</p>
                                  <div className="mt-1 flex space-x-2">
                                    <span className="text-xs text-gray-500">Fee: {method.fees}</span>
                                    <span className="text-xs text-gray-500">Time: {method.time}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Withdrawal Amount
                        </label>
                        <div className="flex">
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={availableBalance}
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <button
                            onClick={() => setWithdrawalAmount(availableBalance.toString())}
                            className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-700 hover:bg-gray-200"
                          >
                            Max
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Available: ${availableBalance.toFixed(2)}
                        </p>
                      </div>

                      {/* Crypto Selection (if crypto method selected) */}
                      {withdrawalMethod === 'crypto' && (
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Cryptocurrency
                          </label>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {cryptoOptions.map((crypto) => (
                              <button
                                key={crypto.symbol}
                                onClick={() => setSelectedCrypto(crypto.symbol)}
                                className={`p-3 border rounded-lg text-left transition-colors duration-200 ${
                                  selectedCrypto === crypto.symbol
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <span className="text-lg mr-2">{crypto.icon}</span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{crypto.symbol}</p>
                                      <p className="text-xs text-gray-500">{crypto.name}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                      {crypto.balance.toFixed(4)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Withdrawal Summary */}
                      {withdrawalAmount && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Withdrawal Summary</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount</span>
                              <span className="text-gray-900">${parseFloat(withdrawalAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fee</span>
                              <span className="text-gray-900">
                                ${(parseFloat(withdrawalAmount) * 0.005).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-medium border-t pt-1">
                              <span className="text-gray-900">You'll Receive</span>
                              <span className="text-gray-900">
                                ${(parseFloat(withdrawalAmount) - (parseFloat(withdrawalAmount) * 0.005)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Withdraw Button */}
                      <button
                        disabled={!withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                      >
                        Withdraw Funds
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction History Tab */}
              {selectedTab === 'history' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Transaction History
                    </h3>
                    
                    <div className="space-y-3">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-lg">{getTypeIcon(transaction.type)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {transaction.type === 'withdrawal' ? 'Withdrawal' : 'Payment Received'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.method} • {formatDate(transaction.date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount.toFixed(2)}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                Fee: ${transaction.fee.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs placeholder */}
              {selectedTab === 'pending' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Pending Payments
                    </h3>
                    <p className="text-gray-600">No pending payments at this time.</p>
                  </div>
                </div>
              )}

              {selectedTab === 'settings' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Payment Settings
                    </h3>
                    <p className="text-gray-600">Payment settings and preferences will be available here.</p>
                  </div>
                </div>
              )}

              {selectedTab === 'analytics' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Payment Analytics
                    </h3>
                    <p className="text-gray-600">Payment analytics and insights will be available here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
