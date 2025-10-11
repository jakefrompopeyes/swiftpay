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
  ArrowPathIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { backendAPI, Transaction } from '../services/backendAPI'
import { toast } from 'react-hot-toast'

// Extended Transaction interface for display purposes
interface ExtendedTransaction extends Transaction {
  fiatAmount: number
  description: string
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
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<ExtendedTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null)
  
  // Send Payment Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sendForm, setSendForm] = useState({
    toAddress: '',
    amount: '',
    currency: 'ETH',
    network: 'ethereum'
  })
  const [isSending, setIsSending] = useState(false)
  const [userWallets, setUserWallets] = useState<any[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const router = useRouter()

  // Fetch user wallets for sending payments
  const fetchUserWallets = async () => {
    try {
      const response = await backendAPI.wallets.getWallets()
      if (response.success) {
        setUserWallets(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error)
    }
  }

  // Handle sending payment
  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }
    
    setIsSending(true)

    try {
      const response = await backendAPI.transactions.createTransaction(
        sendForm.toAddress,
        sendForm.amount,
        sendForm.currency,
        sendForm.network
      )

      if (response.success) {
        toast.success('Payment sent successfully!')
        setIsSendModalOpen(false)
        setShowConfirmation(false)
        setSendForm({ toAddress: '', amount: '', currency: 'ETH', network: 'ethereum' })
        // Refresh transactions
        fetchTransactions()
      } else {
        toast.error('Failed to send payment')
      }
    } catch (error: any) {
      console.error('Send payment error:', error)
      toast.error(error.message || 'Failed to send payment')
    } finally {
      setIsSending(false)
    }
  }

  // Fetch real transactions
  const fetchTransactions = async () => {
    console.log('fetchTransactions called')
    try {
      // Check if user is authenticated by looking for token in localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (!token) {
        console.log('No auth token found, using mock data')
        loadMockTransactions()
        setIsLoading(false)
        return
      }

      const response = await backendAPI.transactions.getTransactions()
      console.log('API response:', response)
      if (response.success) {
        // Convert API transactions to ExtendedTransaction format
        const extendedTransactions: ExtendedTransaction[] = response.data.map(tx => ({
          ...tx,
          fiatAmount: parseFloat(tx.amount) * 2000, // Mock conversion rate
          description: `Transaction ${tx.id}`,
          network: 'ethereum',
          type: 'sent' as const,
          gasUsed: '21000',
          confirmations: 12
        }))
        setTransactions(extendedTransactions)
        setFilteredTransactions(extendedTransactions)
        console.log('Set real transactions')
      } else {
        console.warn('Failed to fetch transactions')
        // Fall back to mock data
        loadMockTransactions()
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      // Fall back to mock data
      loadMockTransactions()
    } finally {
      console.log('Setting isLoading to false')
      setIsLoading(false)
    }
  }

  // Load mock transactions as fallback
  const loadMockTransactions = () => {
    const mockTransactions: ExtendedTransaction[] = [
      {
        id: 'tx-1',
        amount: '0.1',
        currency: 'ETH',
        fiatAmount: 208.50,
        status: 'CONFIRMED',
        description: 'Payment to Crypto Coffee Co.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tx_hash: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
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
        amount: '0.05',
        currency: 'BTC',
        fiatAmount: 2150.00,
        status: 'PENDING',
        description: 'Received from Bob',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        tx_hash: '1B1zP1eP5QGefi2DMPTfTL5SLmv7DivfNb',
        network: 'bitcoin',
        fromUser: {
          username: 'bob_trader',
          firstName: 'Bob',
          lastName: 'Smith'
        },
        type: 'received',
        gasUsed: '250',
        confirmations: 3
      }
    ]

    setTransactions(mockTransactions)
    setFilteredTransactions(mockTransactions)
    setIsLoading(false)
  }

  useEffect(() => {
    console.log('Loading transactions...')
    // Simple approach - just set loading to false immediately
    setIsLoading(false)
    console.log('isLoading set to false')
    
    // Also set some mock transactions
    const mockTransactions: ExtendedTransaction[] = [
      {
        id: 'tx-1',
        amount: '0.1',
        currency: 'ETH',
        fiatAmount: 208.50,
        status: 'CONFIRMED',
        description: 'Payment to Crypto Coffee Co.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tx_hash: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        network: 'ethereum',
        toUser: {
          username: 'crypto_coffee',
          firstName: 'Crypto',
          lastName: 'Coffee Co.'
        },
        type: 'sent',
        gasUsed: '21000',
        confirmations: 12
      }
    ]
    
    setTransactions(mockTransactions)
    setFilteredTransactions(mockTransactions)
  }, [])

  useEffect(() => {
    let filtered = [...transactions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        case 'amount':
          comparison = parseFloat(a.amount) - parseFloat(b.amount)
          break
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
        <title>Transactions - SwiftPay v3</title>
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Transactions
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Search by description, hash, or user..."
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    id="type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    id="currency"
                    value={currencyFilter}
                    onChange={(e) => setCurrencyFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Currencies</option>
                    <option value="ETH">ETH</option>
                    <option value="BTC">BTC</option>
                    <option value="USDC">USDC</option>
                    <option value="MATIC">MATIC</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setIsSendModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Send Payment
                  </button>
                  <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                    <ArrowPathIcon className="h-4 w-4 inline mr-1" />
                    Refresh
                  </button>
                </div>
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
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => {
                      const dateInfo = formatDate(transaction.created_at)
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
                                  {transaction.type === 'sent' ? 'To' : 'From'}: {transaction.type === 'sent' ? transaction.toUser?.firstName : transaction.fromUser?.firstName} {transaction.type === 'sent' ? transaction.toUser?.lastName : transaction.fromUser?.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.amount} {transaction.currency}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${transaction.fiatAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1">{transaction.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>{dateInfo.date}</div>
                            <div>{dateInfo.time}</div>
                            <div className="text-xs text-gray-400">{dateInfo.relative}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                    <p className="text-gray-500">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || currencyFilter !== 'all'
                        ? 'Try adjusting your filters to see more results.'
                        : 'Your transaction history will appear here once you start making payments.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Detail Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTransaction.amount} {selectedTransaction.currency} (${selectedTransaction.fiatAmount.toFixed(2)})
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      <span className="ml-1">{selectedTransaction.status}</span>
                    </span>
                  </div>

                  {selectedTransaction.tx_hash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction Hash</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedTransaction.tx_hash}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedTransaction.created_at).date} at {formatDate(selectedTransaction.created_at).time}
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

        {/* Send Payment Modal */}
        {isSendModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Send Payment</h3>
                  <button
                    onClick={() => {
                      setIsSendModalOpen(false)
                      setShowConfirmation(false)
                      setSendForm({ toAddress: '', amount: '', currency: 'ETH', network: 'ethereum' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSendPayment} className="space-y-4">
                  {!showConfirmation ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Recipient Address</label>
                        <input
                          type="text"
                          value={sendForm.toAddress}
                          onChange={(e) => setSendForm({ ...sendForm, toAddress: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0x..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Amount</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={sendForm.amount}
                            onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.0"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Currency</label>
                          <select
                            value={sendForm.currency}
                            onChange={(e) => {
                              const currency = e.target.value
                              const network = currency === 'BTC' ? 'bitcoin' : 
                                            currency === 'SOL' ? 'solana' : 
                                            currency === 'TRX' ? 'tron' : 
                                            currency === 'BNB' ? 'bsc' : 'ethereum'
                              setSendForm({ ...sendForm, currency, network })
                            }}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="ETH">ETH</option>
                            <option value="BTC">BTC</option>
                            <option value="SOL">SOL</option>
                            <option value="TRX">TRX</option>
                            <option value="BNB">BNB</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSendModalOpen(false)
                            setShowConfirmation(false)
                            setSendForm({ toAddress: '', amount: '', currency: 'ETH', network: 'ethereum' })
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Review Payment
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Confirm Payment
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>Please review your payment details before confirming:</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-md p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Recipient:</span>
                          <span className="text-sm text-gray-900 font-mono">{sendForm.toAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Amount:</span>
                          <span className="text-sm text-gray-900 font-semibold">{sendForm.amount} {sendForm.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-500">Network:</span>
                          <span className="text-sm text-gray-900 capitalize">{sendForm.network}</span>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowConfirmation(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSending}
                          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                        >
                          {isSending ? 'Sending...' : 'Confirm & Send'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}