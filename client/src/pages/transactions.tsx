import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  amount: number
  currency: string
  fiatAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED'
  description: string
  createdAt: string
  txHash?: string
  network: string
  fromUser?: {
    username: string
    firstName: string
    lastName: string
  }
  toUser?: {
    username: string
    firstName: string
    lastName: string
  }
  type: 'sent' | 'received'
  gasUsed?: string
  confirmations?: number
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Mock detailed transaction data
    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        amount: 0.1,
        currency: 'ETH',
        fiatAmount: 208.50,
        status: 'CONFIRMED',
        description: 'Payment to Crypto Coffee Co.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        txHash: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        network: 'ethereum',
        toUser: {
          username: 'crypto_coffee',
          firstName: 'Crypto',
          lastName: 'Coffee Co.'
        },
        type: 'sent',
        gasUsed: '21000',
        confirmations: 12
      },
      {
        id: 'tx-2',
        amount: 0.05,
        currency: 'BTC',
        fiatAmount: 1250.00,
        status: 'CONFIRMED',
        description: 'Online purchase - Electronics',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        txHash: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        network: 'bitcoin',
        toUser: {
          username: 'electronics_store',
          firstName: 'Electronics',
          lastName: 'Store'
        },
        type: 'sent',
        gasUsed: '250',
        confirmations: 6
      },
      {
        id: 'tx-3',
        amount: 25.0,
        currency: 'MATIC',
        fiatAmount: 18.75,
        status: 'PENDING',
        description: 'Gas fee payment',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        txHash: '0x8ba1f109551bD432803012645Hac136c',
        network: 'polygon',
        toUser: {
          username: 'gas_provider',
          firstName: 'Gas',
          lastName: 'Provider'
        },
        type: 'sent',
        gasUsed: '50000',
        confirmations: 0
      },
      {
        id: 'tx-4',
        amount: 0.2,
        currency: 'ETH',
        fiatAmount: 417.00,
        status: 'CONFIRMED',
        description: 'Freelance payment received',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        txHash: '0x9c2d35Cc6634C0532925a3b8D4C9db96C4b4d8b7',
        network: 'ethereum',
        fromUser: {
          username: 'client_company',
          firstName: 'Client',
          lastName: 'Company'
        },
        type: 'received',
        gasUsed: '21000',
        confirmations: 24
      },
      {
        id: 'tx-5',
        amount: 0.01,
        currency: 'BTC',
        fiatAmount: 250.00,
        status: 'CONFIRMED',
        description: 'Donation to charity',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        txHash: '1B1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb',
        network: 'bitcoin',
        toUser: {
          username: 'charity_org',
          firstName: 'Charity',
          lastName: 'Organization'
        },
        type: 'sent',
        gasUsed: '200',
        confirmations: 48
      },
      {
        id: 'tx-6',
        amount: 100.0,
        currency: 'USDC',
        fiatAmount: 100.00,
        status: 'FAILED',
        description: 'Payment attempt failed',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        txHash: '0x7c3d35Cc6634C0532925a3b8D4C9db96C4b4d8b8',
        network: 'ethereum',
        toUser: {
          username: 'failed_merchant',
          firstName: 'Failed',
          lastName: 'Merchant'
        },
        type: 'sent',
        gasUsed: '21000',
        confirmations: 0
      },
      {
        id: 'tx-7',
        amount: 0.15,
        currency: 'ETH',
        fiatAmount: 312.75,
        status: 'CONFIRMED',
        description: 'NFT purchase',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        txHash: '0x6d4d35Cc6634C0532925a3b8D4C9db96C4b4d8b9',
        network: 'ethereum',
        toUser: {
          username: 'nft_marketplace',
          firstName: 'NFT',
          lastName: 'Marketplace'
        },
        type: 'sent',
        gasUsed: '45000',
        confirmations: 72
      },
      {
        id: 'tx-8',
        amount: 0.08,
        currency: 'ETH',
        fiatAmount: 166.80,
        status: 'CONFIRMED',
        description: 'DeFi yield farming reward',
        createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        txHash: '0x5e5d35Cc6634C0532925a3b8D4C9db96C4b4d8ba',
        network: 'ethereum',
        fromUser: {
          username: 'defi_protocol',
          firstName: 'DeFi',
          lastName: 'Protocol'
        },
        type: 'received',
        gasUsed: '35000',
        confirmations: 96
      }
    ]

    setTransactions(mockTransactions)
    setFilteredTransactions(mockTransactions)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.fromUser?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.toUser?.firstName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter)
    }

    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(tx => tx.currency === currencyFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'amount':
          comparison = a.fiatAmount - b.fiatAmount
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, typeFilter, currencyFilter, sortBy, sortOrder])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'CANCELLED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      relative: getRelativeTime(date)
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'ethereum':
        return '🔷'
      case 'bitcoin':
        return '🟠'
      case 'polygon':
        return '🟣'
      default:
        return '⭕'
    }
  }

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'ETH':
        return '🔷'
      case 'BTC':
        return '🟠'
      case 'MATIC':
        return '🟣'
      case 'USDC':
        return '🔵'
      case 'USDT':
        return '🟢'
      default:
        return '💰'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Transactions - SwiftPay</title>
        <meta name="description" content="SwiftPay Transaction History" />
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
            <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
            <p className="mt-2 text-gray-600">
              View and manage all your cryptocurrency transactions
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Transactions
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by description, hash, or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                  </select>
                </div>

                {/* Currency Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Currencies</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                    <option value="MATIC">MATIC</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <div className="flex">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="status">Status</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {sortOrder === 'desc' ? (
                        <ArrowDownIcon className="h-4 w-4" />
                      ) : (
                        <ArrowUpIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Transactions ({filteredTransactions.length})
                </h3>
                <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                  <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                  Refresh
                </button>
              </div>

              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Network
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => {
                      const dateInfo = formatDate(transaction.createdAt)
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-lg">
                                    {transaction.type === 'sent' ? '📤' : '📥'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {transaction.description}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transaction.type === 'sent' ? 'To' : 'From'}: {
                                    transaction.type === 'sent' 
                                      ? `${transaction.toUser?.firstName} ${transaction.toUser?.lastName}`
                                      : `${transaction.fromUser?.firstName} ${transaction.fromUser?.lastName}`
                                  }
                                </div>
                                {transaction.txHash && (
                                  <div className="text-xs text-gray-400 font-mono">
                                    {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              <span className="text-lg mr-1">{getCurrencyIcon(transaction.currency)}</span>
                              {transaction.amount} {transaction.currency}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${transaction.fiatAmount.toFixed(2)} USD
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getStatusIcon(transaction.status)}
                              <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </span>
                            </div>
                            {transaction.confirmations !== undefined && transaction.status === 'CONFIRMED' && (
                              <div className="text-xs text-gray-500 mt-1">
                                {transaction.confirmations} confirmations
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-lg mr-2">{getNetworkIcon(transaction.network)}</span>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {transaction.network}
                              </span>
                            </div>
                            {transaction.gasUsed && (
                              <div className="text-xs text-gray-500">
                                Gas: {transaction.gasUsed}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {dateInfo.date}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dateInfo.time}
                            </div>
                            <div className="text-xs text-gray-400">
                              {dateInfo.relative}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedTransaction(transaction)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || currencyFilter !== 'all'
                      ? 'Try adjusting your filters to see more transactions.'
                      : 'You haven\'t made any transactions yet.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedTransaction.id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1 flex items-center">
                        {getStatusIcon(selectedTransaction.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                          {selectedTransaction.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedTransaction.amount} {selectedTransaction.currency}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">USD Value</label>
                      <p className="mt-1 text-sm text-gray-900">
                        ${selectedTransaction.fiatAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.txHash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Hash</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono break-all">{selectedTransaction.txHash}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Network</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.network}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedTransaction.createdAt).date} at {formatDate(selectedTransaction.createdAt).time}
                    </p>
                  </div>

                  {selectedTransaction.gasUsed && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gas Used</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.gasUsed}</p>
                    </div>
                  )}

                  {selectedTransaction.confirmations !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirmations</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.confirmations}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

