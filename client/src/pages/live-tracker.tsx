import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'

type Pending = {
  id: string
  amount: number
  currency: string
  network: string
  to_address: string
  created_at: string
}

type RowState = {
  status: 'pending' | 'checking' | 'confirmed' | 'failed' | 'expired'
  confirmations?: number
  lastCheckedAt?: number
  txHash?: string | null
  error?: string | null
}

export default function LiveTracker() {
  const [items, setItems] = useState<Pending[]>([])
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [loading, setLoading] = useState(true)
  const [pollMs, setPollMs] = useState(10000)

  const loadPendings = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
      if (!token) return
      const r = await fetch('/api/payment-requests/pending', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await r.json()
      if (j?.success) setItems(j.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  const checkOne = useCallback(async (p: Pending) => {
    setRows((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || { status: 'pending' }), status: 'checking', lastCheckedAt: Date.now() } }))
    try {
      const r = await fetch('/api/payment-requests/' + encodeURIComponent(p.id) + '/check-chain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId: p.id }) })
      const j = await r.json().catch(() => null)
      if (!j?.success) {
        setRows((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || { status: 'pending' }), status: 'pending', error: j?.error || 'check failed', lastCheckedAt: Date.now() } }))
        return
      }
      // j.data may contain status; our backend flips to completed internally when tx found
      setRows((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), status: j?.data?.status || 'pending', lastCheckedAt: Date.now(), txHash: j?.data?.txHash || null } }))
    } catch (e: any) {
      setRows((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || { status: 'pending' }), status: 'pending', error: e?.message || 'error', lastCheckedAt: Date.now() } }))
    }
  }, [])

  useEffect(() => {
    loadPendings()
    const id = setInterval(loadPendings, pollMs)
    return () => clearInterval(id)
  }, [loadPendings, pollMs])

  useEffect(() => {
    // whenever items refresh, kick off checks for each
    if (!items || items.length === 0) return
    items.forEach((p) => { void checkOne(p) })
  }, [items, checkOne])

  const networks = useMemo(() => {
    const map: Record<string, number> = {}
    for (const i of items) map[i.network || 'unknown'] = (map[i.network || 'unknown'] || 0) + 1
    return map
  }, [items])

  return (
    <>
      <Head>
        <title>Live Tracker - SwiftPay</title>
      </Head>
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Tracker</h1>
            <p className="text-gray-600">Real-time monitoring of pending transactions and confirmations</p>
          </div>
          <div className="space-x-2">
            <label className="text-sm text-gray-600">Poll:</label>
            <select value={pollMs} onChange={(e)=>setPollMs(parseInt(e.target.value,10))} className="px-2 py-1 border rounded text-sm">
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={15000}>15s</option>
              <option value={30000}>30s</option>
            </select>
            <button onClick={loadPendings} className="px-3 py-2 border rounded-md text-sm">Refresh</button>
            <button
              className="px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700"
              onClick={async()=>{
                try{
                  const r=await fetch('/api/payment-requests/expire-manual',{method:'POST'})
                  const j=await r.json().catch(()=>null)
                  if(j?.success){
                    alert(`Expired ${j.data?.expired||0} (of ${j.data?.totalPending||0})`)
                    await loadPendings()
                  } else {
                    alert(j?.error||'Failed to expire')
                  }
                }catch(e:any){ alert(e?.message||'Error') }
              }}
            >Expire &gt;5m</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(networks).map(([net, cnt]) => (
            <div key={net} className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-500">{net}</div>
              <div className="text-2xl font-semibold">{cnt}</div>
              <div className="text-xs text-gray-400">pending</div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracker</th>
                <th className="px-4 py-3"/>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={7}>Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td className="px-4 py-6 text-gray-500" colSpan={7}>No pending transactions</td></tr>
              ) : items.map((p) => {
                const s = rows[p.id] || { status: 'pending' }
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm capitalize">{p.network || '-'}</td>
                    <td className="px-4 py-3 text-sm">{p.currency}</td>
                    <td className="px-4 py-3 text-sm font-medium">{p.amount}</td>
                    <td className="px-4 py-3 text-xs font-mono">{p.to_address ? `${p.to_address.slice(0, 6)}…${p.to_address.slice(-4)}` : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        s.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        s.status === 'failed' || s.status === 'expired' ? 'bg-rose-100 text-rose-700' :
                        s.status === 'checking' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {s.status}
                      </span>
                      {s.txHash ? (
                        <div className="text-[11px] text-gray-500 mt-1">tx: {s.txHash.slice(0,8)}…{s.txHash.slice(-6)}</div>
                      ) : null}
                      {s.lastCheckedAt ? (
                        <div className="text-[11px] text-gray-400">checked {new Date(s.lastCheckedAt).toLocaleTimeString()}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="px-2 py-1 border rounded text-xs" onClick={()=>checkOne(p)}>Check now</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}


