import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import QRCode from 'qrcode'
import { realtime, ServerEvent } from '../../services/realtime'
import { cryptoLogoService } from '../../services/cryptoLogos'
import { 
  ArrowLeftIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

export default function PayRequest() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState<any>(null)
  const [options, setOptions] = useState<{ wallets: any[] } | null>(null)
  const [qr, setQr] = useState<string>('')
  const [status, setStatus] = useState<string>('pending')
  const [selectedWallet, setSelectedWallet] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [usdAmount, setUsdAmount] = useState<number | null>(null)
  const [currentAmount, setCurrentAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`http://localhost:3001/api/payment-requests/${id}`)
      .then(r => r.json())
      .then(async (res) => {
        if (res.success) {
          setData(res.data)
          const uri = `${res.data.network}:${res.data.to_address}?amount=${res.data.amount}`
          setQr(await QRCode.toDataURL(uri))
        }
      })

    // load merchant wallets (accepted currencies)
    fetch(`http://localhost:3001/api/payment-requests/${id}/options`)
      .then(r => r.json())
      .then((res) => { 
        if (res.success) {
          setOptions(res.data)
          // Set the first wallet as selected by default
          if (res.data.wallets && res.data.wallets.length > 0) {
            setSelectedWallet(res.data.wallets[0])
          }
        }
      })

    // load prices for USD conversion
    fetch('http://localhost:3001/api/public/prices')
      .then(r => r.json())
      .then((res) => {
        if (res.success) setPrices(res.data || {})
      })

    // start realtime listener
    realtime.connect()
    const off = realtime.on((evt: ServerEvent) => {
      if (evt.type === 'payment_request_updated' && evt.id === id) {
        setStatus(evt.status)
      }
    })

    const timer = setInterval(async () => {
      const r = await fetch(`http://localhost:3001/api/payment-requests/${id}/status`)
      const j = await r.json()
      if (j.success) {
        setStatus(j.data.status)
        if (j.data.status === 'completed') clearInterval(timer)
      }
      // opportunistic chain check for auto-complete
      if (j.success && j.data.status !== 'completed') {
        try {
          await fetch(`http://localhost:3001/api/payment-requests/${id}/check-chain`, { method: 'POST', credentials: 'include' })
        } catch {}
      }
    }, 4000)

    return () => {
      clearInterval(timer)
      off()
    }
  }, [id])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleWalletSelect = async (wallet: any) => {
    setSelectedWallet(wallet)
    // compute amount in selected currency based on USD equivalent
    const price = prices[wallet.currency?.toUpperCase?.()] || 0
    const amountToPay = usdAmount && price > 0 ? usdAmount / price : data.amount
    setCurrentAmount(amountToPay)
    const uri = `${wallet.network}:${wallet.address}?amount=${amountToPay}`
    setQr(await QRCode.toDataURL(uri))
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  // whenever prices and initial data are available, compute usd amount and default currentAmount
  useEffect(() => {
    if (!data || !prices || Object.keys(prices).length === 0) return
    const price = prices[data.currency?.toUpperCase?.()] || 0
    if (price > 0) {
      const usd = parseFloat(String(data.amount)) * price
      setUsdAmount(usd)
      if (selectedWallet) {
        const selPrice = prices[selectedWallet.currency?.toUpperCase?.()] || 0
        const amt = selPrice > 0 ? usd / selPrice : data.amount
        setCurrentAmount(amt)
      } else {
        setCurrentAmount(data.amount)
      }
    }
  }, [data, prices, selectedWallet])

  return (
    <>
      <Head>
        <title>Payment Request - SwiftPay</title>
        <meta name="description" content="Secure cryptocurrency payment" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-indigo-600">
                  SwiftPay
                </Link>
                <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                  SECURE PAYMENT
                </span>
              </div>
              <Link 
                href="/" 
                className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel: Cryptocurrency Selection */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <QrCodeIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Choose Payment Method
                  </h2>
                  
                  <div className="space-y-3">
                    {(options?.wallets || []).map((wallet) => {
                      const isSelected = selectedWallet?.id === wallet.id
                      const logoUrl = cryptoLogoService.getLogoUrl(wallet.currency)
                      const hasLogo = cryptoLogoService.hasLogoUrl(wallet.currency)
                      
                      return (
                        <div
                          key={wallet.id}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleWalletSelect(wallet)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                {hasLogo ? (
                                  <img
                                    src={logoUrl}
                                    alt={`${wallet.currency} logo`}
                                    className="w-10 h-10 rounded-full"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                      const fallback = target.nextElementSibling as HTMLElement
                                      if (fallback) fallback.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                                    hasLogo ? 'hidden' : 'flex'
                                  }`}
                                  style={{ backgroundColor: '#f3f4f6' }}
                                >
                                  {cryptoLogoService.getLogoUrl(wallet.currency)}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-gray-900">{wallet.currency}</span>
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    {wallet.network}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 font-mono">
                                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel: Payment Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Pay { (currentAmount ?? data.amount).toString() } { selectedWallet?.currency || data.currency }
                    </h1>
                    {usdAmount != null && (
                      <p className="text-sm text-gray-500">≈ ${usdAmount.toFixed(2)} USD</p>
                    )}
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon()}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  {qr && selectedWallet && (
                    <div className="text-center mb-6">
                      <div className="bg-white p-6 rounded-2xl shadow-inner border-2 border-gray-100 inline-block">
                        <img 
                          src={qr} 
                          alt="Payment QR Code" 
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                        Scan with your crypto wallet to pay
                      </p>
                    </div>
                  )}

                  {/* Payment Address */}
                  {selectedWallet && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Send to:</span>
                        <button
                          onClick={() => copyToClipboard(selectedWallet.address)}
                          className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm transition-colors"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="font-mono text-sm text-gray-800 break-all">
                          {selectedWallet.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Instructions */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Payment Instructions</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Send exactly <strong>{(currentAmount ?? data.amount)} {selectedWallet?.currency || data.currency}</strong></li>
                      <li>• Use the selected network: <strong>{selectedWallet?.network || data.network}</strong></li>
                      <li>• Payment will be confirmed automatically</li>
                      <li>• Keep this page open for real-time updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading payment request...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


