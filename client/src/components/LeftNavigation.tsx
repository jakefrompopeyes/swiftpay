import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  HomeIcon,
  UserIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ChartBarIcon,
  WalletIcon,
  CurrencyDollarIcon,
  CogIcon,
  QrCodeIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  KeyIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
  EyeIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  id: string
  name: string
  href: string
  icon: any
  description?: string
  badge?: string
  badgeColor?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

export default function LeftNavigation() {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navigationSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          id: 'home',
          name: 'Home',
          href: '/',
          icon: HomeIcon,
          description: 'SwiftPay homepage'
        },
        {
          id: 'demo',
          name: 'Demo Mode',
          href: '/demo',
          icon: PlayCircleIcon,
          description: 'Explore without signing in',
          badge: 'NEW',
          badgeColor: 'bg-green-100 text-green-800'
        }
      ]
    },
    // Removed User Dashboard section per request
    {
      title: 'Merchant Tools',
      items: [
        {
          id: 'merchant-dashboard',
          name: 'Merchant Dashboard',
          href: '/merchant-dashboard',
          icon: BuildingStorefrontIcon,
          description: 'Business analytics'
        },
        {
          id: 'checkout-generator',
          name: 'Checkout Generator',
          href: '/checkout-generator',
          icon: QrCodeIcon,
          description: 'Create payment links'
        },
        {
          id: 'merchant-links',
          name: 'Payment Links',
          href: '/merchant-links',
          icon: DocumentTextIcon,
          description: 'View payment links'
        },
        {
          id: 'merchant-tools',
          name: 'Integration Tools',
          href: '/merchant-tools',
          icon: ShareIcon,
          description: 'Payment integration'
        },
        {
          id: 'merchant-payments',
          name: 'Access Funds',
          href: '/merchant-payments',
          icon: ArrowDownTrayIcon,
          description: 'Withdraw payments'
        },
        {
          id: 'vendor-wallets',
          name: 'Manage Wallets',
          href: '/vendor-wallets',
          icon: WalletIcon,
          description: 'Wallet management'
        }
      ]
    },
    {
      title: 'Payment Flow',
      items: [
        {
          id: 'payment-demo',
          name: 'Payment Demo',
          href: '/payment-demo',
          icon: BanknotesIcon,
          description: 'Demo payment flow'
        }
      ]
    },
    {
      title: 'Analytics & Tools',
      items: [
        {
          id: 'crypto-prices',
          name: 'Crypto Prices',
          href: '/crypto-prices',
          icon: ChartBarIcon,
          description: 'Live crypto prices'
        },
        {
          id: 'test-crypto-api',
          name: 'API Test',
          href: '/test-crypto-api',
          icon: CogIcon,
          description: 'Test CoinGecko API'
        }
      ]
    },
    {
      title: 'Authentication',
      items: [
        {
          id: 'login',
          name: 'Login',
          href: '/login',
          icon: UserIcon,
          description: 'User login'
        },
        {
          id: 'register',
          name: 'Register',
          href: '/register',
          icon: UserIcon,
          description: 'Create account'
        }
      ]
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/'
    }
    return router.pathname.startsWith(href)
  }

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="text-xl font-bold text-indigo-600">
              SwiftPay
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        active
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isCollapsed ? 'mx-auto' : 'mr-3'
                        } ${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                      />
                      
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{item.name}</span>
                            {item.badge && (
                              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>SwiftPay v1.0</p>
            <p className="mt-1">Crypto Payment Processor</p>
          </div>
        </div>
      )}
    </div>
  )
}

