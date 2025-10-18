import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import QRCode from 'qrcode'
import { realtime, ServerEvent } from '../../services/realtime'
import { cryptoLogoService } from '../../services/cryptoLogos'
import { getTokenInfo, toBaseUnits } from '../../lib/tokens'
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
  const [loadError, setLoadError] = useState<string | null>(null)
  const [options, setOptions] = useState<{ wallets: any[] } | null>(null)
  const [qr, setQr] = useState<string>('')
  const [status, setStatus] = useState<string>('pending')
  const [selectedWallet, setSelectedWallet] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [usdAmount, setUsdAmount] = useState<number | null>(null)
  const [currentAmount, setCurrentAmount] = useState<number | null>(null)
  const [refreshIntervalSec] = useState<number>(60)
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60)
  const [lastPriceTs, setLastPriceTs] = useState<number | null>(null)
  const stableSet = new Set(['USDC','USDT','DAI'])

  const getEvmChainId = (network: string | undefined | null): number | null => {
    switch ((network || '').toLowerCase()) {
      case 'ethereum': return 1
      case 'binance': return 56
      case 'polygon': return 137
      case 'base': return 8453
      case 'arbitrum': return 42161
      default: return null
    }
  }

  const buildPaymentUri = (network: string, address: string, amount: number, currency: string) => {
    const isSol = (network || '').toLowerCase() === 'solana'
    const chainId = isSol ? null : getEvmChainId(network)
    const symbol = (currency || '').toUpperCase()

    if (isSol) {
      const token = getTokenInfo('solana', symbol)
      if (token && token.standard === 'spl') {
        const units = toBaseUnits(amount, token.decimals)
        return `solana:${address}?amount=${amount}&spl-token=${token.address}&reference=${units}`
      }
      return `solana:${address}?amount=${amount}`
    }

    const token = getTokenInfo((network || '').toLowerCase(), symbol)
    if (token && token.standard === 'erc20') {
      const atChain = chainId ? `@${chainId}` : ''
      const units = toBaseUnits(amount, token.decimals)
      return `ethereum:${token.address}${atChain}/transfer?address=${address}&uint256=${units}`
    }

    // Bitcoin / Monero / native ETH-like
    const net = (network || '').toLowerCase()
    if (net === 'bitcoin') {
      // BIP21 URI
      return `bitcoin:${address}?amount=${amount}`
    }
    if (net === 'monero') {
      // Monero URI (amount in XMR)
      return `monero:${address}?tx_amount=${amount}`
    }
    const atChain = chainId ? `@${chainId}` : ''
    const wei = toBaseUnits(amount, 18)
    return `ethereum:${address}${atChain}?value=${wei}`
  }

  const fetchWithRetry = async (url: string, options?: RequestInit, attempts = 12, delayMs = 400): Promise<any> => {
    for (let i = 0; i < attempts; i++) {
      try {
        const cacheBust = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`
        const r = await fetch(`${url}${cacheBust}`, { ...options, cache: 'no-store' })
        const j = await r.json().catch(() => ({ success: false }))
        if (j && j.success) return j
        // If 404/not found, wait and retry to handle read-after-write latency
        await new Promise(res => setTimeout(res, delayMs * (i + 1)))
      } catch {
        await new Promise(res => setTimeout(res, delayMs * (i + 1)))
      }
    }
    return { success: false, error: 'Payment request not found' }
  }

  useEffect(() => {
    if (!id) return
    fetchWithRetry(`/api/payment-requests/${id}`)
      .then(async (j) => {
        if (j?.success) {
          setData(j.data)
          const uri = buildPaymentUri(j.data.network, j.data.to_address, j.data.amount, j.data.currency)
          setQr(await QRCode.toDataURL(uri))
        } else {
          setLoadError(j?.error || 'Payment request not found')
        }
      })

    // load merchant wallets (accepted currencies)
    fetchWithRetry(`/api/payment-requests/${id}/options`)
      .then((j) => {
        if (j.success) {
          setOptions(j.data)
          if (j.data.wallets && j.data.wallets.length > 0) {
            const first = j.data.wallets[0]
            setSelectedWallet(first)
            // Persist default selection immediately so admin views reflect correct coin/network
            try {
              fetch(`/api/payment-requests/${id}/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ network: first.network, address: first.address, currency: first.currency })
              })
            } catch {}
          }
        }
      })

    // load prices for USD conversion
    fetch('/api/prices', { cache: 'no-store' })
      .then(r => r.json())
      .then((res) => {
        if (res.success) {
          setPrices(res.data || {})
          setLastPriceTs(Date.now())
        }
      })

    // start realtime listener
    realtime.connect()
    const off = realtime.on((evt: ServerEvent) => {
      if (evt.type === 'payment_request_updated' && evt.id === id) {
        setStatus(evt.status)
      }
    })

    const timer = setInterval(async () => {
      const r = await fetch(`/api/payment-requests/${id}/status`)
      const j = await r.json()
      if (j.success) {
        setStatus(j.data.status)
        if (j.data.status === 'completed') clearInterval(timer)
      }
      // opportunistic chain check for auto-complete
      if (j.success && j.data.status !== 'completed') {
        try {
          await fetch(`/api/payment-requests/${id}/check-chain`, { method: 'POST', credentials: 'include' })
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
    const symbol = (wallet.currency?.toUpperCase?.() === 'POL') ? 'MATIC' : wallet.currency?.toUpperCase?.()
    const price = prices[symbol as string] || 0
    const amountToPay = usdAmount && price > 0 ? usdAmount / price : data.amount
    setCurrentAmount(amountToPay)
    const uri = buildPaymentUri(wallet.network, wallet.address, amountToPay, wallet.currency)
    setQr(await QRCode.toDataURL(uri))

    // Persist the selection back to the payment request so monitoring uses correct chain/address
    try {
      await fetch(`/api/payment-requests/${id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network: wallet.network, address: wallet.address, currency: wallet.currency, amount: amountToPay })
      })
    } catch {}

    // Update URL query with currency for shareability (optional, non-blocking)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('currency', String(wallet.currency).toUpperCase())
      window.history.replaceState({}, '', url.toString())
    } catch {}
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
    const baseSymbol = (data.currency?.toUpperCase?.() === 'POL') ? 'MATIC' : data.currency?.toUpperCase?.()
    const price = prices[baseSymbol as string] || 0
    if (price > 0) {
      const usd = parseFloat(String(data.amount)) * price
      setUsdAmount(usd)
      if (selectedWallet) {
        const selSymbol = (selectedWallet.currency?.toUpperCase?.() === 'POL') ? 'MATIC' : selectedWallet.currency?.toUpperCase?.()
        const selPrice = prices[selSymbol as string] || 0
        const amt = selPrice > 0 ? usd / selPrice : data.amount
        setCurrentAmount(amt)
      } else {
        setCurrentAmount(data.amount)
      }
    }
  }, [data, prices, selectedWallet])

  // Auto-refresh prices and QR periodically to keep quotes current
  const refreshPricesAndQR = async () => {
    try {
      const r = await fetch('/api/prices', { cache: 'no-store' })
      const res = await r.json()
      if (res.success) {
        const newPrices = res.data || {}
        setPrices(newPrices)
        setLastPriceTs(Date.now())
        if (data) {
          const baseSymbol = (data.currency?.toUpperCase?.() === 'POL') ? 'MATIC' : data.currency?.toUpperCase?.()
          const basePrice = newPrices[baseSymbol as string] || 0
          const usd = basePrice > 0 ? parseFloat(String(data.amount)) * basePrice : null
          if (usd != null) setUsdAmount(usd)

          const wallet = selectedWallet
          if (wallet) {
            const selSymbol = (wallet.currency?.toUpperCase?.() === 'POL') ? 'MATIC' : wallet.currency?.toUpperCase?.()
            const selPrice = newPrices[selSymbol as string] || 0
            const amt = (usd != null && selPrice > 0) ? usd / selPrice : data.amount
            setCurrentAmount(amt)
            const uri = buildPaymentUri(wallet.network, wallet.address, amt, wallet.currency)
            setQr(await QRCode.toDataURL(uri))
          }
        }
      }
    } catch {}
  }

  useEffect(() => {
    // countdown and periodic refresh
    setNextRefreshIn(refreshIntervalSec)
    const tick = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          // time to refresh
          refreshPricesAndQR()
          return refreshIntervalSec
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshIntervalSec, selectedWallet, data?.id])

  return (
    <>
      <Head>
        <title>Payment Request - {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}</title>
        <meta name="description" content="Secure cryptocurrency payment" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loadError ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <p className="text-red-600 font-medium mb-2">{loadError}</p>
                <button
                  onClick={() => router.reload()}
                  className="mt-2 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel: Cryptocurrency Selection */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <QrCodeIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Choose Payment Method
                  </h2>
                  
                  <div className="space-y-3">
                    {(() => {
                      const wallets = (options?.wallets || [])
                      // Group stablecoins by currency
                      const groups: Record<string, any[]> = {}
                      const others: any[] = []
                      for (const w of wallets) {
                        const sym = (w.currency || '').toUpperCase()
                        if (stableSet.has(sym)) {
                          groups[sym] = groups[sym] || []
                          groups[sym].push(w)
                        } else {
                          others.push(w)
                        }
                      }

                      const stableCards = Object.keys(groups).map((sym) => {
                        const variants = groups[sym]
                        const current = (selectedWallet && selectedWallet.currency?.toUpperCase() === sym)
                          ? selectedWallet
                          : variants[0]
                        const isSelected = selectedWallet?.currency?.toUpperCase() === sym
                        const logoUrl = cryptoLogoService.getLogoUrl(sym)
                        const hasLogo = cryptoLogoService.hasLogoUrl(sym)
                        return (
                          <div
                            key={`stable-${sym}`}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  {hasLogo ? (
                                    <img src={logoUrl} alt={`${sym} logo`} className="w-10 h-10 rounded-full" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: '#f3f4f6' }}>
                                      {cryptoLogoService.getLogoUrl(sym)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">{sym}</span>
                                    <select
                                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md"
                                      value={`${current.network}`}
                                      onChange={(e) => {
                                        const next = variants.find(v => String(v.network) === e.target.value) || variants[0]
                                        handleWalletSelect(next)
                                      }}
                                    >
                                      {variants.map(v => (
                                        <option key={`${sym}-${v.network}`} value={v.network}>{v.network}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="text-sm text-gray-500 font-mono">
                                    {current.address.slice(0, 8)}...{current.address.slice(-6)}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleWalletSelect(current)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
                                }`}
                              >
                                {isSelected ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </div>
                        )
                      })

                      const otherCards = others.map((wallet) => {
                        const isSelected = selectedWallet?.id === wallet.id && selectedWallet?.currency === wallet.currency
                        const logoUrl = cryptoLogoService.getLogoUrl(wallet.currency)
                        const hasLogo = cryptoLogoService.hasLogoUrl(wallet.currency)
                        return (
                          <div
                            key={`${wallet.id}-${wallet.currency}`}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                              isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleWalletSelect(wallet)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  {hasLogo ? (
                                    <img src={logoUrl} alt={`${wallet.currency} logo`} className="w-10 h-10 rounded-full" />
                                  ) : null}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${hasLogo ? 'hidden' : 'flex'}`} style={{ backgroundColor: '#f3f4f6' }}>
                                    {cryptoLogoService.getLogoUrl(wallet.currency)}
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-gray-900">{wallet.currency}</span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{wallet.network}</span>
                                  </div>
                                  <div className="text-sm text-gray-500 font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}</div>
                                </div>
                              </div>
                              <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'}`}>
                                {isSelected ? 'Selected' : 'Select'}
                              </div>
                            </div>
                          </div>
                        )
                      })

                      return (
                        <>
                          {stableCards}
                          {otherCards}
                        </>
                      )
                    })()}
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
                    <div className="text-xs text-gray-500 mb-1">
                      Price auto-refresh in {nextRefreshIn}s
                      {lastPriceTs && (
                        <span className="ml-2">• Last updated {Math.max(0, Math.floor((Date.now() - lastPriceTs) / 1000))}s ago</span>
                      )}
                      <button
                        onClick={refreshPricesAndQR}
                        className="ml-2 underline text-indigo-600 hover:text-indigo-800"
                      >
                        Refresh now
                      </button>
                    </div>
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

// Remove app-wide Layout wrapper on this page (no sidebar/navigation)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(PayRequest as any).getLayout = (page: React.ReactElement) => page


