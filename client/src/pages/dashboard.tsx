import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CurrencyDollarIcon, 
  WalletIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  PlusIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  isVendor: boolean
}

interface Wallet {
  id: string
  address: string
  network: string
  currency: string
  balance: number
  isActive: boolean
}

interface Transaction {
  id: string
  amount: number
  currency: string
  fiatAmount: number
  status: string
  description: string
  createdAt: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchDashboardData(token)
  }, [router])

  const fetchDashboardData = async (token: string) => {
    try {
      const [userResponse, walletsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/wallets', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.success) {
          setUser(userData.data.user)
        }
      }

      if (walletsResponse.ok) {
        const walletsData = await walletsResponse.json()
        if (walletsData.success) {
          setWallets(walletsData.data.wallets)
        }
      }

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        if (transactionsData.success) {
          setTransactions(transactionsData.data.transactions.slice(0, 5))
        }
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const totalFiatValue = transactions.reduce((sum, tx) => sum + (tx.fiatAmount || 0), 0)

  return (
    <>
      <Head>
        <title>Dashboard - SwiftPay</title>
        <meta name="description" content="SwiftPay Dashboard" />
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
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user.firstName} {user.lastName}
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
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <WalletIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalBalance.toFixed(4)}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">USD Value</dt>
                      <dd className="text-lg font-medium text-gray-900">${totalFiatValue.toFixed(2)}</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Wallets</dt>
                      <dd className="text-lg font-medium text-gray-900">{wallets.length}</dd>
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
                      <dd className="text-lg font-medium text-gray-900">{transactions.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Wallets */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Wallets</h3>
                  <button className="btn-primary">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Wallet
                  </button>
                </div>
                <div className="space-y-3">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {wallet.currency} ({wallet.network})
                        </p>
                        <p className="text-xs text-gray-500">{wallet.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {wallet.balance.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {wallet.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {wallets.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No wallets found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
                  <Link href="/transactions" className="text-indigo-600 hover:text-indigo-500 text-sm">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.amount} {transaction.currency}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${transaction.fiatAmount?.toFixed(2)}
                        </p>
                        <p className={`text-xs ${
                          transaction.status === 'CONFIRMED' ? 'text-green-600' : 
                          transaction.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No transactions found</p>
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
                <Link href="/send" className="btn-primary text-center">
                  <ArrowUpIcon className="h-5 w-5 mr-2" />
                  Send Payment
                </Link>
                <Link href="/receive" className="btn-secondary text-center">
                  <ArrowDownIcon className="h-5 w-5 mr-2" />
                  Receive Payment
                </Link>
                <Link href="/wallets" className="btn-secondary text-center">
                  <WalletIcon className="h-5 w-5 mr-2" />
                  Manage Wallets
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
