import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CurrencyDollarIcon,
  LinkIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function CheckoutGenerator() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const generateCheckoutLink = () => {
    if (!amount || !merchantName) return

    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      amount: amount,
      description: description,
      merchant: merchantName
    })

    const checkoutUrl = `${baseUrl}/checkout?${params.toString()}`
    setGeneratedLink(checkoutUrl)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <>
      <Head>
        <title>Checkout Generator - SwiftPay</title>
        <meta name="description" content="Generate crypto payment checkout links" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/demo" className="text-2xl font-bold text-indigo-600">
                  SwiftPay
                </Link>
                <span className="ml-4 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  CHECKOUT GENERATOR
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

        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout Link Generator</h1>
            <p className="mt-2 text-gray-600">
              Create secure crypto payment links for your customers
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Generator Form */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Payment Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant Name *
                    </label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="Your business name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this payment for?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <button
                    onClick={generateCheckoutLink}
                    disabled={!amount || !merchantName}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                  >
                    Generate Checkout Link
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Link */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Generated Link
                </h3>
                
                {generatedLink ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Link Generated Successfully!</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Share this link with your customers to accept crypto payments.
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 border rounded-lg">
                      <p className="text-xs font-mono text-gray-800 break-all">
                        {generatedLink}
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                      >
                        {isCopied ? (
                          <>
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </button>
                      <Link
                        href={generatedLink}
                        target="_blank"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-center"
                      >
                        Preview
                      </Link>
                    </div>

                    {/* QR Code Placeholder */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <QrCodeIcon className="h-16 w-16 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-600">QR Code for Mobile</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔗</div>
                    <p className="text-gray-500">Generate a checkout link to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Checkout Features
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-green-600">🔒</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Secure</h4>
                    <p className="text-sm text-gray-500">End-to-end encrypted payments</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-blue-600">⚡</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Fast</h4>
                    <p className="text-sm text-gray-500">Instant payment confirmation</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-purple-600">🌍</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Global</h4>
                    <p className="text-sm text-gray-500">Accept payments worldwide</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-yellow-600">💰</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Low Fees</h4>
                    <p className="text-sm text-gray-500">Competitive transaction fees</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-red-600">📱</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Mobile Ready</h4>
                    <p className="text-sm text-gray-500">QR codes for easy mobile payments</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 text-indigo-600">🔄</div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Multi-Crypto</h4>
                    <p className="text-sm text-gray-500">Support for major cryptocurrencies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

