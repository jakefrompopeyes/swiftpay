import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  ArrowPathIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { backendAPI } from '../services/backendAPI'
import toast from 'react-hot-toast'

interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  balance?: string;
}

interface ConversionQuote {
  fromAmount: string;
  toAmount: string;
  fromToken: string;
  toToken: string;
  priceImpact: number;
  minimumReceived: string;
  gasEstimate: string;
  route: any[];
}

export default function ConvertCoins() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [quote, setQuote] = useState<ConversionQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  
  // Form state
  const [fromWallet, setFromWallet] = useState<string>('')
  const [toToken, setToToken] = useState<string>('USDC')
  const [amount, setAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(0.5)

  const stablecoins = ['USDC', 'USDT', 'DAI']
  const supportedNetworks = ['ethereum', 'polygon', 'base', 'arbitrum']

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    try {
      setLoading(true)
      const response = await backendAPI.wallets.getWallets()
      if (response.success) {
        // Filter to only wallets with balances and supported networks
        const filteredWallets = response.data.filter((wallet: Wallet) => 
          supportedNetworks.includes(wallet.network.toLowerCase()) &&
          parseFloat(wallet.balance || '0') > 0
        )
        setWallets(filteredWallets)
        
        // Set default from wallet
        if (filteredWallets.length > 0 && !fromWallet) {
          setFromWallet(filteredWallets[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
      toast.error('Failed to load wallets')
    } finally {
      setLoading(false)
    }
  }

  const getQuote = async () => {
    if (!fromWallet || !amount || parseFloat(amount) <= 0) return

    const wallet = wallets.find(w => w.id === fromWallet)
    if (!wallet) return

    try {
      setQuoteLoading(true)
      const response = await fetch('/api/convert/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('swiftpay_token')}`
        },
        body: JSON.stringify({
          fromToken: wallet.currency,
          toToken,
          amount,
          network: wallet.network,
          slippage
        })
      })

      const result = await response.json()
      if (result.success) {
        setQuote(result.data)
      } else {
        toast.error(result.error || 'Failed to get quote')
        setQuote(null)
      }
    } catch (error) {
      console.error('Error getting quote:', error)
      toast.error('Failed to get conversion quote')
      setQuote(null)
    } finally {
      setQuoteLoading(false)
    }
  }

  const executeConversion = async () => {
    if (!quote || !fromWallet) return

    try {
      setConverting(true)
      const response = await fetch('/api/convert/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('swiftpay_token')}`
        },
        body: JSON.stringify({
          fromWallet,
          toToken,
          amount,
          quote,
          slippage
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Conversion initiated! Check your wallet for the transaction.')
        setQuote(null)
        setAmount('')
        fetchWallets() // Refresh balances
      } else {
        toast.error(result.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Error executing conversion:', error)
      toast.error('Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  const selectedWallet = wallets.find(w => w.id === fromWallet)
  const maxAmount = selectedWallet ? parseFloat(selectedWallet.balance || '0') : 0

  return (
    <>
      <Head>
        <title>Convert Coins - {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}</title>
        <meta name="description" content="Convert your crypto holdings to stablecoins" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/vendor-wallets" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  ← Back to Wallets
                </Link>
              </div>
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  CONVERT COINS
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Convert to Stablecoins</h1>
            <p className="mt-2 text-gray-600">
              Swap your crypto holdings for USDC, USDT, or DAI
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No convertible wallets</h3>
              <p className="mt-1 text-sm text-gray-500">
                You need wallets with balances on supported networks to convert coins.
              </p>
              <Link href="/vendor-wallets" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                Manage Wallets
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6">
              {/* From Wallet Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convert From
                </label>
                <select
                  value={fromWallet}
                  onChange={(e) => {
                    setFromWallet(e.target.value)
                    setQuote(null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.currency} ({wallet.network}) - {parseFloat(wallet.balance || '0').toFixed(4)} {wallet.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Convert
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setQuote(null)
                    }}
                    placeholder="0.00"
                    min="0"
                    max={maxAmount}
                    step="0.0001"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => setAmount(maxAmount.toString())}
                    className="px-3 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  >
                    Max
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Available: {maxAmount.toFixed(4)} {selectedWallet?.currency}
                </p>
              </div>

              {/* To Token Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convert To
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {stablecoins.map((token) => (
                    <button
                      key={token}
                      onClick={() => {
                        setToToken(token)
                        setQuote(null)
                      }}
                      className={`px-4 py-2 rounded-md border ${
                        toToken === token
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slippage Tolerance */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance
                </label>
                <div className="flex space-x-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSlippage(value)
                        setQuote(null)
                      }}
                      className={`px-3 py-1 rounded-md text-sm ${
                        slippage === value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => {
                      setSlippage(parseFloat(e.target.value) || 0.5)
                      setQuote(null)
                    }}
                    placeholder="Custom"
                    min="0.1"
                    max="50"
                    step="0.1"
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Get Quote Button */}
              <div className="mb-6">
                <button
                  onClick={getQuote}
                  disabled={!fromWallet || !amount || parseFloat(amount) <= 0 || quoteLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                >
                  {quoteLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Getting Quote...
                    </>
                  ) : (
                    'Get Quote'
                  )}
                </button>
              </div>

              {/* Quote Display */}
              {quote && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Quote</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">You pay:</span>
                      <span className="font-medium">{quote.fromAmount} {quote.fromToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">You receive:</span>
                      <span className="font-medium text-green-600">{quote.toAmount} {quote.toToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Minimum received:</span>
                      <span className="text-sm text-gray-500">{quote.minimumReceived} {quote.toToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price impact:</span>
                      <span className={`text-sm ${quote.priceImpact > 5 ? 'text-red-600' : quote.priceImpact > 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {quote.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated gas:</span>
                      <span className="text-sm text-gray-500">{quote.gasEstimate} ETH</span>
                    </div>
                  </div>

                  {quote.priceImpact > 5 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">
                            High price impact detected. Consider splitting your trade into smaller amounts.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={executeConversion}
                    disabled={converting}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
                  >
                    {converting ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Execute Conversion
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      How it works
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>We use decentralized exchanges to find the best rates</li>
                        <li>Your conversion is executed directly from your wallet</li>
                        <li>You maintain full control of your private keys</li>
                        <li>Gas fees are paid in the source token's network</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
