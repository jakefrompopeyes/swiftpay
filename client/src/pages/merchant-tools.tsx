import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { 
  CodeBracketIcon,
  LinkIcon,
  QrCodeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { backendAPI } from '../services/backendAPI'

export default function MerchantTools() {
  const [selectedIntegration, setSelectedIntegration] = useState<'button' | 'link' | 'api' | 'embed'>('button')
  const [merchantName, setMerchantName] = useState('Your Business')
  const [merchantId, setMerchantId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [buttonStyle, setButtonStyle] = useState('primary')
  const [buttonSize, setButtonSize] = useState('medium')
  const [isCopied, setIsCopied] = useState(false)
  const [currency, setCurrency] = useState('ETH')
  const [createdLink, setCreatedLink] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [selectedLang, setSelectedLang] = useState<'html' | 'react' | 'javascript' | 'curl' | 'python' | 'url'>('html')

  useEffect(() => {
    setMounted(true)
    // Try to auto-load merchant id from auth
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
      if (token) {
        backendAPI.auth.verify().then((res) => {
          if (res?.data?.user?.id) setMerchantId(res.data.user.id)
        }).catch(() => {})
      }
    } catch {}
  }, [])

  useEffect(() => {
    // Reset language per integration for sensible defaults
    if (selectedIntegration === 'button') setSelectedLang('html')
    if (selectedIntegration === 'api') setSelectedLang('javascript')
    if (selectedIntegration === 'embed') setSelectedLang('html')
    if (selectedIntegration === 'link') setSelectedLang('url')
  }, [selectedIntegration])

  const getPublicBaseUrl = () => {
    const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || '').trim()
    if (envUrl) {
      const withProtocol = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`
      return withProtocol.replace(/\/$/, '')
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin
    }
    return ''
  }

  const generateCheckoutUrl = () => {
    // Require merchantId to build a working link
    if (!merchantId) return ''
    const params = new URLSearchParams()
    params.set('merchantId', merchantId)
    if (amount) params.set('amount', amount)
    if (currency) params.set('currency', currency)
    if (description) params.set('description', description)
    const qs = params.toString()
    const base = getPublicBaseUrl()
    const path = `/api/r/pay${qs ? `?${qs}` : ''}`
    return `${base}${path}`
  }

  const generateButtonCode = () => {
    const href = generateCheckoutUrl()
    const buttonText = amount ? `Pay $${amount}` : 'Pay with Crypto'
    
    const styles = {
      primary: 'background: #4f46e5; color: white;',
      secondary: 'background: #6b7280; color: white;',
      success: 'background: #059669; color: white;',
      outline: 'background: transparent; color: #4f46e5; border: 2px solid #4f46e5;'
    }
    
    const sizes = {
      small: 'padding: 8px 16px; font-size: 14px;',
      medium: 'padding: 12px 24px; font-size: 16px;',
      large: 'padding: 16px 32px; font-size: 18px;'
    }

    // If no href (missing merchantId), render disabled preview
    if (!href) {
      return `
<!-- SwiftPay Payment Button (disabled - set Merchant ID) -->
<a href="#" 
   style="${styles[buttonStyle as keyof typeof styles]} ${sizes[buttonSize as keyof typeof sizes]} text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; transition: all 0.2s; opacity: 0.6; pointer-events: none;" aria-disabled="true" title="Login or enter Merchant ID to enable">
  ${buttonText}
</a>
<!-- End SwiftPay Button -->`
    }

    return `
<!-- SwiftPay Payment Button (opens QR checkout) -->
<a href="${href}" 
   style="${styles[buttonStyle as keyof typeof styles]} ${sizes[buttonSize as keyof typeof sizes]} text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; transition: all 0.2s;">
  ${buttonText}
</a>
<!-- End SwiftPay Button -->`
  }

  const generateButtonReactCode = () => {
    const href = generateCheckoutUrl()
    const buttonText = amount ? `Pay $${amount}` : 'Pay with Crypto'
    return `
// SwiftPay Pay Button (React)
import React from 'react'

export default function PayButton() {
  const handleClick = () => {
    window.location.href = '${href}'
  }
  return (
    <button onClick={handleClick} style={{ background: '#4f46e5', color: '#ffffff', padding: '12px 24px', borderRadius: 6, fontWeight: 500 }}>
      ${buttonText}
    </button>
  )
}
`
  }

  const createPaymentRequest = async () => {
    if (!amount || !currency) return
    setCreating(true)
    try {
      const result = await backendAPI.paymentRequests.create(amount, currency, description)
      if (result.success) {
        setCreatedLink(result.data.checkoutUrl)
        setIsCopied(false)
      } else {
        console.error(result)
        alert(result.error || 'Failed to create payment request')
      }
    } finally {
      setCreating(false)
    }
  }

  const generateEmbedCode = () => {
    const url = generateCheckoutUrl()
    if (!url) {
      return `<!-- Create a payment link first using the tool above, then regenerate the embed code -->`
    }
    return `
<!-- SwiftPay Embedded QR Checkout -->
<iframe src="${url}" width="100%" height="600" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>
<!-- End SwiftPay Embed -->`
  }

  const generateApiExample = (lang: 'javascript' | 'curl' | 'python' | 'url' = 'javascript') => {
    const checkout = generateCheckoutUrl()
    if (lang === 'curl') {
      return `
# Open SwiftPay Checkout (cURL)
curl -L '${checkout}'
`
    }
    if (lang === 'python') {
      return `
# Open SwiftPay Checkout (Python)
import webbrowser

webbrowser.open('${checkout}')
`
    }
    if (lang === 'url') {
      return checkout
    }
    // Default: JavaScript
    return `
// Open SwiftPay Checkout (JavaScript)
window.location.href = '${checkout}'
`
  }

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement('textarea')
        el.value = text
        el.style.position = 'fixed'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const integrations = [
    {
      id: 'button',
      name: 'Payment Button',
      description: 'Add a simple payment button to your website',
      icon: '🔘',
      color: 'blue'
    },
    {
      id: 'link',
      name: 'Direct Link',
      description: 'Share a direct payment link with customers',
      icon: '🔗',
      color: 'green'
    },
    {
      id: 'api',
      name: 'API Integration',
      description: 'Integrate payments into your application',
      icon: '⚙️',
      color: 'purple'
    },
    {
      id: 'embed',
      name: 'Embedded Checkout',
      description: 'Embed the full checkout in your site',
      icon: '📦',
      color: 'orange'
    }
  ]

  return (
    <>
      <Head>
        <title>Merchant Integration Tools - {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}</title>
        <meta name="description" content={`Tools for merchants to integrate ${(process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace')} payments`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/demo" className="text-2xl font-bold text-indigo-600">
                  {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}
                </Link>
                <span className="ml-4 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  MERCHANT TOOLS
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

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Merchant Integration Tools</h1>
            <p className="mt-2 text-gray-600">
              Choose how you want to integrate {(process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace')} payments into your business
            </p>
          </div>

          {/* Integration Types */}
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {integrations.map((integration) => (
                <button
                  key={integration.id}
                  onClick={() => setSelectedIntegration(integration.id as any)}
                  className={`p-4 border rounded-lg text-left transition-colors duration-200 ${
                    selectedIntegration === integration.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{integration.icon}</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{integration.name}</h3>
                      <p className="text-xs text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Configuration */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Payment Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant Name (for display)
                    </label>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merchant ID (used in links)
                    </label>
                    <input
                      type="text"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      placeholder="Auto-filled when logged in"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (USD) - Optional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Leave empty for customer to enter"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description - Optional
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this payment for?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {selectedIntegration === 'button' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Style
                        </label>
                        <select
                          value={buttonStyle}
                          onChange={(e) => setButtonStyle(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="primary">Primary (Blue)</option>
                          <option value="secondary">Secondary (Gray)</option>
                          <option value="success">Success (Green)</option>
                          <option value="outline">Outline</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Size
                        </label>
                        <select
                          value={buttonSize}
                          onChange={(e) => setButtonSize(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Code/Preview */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedIntegration === 'button' && 'Generated Button Code'}
                    {selectedIntegration === 'link' && 'Payment Link'}
                    {selectedIntegration === 'api' && 'API Integration Code'}
                    {selectedIntegration === 'embed' && 'Embed Code'}
                  </h3>
                  {/* Language Tabs */}
                  <div className="flex items-center space-x-2">
                    {selectedIntegration === 'button' && (
                      <>
                        <button onClick={() => setSelectedLang('html')} className={`text-xs px-2 py-1 rounded ${selectedLang === 'html' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>HTML</button>
                        <button onClick={() => setSelectedLang('react')} className={`text-xs px-2 py-1 rounded ${selectedLang === 'react' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>React</button>
                      </>
                    )}
                    {selectedIntegration === 'api' && (
                      <>
                        <button onClick={() => setSelectedLang('javascript')} className={`text-xs px-2 py-1 rounded ${selectedLang === 'javascript' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>JavaScript</button>
                        <button onClick={() => setSelectedLang('curl')} className={`text-xs px-2 py-1 rounded ${selectedLang === 'curl' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>cURL</button>
                        <button onClick={() => setSelectedLang('python')} className={`text-xs px-2 py-1 rounded ${selectedLang === 'python' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Python</button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      let code = ''
                      if (selectedIntegration === 'button') {
                        code = selectedLang === 'react' ? generateButtonReactCode() : generateButtonCode()
                      } else if (selectedIntegration === 'link') {
                        code = generateCheckoutUrl()
                      } else if (selectedIntegration === 'api') {
                        code = generateApiExample(selectedLang as any)
                      } else {
                        code = generateEmbedCode()
                      }
                      copyToClipboard(code)
                    }}
                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center"
                  >
                    {isCopied ? (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Preview */}
                {mounted && selectedIntegration === 'button' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="mb-3" dangerouslySetInnerHTML={{ __html: generateButtonCode() }} />
                      <div className="text-xs text-gray-500">
                        Clicking the button will create a payment request and redirect to the Pay page.
                      </div>
                    </div>
                  </div>
                )}

                {/* Removed Generate Payment Request block: button now links directly to /api/r/pay */}

                {selectedIntegration === 'link' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <QrCodeIcon className="h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">QR Code for Mobile</p>
                    </div>
                  </div>
                )}

                {/* Code Display */}
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>
                      {mounted && selectedIntegration === 'button' && (selectedLang === 'react' ? generateButtonReactCode() : generateButtonCode())}
                      {mounted && selectedIntegration === 'link' && generateCheckoutUrl()}
                      {selectedIntegration === 'api' && generateApiExample(selectedLang as any)}
                      {mounted && selectedIntegration === 'embed' && generateEmbedCode()}
                    </code>
                  </pre>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    {selectedIntegration === 'button' && 'How to Use:'}
                    {selectedIntegration === 'link' && 'How to Share:'}
                    {selectedIntegration === 'api' && 'How to Integrate:'}
                    {selectedIntegration === 'embed' && 'How to Embed:'}
                  </h4>
                  <div className="text-sm text-blue-700">
                    {selectedIntegration === 'button' && (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{createdLink ? 'Payment request created. Button will open QR checkout.' : 'Optionally click "Generate Payment Request" below for a QR link.'}</li>
                        <li>Copy the generated HTML code</li>
                        <li>Paste it into your website's HTML</li>
                        <li>Customize the styling if needed</li>
                      </ol>
                    )}
                    {selectedIntegration === 'link' && (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Copy the payment link</li>
                        <li>Share via email, SMS, or social media</li>
                        <li>Customers click to pay instantly</li>
                        <li>Use QR code for in-person payments</li>
                      </ol>
                    )}
                    {selectedIntegration === 'api' && (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Get your API key from SwiftPay dashboard</li>
                        <li>Use the code example above</li>
                        <li>Customize for your application</li>
                        <li>Handle webhooks for payment updates</li>
                      </ol>
                    )}
                    {selectedIntegration === 'embed' && (
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Copy the iframe code</li>
                        <li>Paste into your website</li>
                        <li>Adjust width/height as needed</li>
                        <li>Customers can pay without leaving your site</li>
                      </ol>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Examples */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Integration Examples
              </h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🛒</span>
                    <h4 className="text-sm font-medium text-gray-900">E-commerce</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Add payment buttons to product pages and checkout flows
                  </p>
                  <div className="text-xs text-gray-500">
                    Perfect for: Online stores, digital products
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🍕</span>
                    <h4 className="text-sm font-medium text-gray-900">Restaurants</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    QR codes on tables for instant bill payments
                  </p>
                  <div className="text-xs text-gray-500">
                    Perfect for: Food delivery, dine-in payments
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">💼</span>
                    <h4 className="text-sm font-medium text-gray-900">Services</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Invoice links sent via email or SMS
                  </p>
                  <div className="text-xs text-gray-500">
                    Perfect for: Freelancers, consultants, subscriptions
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
