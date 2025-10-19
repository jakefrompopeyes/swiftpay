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
  const [recent, setRecent] = useState<any[]>([])

  const fetchLinks = async () => {
    setLoading(true)
    try {
      const res = await backendAPI.paymentRequests.list()
      if (res.success) setItems(res.data)
      else setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchRecent = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
      if (!token) return
      const r = await fetch('/api/merchant/stats', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await r.json()
      if (j?.success) setRecent(j.data?.recentTransactions || [])
    } catch {}
  }

  useEffect(() => {
    fetchLinks(); fetchRecent()
    const id = setInterval(() => { fetchLinks(); fetchRecent() }, 30000)
    return () => clearInterval(id)
  }, [])

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
          <div className="space-x-2">
            <button onClick={() => { fetchLinks(); fetchRecent() }} className="px-3 py-2 border rounded-md text-sm">Refresh</button>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('swiftpay_token')
                  if (!token) return
                  const r = await fetch('/api/payment-requests/expire-stale', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                  const j = await r.json().catch(() => null)
                  if (j?.success) {
                    console.log('Expired pending:', j?.data?.expired)
                  } else {
                    console.warn('Expire endpoint failed', j)
                  }
                  await fetchLinks(); await fetchRecent()
                } catch {}
              }}
              className="px-3 py-2 border rounded-md text-sm"
            >
              Expire Old Pending
            </button>
          </div>
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
                    <td className="px-4 py-3 text-sm capitalize">{pr.network || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono">{pr.to_address ? `${pr.to_address.slice(0, 6)}…${pr.to_address.slice(-4)}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pr.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : pr.status === 'failed' || pr.status === 'expired'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>{pr.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="inline-flex items-center px-2 py-1 border rounded text-sm mr-2" onClick={() => openLink(pr.id)}>
                        <LinkIcon className="h-4 w-4 mr-1"/> Open
                      </button>
                      <button className="inline-flex items-center px-2 py-1 border rounded text-sm mr-2" onClick={() => openLink(pr.id)}>
                        <QrCodeIcon className="h-4 w-4 mr-1"/> QR
                      </button>
                      <button className="inline-flex items-center px-2 py-1 border rounded text-sm" onClick={async()=>{
                        try{ const token=localStorage.getItem('swiftpay_token'); if(!token) return; await fetch('/api/webhooks/resend',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ paymentId: pr.id }) }); alert('Webhook resend triggered'); }catch{}
                      }}>Resend Webhook</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Recent Transactions */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Transactions</h3>
              <button onClick={() => { fetchLinks(); fetchRecent() }} className="px-2 py-1 text-xs border rounded-md">Refresh</button>
            </div>
            {recent && recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{t.description || 'Payment'}</div>
                      <div className="text-xs text-gray-500">{new Date(t.timestamp || t.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">${(t.amount || 0).toFixed ? t.amount.toFixed(2) : t.amount} {t.currency}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No recent transactions</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


