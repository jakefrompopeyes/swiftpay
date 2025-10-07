import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  WalletIcon,
  KeyIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'

export default function VendorWallets() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [walletType, setWalletType] = useState<'individual' | 'centralized'>('centralized')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const centralizedBalance = {
    totalUSD: 2847.50,
    holdings: [
      { currency: 'USDC', balance: 1500.00, usdValue: 1500.00, icon: '🔵' },
      { currency: 'ETH', balance: 0.75, usdValue: 1347.50, icon: '🔷' },
      { currency: 'BTC', balance: 0.025, usdValue: 0.00, icon: '🟠' }
    ]
  }

  const individualWallets = [
    {
      id: 'wallet-1',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      network: 'Ethereum',
      currency: 'ETH',
      balance: 0.4567,
      usdValue: 1023.45,
      isActive: true,
      createdAt: '2024-01-10T10:30:00Z',
      privateKey: '0x1234567890abcdef...' // Never show in real app
    },
    {
      id: 'wallet-2',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      network: 'Bitcoin',
      currency: 'BTC',
      balance: 0.0123,
      usdValue: 456.78,
      isActive: true,
      createdAt: '2024-01-12T14:20:00Z',
      privateKey: '0xabcdef1234567890...'
    }
  ]

  const navigationItems = [
    { id: 'overview', name: 'Wallet Overview', icon: WalletIcon, active: true },
    { id: 'individual', name: 'Individual Wallets', icon: KeyIcon, active: false },
    { id: 'centralized', name: 'Centralized Balance', icon: CurrencyDollarIcon, active: false },
    { id: 'settings', name: 'Wallet Settings', icon: CogIcon, active: false },
    { id: 'analytics', name: 'Wallet Analytics', icon: ChartBarIcon, active: false }
  ]

  const handleCreateWallet = async () => {
    setIsCreatingWallet(true)
    // Simulate wallet creation
    setTimeout(() => {
      setIsCreatingWallet(false)
      // Add new wallet to list
    }, 2000)
  }

  const handleMigrateToIndividual = () => {
    // Show migration confirmation
    console.log('Migrate to individual wallets')
  }

  const handleMigrateToCentralized = () => {
    // Show migration confirmation
    console.log('Migrate to centralized balance')
  }

  return (
    <Layout>
      <Head>
        <title>Vendor Wallets - SwiftPay</title>
        <meta name="description" content="Manage your vendor wallet settings and crypto holdings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  VENDOR WALLETS
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
                    Wallet Management
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

                  {/* Wallet Type Toggle */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Wallet Type</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setWalletType('centralized')}
                        className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                          walletType === 'centralized'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Centralized</p>
                            <p className="text-xs text-gray-500">Easy, instant, managed</p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setWalletType('individual')}
                        className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                          walletType === 'individual'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <KeyIcon className="h-5 w-5 mr-2 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Individual</p>
                            <p className="text-xs text-gray-500">Self-custody, decentralized</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Wallet Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Wallet Type Comparison */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Choose Your Wallet Type
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Centralized Wallet */}
                        <div className={`p-6 border-2 rounded-lg transition-colors duration-200 ${
                          walletType === 'centralized' 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center mb-4">
                            <CurrencyDollarIcon className="h-8 w-8 text-indigo-600 mr-3" />
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Centralized Balance</h4>
                              <p className="text-sm text-gray-500">SwiftPay managed wallet</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              Instant settlements
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              No gas fees
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              Easy to use
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                              Platform custody
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              ${centralizedBalance.totalUSD.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">Total Balance</p>
                          </div>
                        </div>

                        {/* Individual Wallets */}
                        <div className={`p-6 border-2 rounded-lg transition-colors duration-200 ${
                          walletType === 'individual' 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-center mb-4">
                            <KeyIcon className="h-8 w-8 text-indigo-600 mr-3" />
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Individual Wallets</h4>
                              <p className="text-sm text-gray-500">Self-custody wallets</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              Full control
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                              Decentralized
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                              Gas fees apply
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                              Key management
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900 mb-1">
                              {individualWallets.length}
                            </p>
                            <p className="text-sm text-gray-500">Active Wallets</p>
                          </div>
                        </div>
                      </div>

                      {/* Migration Options */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Migration Options</h4>
                        <div className="flex space-x-4">
                          <button
                            onClick={handleMigrateToIndividual}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            Switch to Individual Wallets
                          </button>
                          <button
                            onClick={handleMigrateToCentralized}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                          >
                            Switch to Centralized
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual Wallets Tab */}
              {selectedTab === 'individual' && (
                <div className="space-y-6">
                  {/* Create New Wallet */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Individual Wallets
                        </h3>
                        <button
                          onClick={handleCreateWallet}
                          disabled={isCreatingWallet}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {isCreatingWallet ? 'Creating...' : 'Create Wallet'}
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-6">
                        Manage your self-custody crypto wallets. You control the private keys and have full ownership of your funds.
                      </p>

                      {/* Wallet List */}
                      <div className="space-y-4">
                        {individualWallets.map((wallet) => (
                          <div key={wallet.id} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                                  <span className="text-xl">
                                    {wallet.currency === 'ETH' ? '🔷' : '🟠'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {wallet.network} Wallet
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Created {new Date(wallet.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {wallet.balance.toFixed(4)} {wallet.currency}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ${wallet.usdValue.toFixed(2)}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    wallet.isActive 
                                      ? 'text-green-600 bg-green-100' 
                                      : 'text-gray-600 bg-gray-100'
                                  }`}>
                                    {wallet.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Private Key (Hidden by default) */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Private Key:</span>
                                <button
                                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                                  className="flex items-center text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                  {showPrivateKey ? (
                                    <>
                                      <EyeSlashIcon className="h-3 w-3 mr-1" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <EyeIcon className="h-3 w-3 mr-1" />
                                      Show
                                    </>
                                  )}
                                </button>
                              </div>
                              {showPrivateKey && (
                                <p className="mt-1 text-xs font-mono text-gray-700 bg-gray-100 p-2 rounded">
                                  {wallet.privateKey}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Centralized Balance Tab */}
              {selectedTab === 'centralized' && (
                <div className="space-y-6">
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Centralized Balance
                      </h3>
                      
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                          <p className="text-sm text-blue-800">
                            Your funds are securely held in SwiftPay's managed wallets. 
                            You can withdraw to your personal wallets anytime.
                          </p>
                        </div>
                      </div>

                      {/* Balance Summary */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Total Balance</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${centralizedBalance.totalUSD.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Available</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${centralizedBalance.totalUSD.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-gray-900">$0.00</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600">Currencies</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {centralizedBalance.holdings.length}
                          </p>
                        </div>
                      </div>

                      {/* Holdings Breakdown */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Holdings Breakdown</h4>
                        <div className="space-y-3">
                          {centralizedBalance.holdings.map((holding) => (
                            <div key={holding.currency} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{holding.icon}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{holding.currency}</p>
                                  <p className="text-xs text-gray-500">
                                    {holding.balance.toFixed(4)} {holding.currency}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  ${holding.usdValue.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {((holding.usdValue / centralizedBalance.totalUSD) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs placeholder */}
              {selectedTab === 'settings' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Wallet Settings
                    </h3>
                    <p className="text-gray-600">Wallet settings and preferences will be available here.</p>
                  </div>
                </div>
              )}

              {selectedTab === 'analytics' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Wallet Analytics
                    </h3>
                    <p className="text-gray-600">Wallet analytics and insights will be available here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
