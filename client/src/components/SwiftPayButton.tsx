import { useState, useEffect } from 'react'
import Head from 'next/head'

interface SwiftPayButtonProps {
  amount?: number
  description?: string
  merchant?: string
  style?: 'primary' | 'secondary' | 'success' | 'outline'
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export default function SwiftPayButton({
  amount,
  description,
  merchant,
  style = 'primary',
  size = 'medium',
  text
}: SwiftPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => {
    setIsLoading(true)
    
    // Build checkout URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://swiftpay.com'
    const params = new URLSearchParams()
    
    if (amount) params.append('amount', amount.toString())
    if (description) params.append('description', description)
    if (merchant) params.append('merchant', merchant)
    
    const checkoutUrl = `${baseUrl}/checkout?${params.toString()}`
    
    // Redirect to checkout
    window.location.href = checkoutUrl
  }

  const getButtonText = () => {
    if (text) return text
    if (amount) return `Pay $${amount.toFixed(2)}`
    return 'Pay with Crypto'
  }

  const getButtonStyles = () => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    const styleClasses = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      outline: 'bg-transparent hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-600 focus:ring-indigo-500'
    }
    
    const sizeClasses = {
      small: 'px-3 py-2 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    }
    
    return `${baseStyles} ${styleClasses[style]} ${sizeClasses[size]}`
  }

  return (
    <>
      <Head>
        <title>SwiftPay Button Widget</title>
      </Head>
      
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={getButtonStyles()}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <span className="mr-2">💰</span>
            {getButtonText()}
          </>
        )}
      </button>
    </>
  )
}

// Widget initialization script for easy embedding
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SwiftPay = {
    Button: SwiftPayButton,
    init: () => {
      // Auto-initialize any SwiftPay buttons on the page
      const buttons = document.querySelectorAll('[data-swiftpay-button]')
      buttons.forEach((button) => {
        const amount = button.getAttribute('data-amount')
        const description = button.getAttribute('data-description')
        const merchant = button.getAttribute('data-merchant')
        const style = button.getAttribute('data-style') || 'primary'
        const size = button.getAttribute('data-size') || 'medium'
        
        // Replace the placeholder with actual SwiftPay button
        const buttonElement = document.createElement('div')
        buttonElement.innerHTML = `
          <a href="/checkout?amount=${amount || ''}&description=${description || ''}&merchant=${merchant || ''}" 
             class="swiftpay-button swiftpay-button-${style} swiftpay-button-${size}">
            Pay with SwiftPay
          </a>
        `
        
        button.parentNode?.replaceChild(buttonElement.firstChild!, button)
      })
    }
  }
}
