import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface CryptoHolding {
  currency: string
  symbol: string
  balance: number
  fiatValue: number
  change24h: number
  icon: string
}

export default function ConvertToUSDC() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoHolding | null>(null)
  const [convertAmount, setConvertAmount] = useState('')
  const [usdcAmount, setUsdcAmount] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionComplete, setConversionComplete] = useState(false)
  const router = useRouter()

  const cryptoHoldings: CryptoHolding[] = [
    {
      currency: 'ETH',
      symbol: 'Ethereum',
      balance: 2.4567,
      fiatValue: 5120.25,
      change24h: 2.4,
      icon: '🔷'
    },
    {
      currency: 'BTC',
      symbol: 'Bitcoin',
      balance: 0.1234,
      fiatValue: 3085.00,
      change24h: -1.2,
      icon: '🟠'
    },
    {
      currency: 'MATIC',
      symbol: 'Polygon',
      balance: 150.7890,
      fiatValue: 113.09,
      change24h: 5.8,
      icon: '🟣'
    }
  ]

  const handleCryptoSelect = (crypto: CryptoHolding) => {
    setSelectedCrypto(crypto)
    setConvertAmount('')
    setUsdcAmount('')
  }

  const handleAmountChange = (amount: string) => {
    setConvertAmount(amount)
    if (selectedCrypto && amount) {
      const numericAmount = parseFloat(amount)
      if (!isNaN(numericAmount)) {
        const usdcValue = numericAmount * (selectedCrypto.fiatValue / selectedCrypto.balance)
        setUsdcAmount(usdcValue.toFixed(2))
      }
    }
  }

  const handleMaxAmount = () => {
    if (selectedCrypto) {
      setConvertAmount(selectedCrypto.balance.toString())
      setUsdcAmount(selectedCrypto.fiatValue.toFixed(2))
    }
  }

  const handleConvert = async () => {
    setIsConverting(true)
    
    // Simulate conversion process
    setTimeout(() => {
      setIsConverting(false)
      setConversionComplete(true)
    }, 3000)
  }

  const conversionRate = selectedCrypto ? (selectedCrypto.fiatValue / selectedCrypto.balance) : 0
  const conversionFee = 0.5 // 0.5% fee
  const feeAmount = parseFloat(usdcAmount) * (conversionFee / 100)
  const finalUsdcAmount = parseFloat(usdcAmount) - feeAmount

  return (
    <>
      <Head>
        <title>Convert to USDC - SwiftPay</title>
        <meta name="description" content="Convert your crypto holdings to USDC" />
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

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Convert to USDC</h1>
            <p className="mt-2 text-gray-600">
              Convert your volatile crypto holdings to stable USDC for predictable business operations
            </p>
          </div>

          {/* Conversion Form */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Select Crypto */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Select Cryptocurrency
                </h3>
                <div className="space-y-3">
                  {cryptoHoldings.map((crypto) => (
                    <button
                      key={crypto.currency}
                      onClick={() => handleCryptoSelect(crypto)}
                      className={`w-full p-4 border rounded-lg text-left transition-colors duration-200 ${
                        selectedCrypto?.currency === crypto.currency
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-lg">{crypto.icon}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {crypto.currency} ({crypto.symbol})
                            </p>
                            <p className="text-sm text-gray-500">
                              Balance: {crypto.balance.toFixed(4)} {crypto.currency}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            ${crypto.fiatValue.toFixed(2)}
                          </p>
                          <p className={`text-sm ${crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversion Details */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Conversion Details
                </h3>
                
                {selectedCrypto ? (
                  <div className="space-y-4">
                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount to Convert
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          value={convertAmount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-sm text-gray-700">
                          {selectedCrypto.currency}
                        </span>
                      </div>
                      <button
                        onClick={handleMaxAmount}
                        className="mt-1 text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        Use Max ({selectedCrypto.balance.toFixed(4)} {selectedCrypto.currency})
                      </button>
                    </div>

                    {/* Conversion Rate */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Conversion Rate</span>
                        <span className="font-medium text-gray-900">
                          1 {selectedCrypto.currency} = ${conversionRate.toFixed(2)} USDC
                        </span>
                      </div>
                    </div>

                    {/* USDC Amount */}
                    {usdcAmount && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">You'll Receive</p>
                            <p className="text-lg font-bold text-green-900">
                              {usdcAmount} USDC
                            </p>
                          </div>
                          <div className="text-2xl">🔵</div>
                        </div>
                      </div>
                    )}

                    {/* Fee Information */}
                    {usdcAmount && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Conversion Fee (0.5%)</span>
                          <span className="text-gray-900">-${feeAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-gray-900">Final Amount</span>
                          <span className="text-gray-900">${finalUsdcAmount.toFixed(2)} USDC</span>
                        </div>
                      </div>
                    )}

                    {/* Convert Button */}
                    {convertAmount && usdcAmount && (
                      <button
                        onClick={() => setShowConfirmModal(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                      >
                        Convert to USDC
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">💱</div>
                    <p className="text-gray-500">Select a cryptocurrency to convert</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Why Convert to USDC?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Price Stability:</strong> USDC maintains a 1:1 peg with USD</li>
                    <li><strong>Business Predictability:</strong> Avoid crypto volatility in your operations</li>
                    <li><strong>Easy Accounting:</strong> Stable value makes bookkeeping simpler</li>
                    <li><strong>Instant Settlement:</strong> No waiting for blockchain confirmations</li>
                    <li><strong>Low Fees:</strong> Only 0.5% conversion fee</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Confirm Conversion</h3>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Converting</span>
                      <span className="font-medium">{convertAmount} {selectedCrypto?.currency}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">To</span>
                      <span className="font-medium">{usdcAmount} USDC</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Conversion Fee</span>
                      <span className="font-medium">-${feeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">You'll Receive</span>
                      <span className="text-lg font-bold text-gray-900">${finalUsdcAmount.toFixed(2)} USDC</span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Important Notice
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This conversion is irreversible. Your {selectedCrypto?.currency} will be exchanged for USDC at the current market rate.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConvert}
                      disabled={isConverting}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      {isConverting ? 'Converting...' : 'Confirm Conversion'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Complete Modal */}
        {conversionComplete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Conversion Successful!</h3>
                <p className="text-gray-600 mb-6">
                  You've successfully converted {convertAmount} {selectedCrypto?.currency} to {finalUsdcAmount.toFixed(2)} USDC.
                </p>

                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-gray-900">conv_0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Completed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="text-gray-900">{new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/demo"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 inline-block"
                  >
                    Back to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setConversionComplete(false)
                      setShowConfirmModal(false)
                      setConvertAmount('')
                      setUsdcAmount('')
                      setSelectedCrypto(null)
                    }}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                  >
                    Convert More
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

