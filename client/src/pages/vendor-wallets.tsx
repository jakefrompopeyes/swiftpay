import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  WalletIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  QrCodeIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  TrashIcon,
  BeakerIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout'
import { backendAPI } from '../services/backendAPI'
import { cryptoLogoService } from '../services/cryptoLogos'
import toast from 'react-hot-toast'

interface Wallet {
  id: string;
  address: string;
  network: string;
  currency: string;
  created_at: string;
  balance?: string;
}

interface Network {
  network: string;
  name: string;
  currency: string;
  type: string;
  icon: string;
  description: string;
  testnet: boolean;
}

export default function VendorWallets() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum')
  const [showTestnets, setShowTestnets] = useState(false)
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [tokenBalances, setTokenBalances] = useState<Record<string, Record<string, string>>>({})
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [creatingLinkFor, setCreatingLinkFor] = useState<string | null>(null)
  const [cryptoLogos, setCryptoLogos] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('swiftpay_token')
    const userData = localStorage.getItem('swiftpay_user')

    if (!token || !userData) {
      // No auth: do not load any wallets; require login
      setWallets([])
      setIsLoading(false)
      return
    }

    fetchWallets()
    fetchNetworks()
  }, [router])

  const loadMockWallets = () => {
    // Remove mock wallets entirely
    setWallets([])
    setIsLoading(false)
  }

  const fetchWallets = async () => {
    try {
      setIsLoading(true)
      const response = await backendAPI.wallets.getWallets()
      if (response.success) {
        const baseWallets: Wallet[] = response.data
        setWallets(baseWallets)
        // Fetch balances for each base wallet
        await fetchAllBalances(baseWallets)
        // Fetch token balances (stablecoins) per base wallet
        await fetchStablecoinBalances(baseWallets)
        // Fetch logos for displayed currencies (native + stables)
        const currencies = Array.from(new Set([
          ...baseWallets.map(w => w.currency),
          'USDC','USDT','DAI'
        ]))
        setCryptoLogos(cryptoLogoService.getMultipleLogos(currencies))
      } else {
        toast.error('Failed to fetch wallets')
      }
    } catch (error: any) {
      console.error('Error fetching wallets:', error)
      toast.error(error.message || 'Failed to fetch wallets')
    } finally {
      setIsLoading(false)
    }
  }

  const supportsErc20Tokens = (network: string) => ['ethereum','polygon','base','arbitrum','binance','optimism','avalanche','fantom'].includes((network || '').toLowerCase())
  const supportsSplTokens = (network: string) => (network || '').toLowerCase() === 'solana'

  const chainIds: Record<string, number> = {
    ethereum: 1,
    arbitrum: 42161,
    polygon: 137,
    base: 8453,
    binance: 56,
    optimism: 10,
    avalanche: 43114,
    fantom: 250
  }

  const tokenRegistry: Record<string, Record<string, { address: string, decimals: number }>> = {
    ethereum: {
      USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
      DAI:  { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 }
    },
    base: {
      USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 }
    },
    arbitrum: {
      USDC: { address: '0xaf88d065e77c8CC2239327C5EDb3A432268e5831', decimals: 6 },
      USDT: { address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', decimals: 6 },
      DAI:  { address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', decimals: 18 }
    },
    polygon: {
      USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
      USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
      DAI:  { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimals: 18 }
    },
    binance: {
      USDC: { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
      USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
      DAI:  { address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18 }
    }
  }

  const toDisplay = (units: string, decimals: number) => {
    if (!units) return '0.0000'
    const neg = units.startsWith('-')
    const s = neg ? units.slice(1) : units
    const pad = s.padStart(decimals + 1, '0')
    const head = pad.slice(0, pad.length - decimals)
    const tail = pad.slice(pad.length - decimals)
    const num = `${neg ? '-' : ''}${head}.${tail}`
    const n = parseFloat(num)
    if (Number.isNaN(n)) return '0.0000'
    return n.toFixed(4)
  }

  const fetchStablecoinBalances = async (walletList: Wallet[]) => {
    const balancesMap: Record<string, Record<string, string>> = {}
    const etherscanKey = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || process.env.ETHERSCAN_API_KEY
    for (const w of walletList) {
      const net = (w.network || '').toLowerCase()
      balancesMap[w.id] = {}
      try {
        if (supportsErc20Tokens(net)) {
          const cid = chainIds[net]
          const baseUrl = 'https://api.etherscan.io/v2/api'
          for (const sym of ['USDC','USDT','DAI']) {
            const token = tokenRegistry[net]?.[sym]
            if (!token) continue
            const url = `${baseUrl}?chainid=${cid}&module=account&action=tokenbalance&address=${w.address}&contractaddress=${token.address}&tag=latest${etherscanKey ? `&apikey=${etherscanKey}` : ''}`
            const r = await fetch(url, { cache: 'no-store' })
            const j: any = await r.json().catch(() => null)
            const units = j?.result || '0'
            balancesMap[w.id][sym] = toDisplay(String(units), token.decimals)
          }
        } else if (supportsSplTokens(net)) {
          const rpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || (process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY}` : 'https://api.mainnet-beta.solana.com')
          const splMints: Record<string, { mint: string, decimals: number }> = {
            USDC: { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
            USDT: { mint: 'Es9vMFrzaCERG1bG1Nsx3Rp3XIanFkFJxux1kvZWS9G', decimals: 6 }
          }
          for (const sym of ['USDC','USDT'] as const) {
            const mint = splMints[sym]
            const body = {
              jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner', params: [w.address, { mint: mint.mint }, { encoding: 'jsonParsed' }]
            }
            const r = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
            const j: any = await r.json().catch(() => null)
            const value: any[] = j?.result?.value || []
            let sum = 0
            for (const v of value) {
              const amt = parseFloat(v?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0)
              sum += amt
            }
            balancesMap[w.id][sym] = (sum || 0).toFixed(4)
          }
        }
      } catch (e) {
        // ignore; balance stays undefined
      }
    }
    setTokenBalances(balancesMap)
  }

  const fetchCryptoLogos = (walletList: Wallet[]) => {
    try {
      const currencies = Array.from(new Set(walletList.map(w => w.currency).filter(currency => currency && typeof currency === 'string')))
      console.log('Currencies found:', currencies)
      if (currencies.length > 0) {
        const logos = cryptoLogoService.getMultipleLogos(currencies)
        console.log('Logos fetched:', logos)
        setCryptoLogos(logos)
      }
    } catch (error) {
      console.error('Error fetching crypto logos:', error)
      // Continue without logos - fallback icons will be used
    }
  }

  const fetchNetworks = async () => {
    try {
      const response = await backendAPI.wallets.getSupportedNetworks()
      if (response.success) {
        setNetworks(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching networks:', error)
    }
  }

  const fetchAllBalances = async (walletList: Wallet[]) => {
    const balancePromises = walletList.map(async (wallet: Wallet) => {
      try {
        const balanceResponse = await backendAPI.wallets.getBalance(wallet.id)
        return { walletId: wallet.id, balance: balanceResponse.data.balance }
      } catch (error) {
        return { walletId: wallet.id, balance: '0.0000' }
      }
    })
    
    const fetchedBalances = await Promise.all(balancePromises)
    const balancesMap = fetchedBalances.reduce((acc, item) => {
      acc[item.walletId] = item.balance
      return acc
    }, {} as Record<string, string>)
    setBalances(balancesMap)
  }

  const createWallet = async () => {
    try {
      setIsCreatingWallet(true)
      const response = await backendAPI.wallets.createWallet(selectedNetwork)
      if (response.success) {
        toast.success(`${selectedNetwork.toUpperCase()} wallet created successfully!`)
        fetchWallets() // Refresh the wallet list
      } else {
        toast.error('Failed to create wallet')
      }
    } catch (error: any) {
      console.error('Error creating wallet:', error)
      toast.error(error.message || 'Failed to create wallet')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const createMissingWallets = async () => {
    try {
      setIsCreatingWallet(true)
      const response = await fetch('/api/wallets/create-missing', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('swiftpay_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        fetchWallets() // Refresh the wallet list
      } else {
        toast.error(result.error || 'Failed to create missing wallets')
      }
    } catch (error: any) {
      console.error('Error creating missing wallets:', error)
      toast.error(error.message || 'Failed to create missing wallets')
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const deleteWallet = async (walletId: string) => {
    if (!confirm('Are you sure you want to delete this wallet? This action cannot be undone.')) {
      return
    }
    try {
      await backendAPI.wallets.deleteWallet(walletId)
      toast.success('Wallet deleted successfully!')
      fetchWallets() // Refresh the wallet list
    } catch (error: any) {
      console.error('Error deleting wallet:', error)
      toast.error(error.message || 'Failed to delete wallet')
    }
  }

  const refreshBalances = async () => {
    setIsRefreshingBalances(true)
    await fetchAllBalances(wallets)
    toast.success('Balances refreshed!')
    setIsRefreshingBalances(false)
  }

  const requestFaucet = async (walletId: string, network: string) => {
    try {
      const response = await backendAPI.wallets.requestFaucet(walletId, 'eth')
      if (response.success) {
        toast.success('Faucet funds requested! Check the transaction:', {
          duration: 5000
        })
        // Refresh balances after faucet
        setTimeout(() => refreshBalances(), 3000)
      } else {
        toast.error('Failed to request faucet funds')
      }
    } catch (error: any) {
      console.error('Error requesting faucet:', error)
      toast.error(error.message || 'Failed to request faucet funds')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const copyToClipboardSafe = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Payment link copied to clipboard')
      return
    } catch (err) {
      try {
        const tmp = document.createElement('textarea')
        tmp.value = text
        tmp.style.position = 'fixed'
        tmp.style.opacity = '0'
        document.body.appendChild(tmp)
        tmp.focus()
        tmp.select()
        document.execCommand('copy')
        document.body.removeChild(tmp)
        toast.success('Payment link copied')
        return
      } catch (e) {
        // As a final fallback, show the URL so the user can copy manually
        window.prompt('Copy payment link:', text)
      }
    }
  }

  const getCryptoLogo = (currency: string | undefined | null) => {
    const logo = cryptoLogoService.getLogoUrl(currency)
    return logo
  }

  const getNetworkIcon = (network: string) => {
    const iconMap: Record<string, string> = {
      'ethereum': '🔷',
      'bitcoin': '🟠', 
      'solana': '🟣',
      'tron': '🔴',
      'bsc': '🟡',
      'polygon': '🟣',
      'base': '🔵',
      'arbitrum': '🔴'
    }
    return iconMap[network] || '🔷'
  }

  const getCurrencyIcon = (currency: string | undefined | null) => {
    if (!currency) return '🔷'
    const iconMap: Record<string, string> = {
      'ETH': '🔷',
      'BTC': '🟠',
      'SOL': '🟣',
      'TRX': '🔴',
      'BNB': '🟡',
      'MATIC': '🟣',
      'USDC': '🔵',
      'USDT': '🟢',
      'DAI': '🟡'
    }
    return iconMap[currency.toUpperCase()] || '🔷'
  }

  const getNetworkName = (network: string) => {
    const nameMap: Record<string, string> = {
      'ethereum': 'Ethereum',
      'bitcoin': 'Bitcoin',
      'solana': 'Solana', 
      'tron': 'TRON',
      'bsc': 'BNB Smart Chain',
      'polygon': 'Polygon',
      'base': 'Base',
      'arbitrum': 'Arbitrum'
    }
    return nameMap[network] || network
  }

  const getCurrencyName = (currency: string | undefined | null, network: string) => {
    if (!currency) return getNetworkName(network)
    const nameMap: Record<string, string> = {
      'ETH': 'Ethereum',
      'BTC': 'Bitcoin',
      'SOL': 'Solana',
      'TRX': 'TRON',
      'BNB': 'BNB',
      'MATIC': 'Polygon',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'DAI': 'Dai Stablecoin'
    }
    return nameMap[currency.toUpperCase()] || getNetworkName(network)
  }

  const filteredNetworks = networks.filter(network => 
    showTestnets ? network.testnet : !network.testnet
  )

  const totalBalance = Object.values(balances).reduce((sum, balance) => {
    return sum + parseFloat(balance || '0')
  }, 0)

  return (
    <>
      <Head>
        <title>Wallet Management - SwiftPay</title>
        <meta name="description" content="Manage your cryptocurrency wallets with Coinbase Cloud" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Wallet Management</h1>
                <p className="mt-2 text-gray-600">
                  Secure cryptocurrency wallets powered by Coinbase Cloud Server Wallets v2
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshBalances}
                  disabled={isRefreshingBalances}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                  Refresh Balances
                </button>
                <button
                  onClick={createMissingWallets}
                  disabled={isCreatingWallet}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Create Missing Wallets
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <WalletIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Wallets</dt>
                      <dd className="text-lg font-medium text-gray-900">{wallets.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalBalance.toFixed(4)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Security</dt>
                      <dd className="text-lg font-medium text-gray-900">Coinbase Cloud</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GlobeAltIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Networks</dt>
                      <dd className="text-lg font-medium text-gray-900">{networks.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {/* Auto-Created Wallets Info */}
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <SparklesIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Auto-Created Wallets
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          Your account comes with pre-configured wallets for major cryptocurrencies:
                          <span className="font-semibold"> Bitcoin, Ethereum, Solana, TRON, and BNB</span>
                        </p>
                        <p className="mt-1">
                          These wallets are ready to use immediately and secured by Coinbase Cloud infrastructure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallets List */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-12">
                  <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No wallets</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating your first wallet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                              <img 
                                src={getCryptoLogo(wallet.currency)}
                                alt={`${wallet.currency} logo`}
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = target.nextElementSibling as HTMLSpanElement
                                  if (fallback) fallback.style.display = 'block'
                                }}
                              />
                              <span className="text-2xl" style={{ display: 'none' }}>
                                {getCurrencyIcon(wallet.currency)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {getCurrencyName(wallet.currency, wallet.network)} Wallet
                              </h4>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                Coinbase Cloud
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                Auto-Created
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 font-mono">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Created {new Date(wallet.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-medium text-gray-900">
                              {balances[wallet.id] || '0.0000'} {wallet.currency}
                            </p>
                            <p className="text-sm text-gray-500">Balance</p>
                            {/* Stablecoin balances (if any) */}
                            {tokenBalances[wallet.id] && (
                              <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                                {Object.entries(tokenBalances[wallet.id]).map(([sym, bal]) => (
                                  <div key={`${wallet.id}-${sym}`} className="flex justify-end">
                                    <span>{sym}: {bal}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Toggle Details"
                            >
                              {expandedWallet === wallet.id ? (
                                <EyeSlashIcon className="h-5 w-5" />
                              ) : (
                                <EyeIcon className="h-5 w-5" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => copyToClipboard(wallet.address)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Copy Address"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={async () => {
                                const token = localStorage.getItem('swiftpay_token')
                                if (!token) {
                                  toast.error('Please log in to create payment links')
                                  return
                                }
                                setCreatingLinkFor(wallet.id)
                                try {
                                  const result = await backendAPI.paymentRequests.create('1', wallet.currency)
                                  if (result.success && result.data?.checkoutUrl) {
                                    const url = result.data.checkoutUrl as string
                                    console.log('Payment link:', url)
                                    await copyToClipboardSafe(url)
                                    try { window.open(url, '_blank', 'noopener') } catch {}
                                  } else {
                                    toast.error(result.error || 'Failed to create link')
                                  }
                                } catch (err: any) {
                                  console.error('Create payment link error:', err)
                                  toast.error(err.message || 'Failed to create link')
                                } finally {
                                  setCreatingLinkFor(null)
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Create Payment Link"
                            >
                              <LinkIcon className="h-5 w-5" />
                            </button>

                            <button
                              onClick={() => setShowQRCode(showQRCode === wallet.id ? null : wallet.id)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Show QR Code"
                            >
                              <QrCodeIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => deleteWallet(wallet.id)}
                              className="p-2 text-red-400 hover:text-red-600"
                              title="Delete Wallet"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedWallet === wallet.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Wallet Details</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Address:</span>
                                  <span className="text-sm font-mono text-gray-900">{wallet.address}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Network:</span>
                                  <span className="text-sm text-gray-900">{getNetworkName(wallet.network)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Currency:</span>
                                  <span className="text-sm text-gray-900">{wallet.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-500">Created:</span>
                                  <span className="text-sm text-gray-900">
                                    {new Date(wallet.created_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">Actions</h5>
                              <div className="space-y-2">
                                <button
                                  onClick={() => requestFaucet(wallet.id, wallet.network)}
                                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                >
                                  <BeakerIcon className="h-4 w-4 mr-2" />
                                  Request Test Funds
                                </button>
                                
                                <button
                                  onClick={() => copyToClipboard(wallet.address)}
                                  className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                                  Copy Address
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* QR Code Modal */}
                      {showQRCode === wallet.id && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <h5 className="text-sm font-medium text-gray-900 mb-4">Wallet QR Code</h5>
                            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                                <QrCodeIcon className="h-24 w-24 text-gray-400" />
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Scan to send funds to this wallet
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}