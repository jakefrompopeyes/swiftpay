import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CreditCardIcon,
  QrCodeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'
import { cryptoAPI, CryptoPrice } from '../services/cryptoAPI'

interface PaymentMethod {
  id: string
  name: string
  symbol: string
  icon: string
  image?: string
  minAmount: number
  maxAmount: number
  fee: number
  estimatedTime: string
}

export default function Checkout() {
  const router = useRouter()
  const { amount, description, merchant } = router.query

  const [paymentAmount, setPaymentAmount] = useState(amount ? parseFloat(amount as string) : 0)
  const [paymentDescription, setPaymentDescription] = useState(description as string || '')
  const [merchantName, setMerchantName] = useState(merchant as string || 'Demo Merchant')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'method' | 'payment' | 'confirming' | 'success' | 'failed'>('method')

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      icon: '🟠',
      minAmount: 0.0001,
      maxAmount: 1,
      fee: 0.5,
      estimatedTime: '10-30 minutes'
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: '🔷',
      minAmount: 0.001,
      maxAmount: 10,
      fee: 0.3,
      estimatedTime: '2-5 minutes'
    },
    {
      id: 'usd-coin',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: '🔵',
      minAmount: 1,
      maxAmount: 10000,
      fee: 0.1,
      estimatedTime: '1-2 minutes'
    },
    {
      id: 'matic-network',
      name: 'Polygon',
      symbol: 'MATIC',
      icon: '🟣',
      minAmount: 1,
      maxAmount: 10000,
      fee: 0.2,
      estimatedTime: '1-3 minutes'
    }
  ]

  useEffect(() => {
    loadCryptoPrices()
  }, [])

  const loadCryptoPrices = async () => {
    try {
      const prices = await cryptoAPI.getTopCryptos(20)
      setCryptoPrices(prices)
    } catch (error) {
      console.error('Error loading crypto prices:', error)
    }
  }

  const getCryptoPrice = (symbol: string) => {
    const crypto = cryptoPrices.find(c => c.symbol.toLowerCase() === symbol.toLowerCase())
    return crypto?.current_price || 0
  }

  const calculateCryptoAmount = (method: PaymentMethod) => {
    const price = getCryptoPrice(method.symbol)
    if (price === 0) return 0
    return paymentAmount / price
  }

  const calculateTotalWithFee = (method: PaymentMethod) => {
    const feeAmount = paymentAmount * (method.fee / 100)
    return paymentAmount + feeAmount
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    setPaymentStep('payment')
  }

  const handlePaymentConfirm = () => {
    setPaymentStep('confirming')
    
    // Simulate payment processing
    setTimeout(() => {
      // Simulate success/failure (90% success rate for demo)
      const isSuccess = Math.random() > 0.1
      setPaymentStep(isSuccess ? 'success' : 'failed')
    }, 3000)
  }

  const formatCryptoAmount = (amount: number, symbol: string) => {
    if (symbol === 'BTC') return amount.toFixed(6)
    if (symbol === 'ETH') return amount.toFixed(4)
    return amount.toFixed(2)
  }

  return (
    <Layout>
      <Head>
        <title>Checkout - SwiftPay</title>
        <meta name="description" content="Secure crypto payment checkout" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  SECURE CHECKOUT
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Payment Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              <div className={`flex items-center ${paymentStep === 'method' ? 'text-indigo-600' : paymentStep === 'payment' || paymentStep === 'confirming' || paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'method' ? 'bg-indigo-600 text-white' : paymentStep === 'payment' || paymentStep === 'confirming' || paymentStep === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Choose Method</span>
              </div>
              <div className={`flex items-center ${paymentStep === 'payment' ? 'text-indigo-600' : paymentStep === 'confirming' || paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'payment' ? 'bg-indigo-600 text-white' : paymentStep === 'confirming' || paymentStep === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Pay</span>
              </div>
              <div className={`flex items-center ${paymentStep === 'confirming' ? 'text-indigo-600' : paymentStep === 'success' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${paymentStep === 'confirming' ? 'bg-indigo-600 text-white' : paymentStep === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Confirm</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Payment Details */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Payment Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Merchant</span>
                    <span className="text-sm text-gray-900">{merchantName}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Description</span>
                    <span className="text-sm text-gray-900">{paymentDescription || 'Payment'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span className="text-sm font-medium text-indigo-700">Amount</span>
                    <span className="text-lg font-bold text-indigo-900">${paymentAmount.toFixed(2)}</span>
                  </div>
                </div>

                {selectedMethod && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Payment Method</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{selectedMethod.icon}</span>
                        <span className="text-sm font-medium text-blue-900">{selectedMethod.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-blue-900">
                          {formatCryptoAmount(calculateCryptoAmount(selectedMethod), selectedMethod.symbol)} {selectedMethod.symbol}
                        </p>
                        <p className="text-xs text-blue-700">
                          Fee: {selectedMethod.fee}% • {selectedMethod.estimatedTime}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Choose Payment Method
                </h3>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => {
                    const cryptoAmount = calculateCryptoAmount(method)
                    const totalWithFee = calculateTotalWithFee(method)
                    const price = getCryptoPrice(method.symbol)
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => handlePaymentMethodSelect(method)}
                        className="w-full p-4 border rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-lg">{method.icon}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{method.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatCryptoAmount(cryptoAmount, method.symbol)} {method.symbol}
                                {price > 0 && ` • $${price.toLocaleString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${totalWithFee.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {method.estimatedTime}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Confirmation */}
          {paymentStep === 'payment' && selectedMethod && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Complete Payment
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Payment Instructions
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Send exactly <strong>{formatCryptoAmount(calculateCryptoAmount(selectedMethod), selectedMethod.symbol)} {selectedMethod.symbol}</strong> to the address below.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <QrCodeIcon className="h-32 w-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Scan QR code with your wallet</p>
                      <div className="p-3 bg-white border rounded-lg">
                        <p className="text-xs font-mono text-gray-800 break-all">
                          0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setPaymentStep('method')}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePaymentConfirm}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      I've Sent Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Confirming */}
          {paymentStep === 'confirming' && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Confirming Payment</h3>
                  <p className="text-gray-600">Please wait while we verify your transaction...</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Success */}
          {paymentStep === 'success' && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-6">
                    Your payment of ${paymentAmount.toFixed(2)} has been confirmed.
                  </p>
                  <div className="space-y-3">
                    <Link
                      href="/demo"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 inline-block"
                    >
                      Back to Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setPaymentStep('method')
                        setSelectedMethod(null)
                      }}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      Make Another Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Failed */}
          {paymentStep === 'failed' && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Failed</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't confirm your payment. Please try again or contact support.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentStep('method')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      Try Again
                    </button>
                    <Link
                      href="/demo"
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200 inline-block"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
