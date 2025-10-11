import { useEffect, useState } from 'react'
import Head from 'next/head'
// Layout is applied globally in _app
import { backendAPI } from '../services/backendAPI'
import { LinkIcon, QrCodeIcon } from '@heroicons/react/24/outline'

interface PaymentRequest {
  id: string
  amount: string
  currency: string
  network: string
  description?: string
  status: string
  to_address: string
  created_at: string
  tx_hash?: string
}

export default function MerchantLinks() {
  const [items, setItems] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const res = await backendAPI.paymentRequests.list()
      if (res.success) setItems(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLinks() }, [])

  const openLink = (id: string) => {
    const base = window.location.origin
    const url = `${base}/pay/${id}`
    try { window.open(url, '_blank', 'noopener') } catch {}
  }

  return (
    <>
      <Head>
        <title>Payment Links - SwiftPay</title>
      </Head>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Links</h1>
            <p className="text-gray-600">View and manage your generated checkout links</p>
          </div>
          <button onClick={fetchLinks} className="px-3 py-2 border rounded-md text-sm">Refresh</button>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-500">No payment links yet</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"/>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((pr) => (
                  <tr key={pr.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(pr.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium">{pr.amount} {pr.currency}</td>
                    <td className="px-4 py-3 text-sm capitalize">{pr.network}</td>
                    <td className="px-4 py-3 text-sm font-mono">{pr.to_address.slice(0, 6)}…{pr.to_address.slice(-4)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${pr.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{pr.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="inline-flex items-center px-2 py-1 border rounded text-sm mr-2" onClick={() => openLink(pr.id)}>
                        <LinkIcon className="h-4 w-4 mr-1"/> Open
                      </button>
                      <button className="inline-flex items-center px-2 py-1 border rounded text-sm" onClick={() => openLink(pr.id)}>
                        <QrCodeIcon className="h-4 w-4 mr-1"/> QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}


