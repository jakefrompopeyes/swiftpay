import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CurrencyDollarIcon, 
  ArrowRightIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface PaymentData {
  amount: number
  currency: string
  fiatAmount: number
  description: string
  vendorName: string
}

export default function PaymentDemo() {
  const [step, setStep] = useState(1)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0.1,
    currency: 'ETH',
    fiatAmount: 208.50,
    description: 'Coffee and pastry',
    vendorName: 'Crypto Coffee Co.'
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const currencies = [
    { symbol: 'ETH', name: 'Ethereum', price: 2085.00, icon: '🔷' },
    { symbol: 'BTC', name: 'Bitcoin', price: 25000.00, icon: '🟠' },
    { symbol: 'MATIC', name: 'Polygon', price: 0.75, icon: '🟣' },
    { symbol: 'USDC', name: 'USD Coin', price: 1.00, icon: '🔵' }
  ]

  const handleCurrencyChange = (currency: any) => {
    const newAmount = paymentData.fiatAmount / currency.price
    setPaymentData({
      ...paymentData,
      currency: currency.symbol,
      amount: parseFloat(newAmount.toFixed(6))
    })
  }

  const handleAmountChange = (amount: number) => {
    const selectedCurrency = currencies.find(c => c.symbol === paymentData.currency)
    if (selectedCurrency) {
      setPaymentData({
        ...paymentData,
        amount,
        fiatAmount: amount * selectedCurrency.price
      })
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setStep(3)
      setIsProcessing(false)
      toast.success('Payment successful!')
    }, 3000)
  }

  return (
    <>
      <Head>
        <title>Payment Demo - SwiftPay</title>
        <meta name="description" content="SwiftPay Payment Demo" />
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
                <span className="ml-4 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  PAYMENT DEMO
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/demo" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Back to Demo
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Demo Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Demo Payment
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This is a simulated payment. No real transactions will occur.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Steps */}
          <div className="bg-white shadow rounded-lg">
            {/* Step 1: Payment Details */}
            {step === 1 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Payment Request</h2>
                  <p className="text-gray-600 mt-2">from {paymentData.vendorName}</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-900">{paymentData.description}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      value={paymentData.fiatAmount}
                      onChange={(e) => handleAmountChange(parseFloat(e.target.value) / currencies.find(c => c.symbol === paymentData.currency)!.price)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay with
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {currencies.map((currency) => (
                        <button
                          key={currency.symbol}
                          onClick={() => handleCurrencyChange(currency)}
                          className={`p-3 border rounded-md text-left ${
                            paymentData.currency === currency.symbol
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{currency.icon}</span>
                            <div>
                              <p className="font-medium text-gray-900">{currency.symbol}</p>
                              <p className="text-sm text-gray-500">{currency.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">You'll pay:</span>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {paymentData.amount.toFixed(6)} {paymentData.currency}
                        </p>
                        <p className="text-sm text-gray-500">
                          ≈ ${paymentData.fiatAmount.toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                  >
                    Continue to Payment
                    <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Confirmation */}
            {step === 2 && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Confirm Payment</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium">{paymentData.vendorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">{paymentData.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">
                          {paymentData.amount.toFixed(6)} {paymentData.currency}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-600">Total (USD):</span>
                        <span className="font-bold text-lg">${paymentData.fiatAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      {isProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment Success */}
            {step === 3 && (
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your payment of {paymentData.amount.toFixed(6)} {paymentData.currency} has been processed.
                </p>

                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-gray-900">0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-green-600 font-medium">Confirmed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Network:</span>
                      <span className="text-gray-900">Ethereum</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/demo"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 inline-block"
                  >
                    Back to Demo Dashboard
                  </Link>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                  >
                    Make Another Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
