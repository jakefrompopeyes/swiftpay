import { useState, useEffect } from 'react'
import Head from 'next/head'
import { backendAPI } from '../services/backendAPI'

export default function TestConnection() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...')
  const [cryptoData, setCryptoData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testBackendConnection()
  }, [])

  const testBackendConnection = async () => {
    try {
      // Test health endpoint
      const healthResponse = await backendAPI.public.getHealth()
      setBackendStatus(`✅ Backend connected: ${healthResponse.message}`)
      
      // Test crypto currencies endpoint
      const cryptoResponse = await backendAPI.public.getCryptocurrencies()
      setCryptoData(cryptoResponse.data)
      
    } catch (err: any) {
      setError(err.message)
      setBackendStatus('❌ Backend connection failed')
    }
  }

  return (
    <>
      <Head>
        <title>Test Connection - SwiftPay</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Backend Connection Test
            </h1>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Backend Status
                </h2>
                <p className="text-gray-700">{backendStatus}</p>
                {error && (
                  <p className="text-red-600 mt-2">Error: {error}</p>
                )}
              </div>

              {cryptoData && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Supported Cryptocurrencies
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cryptoData.map((crypto: any) => (
                      <div key={crypto.symbol} className="flex items-center space-x-3 p-3 bg-white rounded-md border">
                        <img 
                          src={crypto.logo} 
                          alt={crypto.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-crypto.png'
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{crypto.name}</p>
                          <p className="text-sm text-gray-500">{crypto.symbol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Next Steps
                </h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Test user registration and login</li>
                  <li>Test wallet creation</li>
                  <li>Test transaction creation</li>
                  <li>Deploy backend to production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


