import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { CogIcon, CheckCircleIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'

interface Settings {
  company_name?: string | null
  support_email?: string | null
  website_url?: string | null
  webhook_url?: string | null
  webhook_secret?: string | null
  branding_primary?: string | null
  branding_secondary?: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [customWallets, setCustomWallets] = useState<Array<{id:string,address:string,network:string,currency?:string,is_active:boolean}>>([])
  const [newCW, setNewCW] = useState<{network:string,address:string,currency?:string}>({ network: 'ethereum', address: '' })
  const [keys, setKeys] = useState<Array<{id:string,name:string,created_at:string,last_used_at:string|null}>>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookResult, setWebhookResult] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<Array<{id:string,payment_id:string,url:string,response_code:number|null,success:boolean,attempt_count:number,created_at:string}>>([])
  const [loadingDeliveries, setLoadingDeliveries] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
        if (!token) { setError('Please log in'); setLoading(false); return }
        const [r, rk] = await Promise.all([
          fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
          fetch('/api/keys', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        ])
        const j = await r.json(); const jk = await rk.json()
        if (j.success) setSettings(j.data || {}); else setError(j.error || 'Failed to load settings')
        if (jk.success) setKeys(jk.data || [])
      } catch (e) { setError('Failed to load settings') }
      finally { setLoading(false) }
    }
    load()
    // Load custom wallets
    ;(async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
        if (!token) return
        const r = await fetch('/api/settings/wallets-custom', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const j = await r.json(); if (j?.success) setCustomWallets(j.data || [])
      } catch {}
    })()
  }, [])

  const onChange = (key: keyof Settings, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  const save = async () => {
    try {
      setSaving(true); setSaved(false)
      const token = localStorage.getItem('swiftpay_token')
      const r = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings)
      })
      const j = await r.json()
      if (!j.success) throw new Error(j.error || 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setError(e.message || 'Failed to save settings')
    } finally { setSaving(false) }
  }

  const createKey = async () => {
    if (!newKeyName.trim()) return
    const token = localStorage.getItem('swiftpay_token')
    const r = await fetch('/api/keys', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: newKeyName.trim() }) })
    const j = await r.json()
    if (j.success) {
      setNewKeyPlain(j.data.key)
      setNewKeyName('')
      // reload list
      const rk = await fetch('/api/keys', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const jk = await rk.json(); if (jk.success) setKeys(jk.data || [])
    } else {
      setError(j.error || 'Failed to create key')
    }
  }

  const deleteKey = async (id: string) => {
    const token = localStorage.getItem('swiftpay_token')
    const r = await fetch('/api/keys', { method: 'DELETE', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id }) })
    const j = await r.json(); if (!j.success) { setError(j.error || 'Failed to delete key'); return }
    setKeys((arr) => arr.filter(k => k.id !== id))
  }

  const sendTestWebhook = async () => {
    try {
      setTestingWebhook(true); setWebhookResult(null)
      const token = localStorage.getItem('swiftpay_token')
      const r = await fetch('/api/settings/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: settings.webhook_url, secret: settings.webhook_secret })
      })
      const j = await r.json()
      if (j.success) setWebhookResult(`Status ${j.data.status}: ${j.data.body?.slice(0,120) || ''}`)
      else setWebhookResult(j.error || 'Failed')
    } catch (e:any) {
      setWebhookResult(e.message || 'Failed')
    } finally { setTestingWebhook(false) }
  }

  const loadDeliveries = async () => {
    try {
      setLoadingDeliveries(true)
      const token = localStorage.getItem('swiftpay_token')
      const r = await fetch('/api/webhooks/list?limit=50', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const j = await r.json(); if (j?.success) setDeliveries(j.data || [])
    } catch {}
    finally { setLoadingDeliveries(false) }
  }

  return (
    <>
      <Head>
        <title>Settings - {process.env.NEXT_PUBLIC_SITE_NAME || 'SwiftSpace'}</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="ml-4 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                  SETTINGS
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/merchant-dashboard" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                  Merchant Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-2 text-gray-600">Manage branding, webhooks, and contact info</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-64">
              <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-rose-50 text-rose-700 border border-rose-200">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Company */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Company</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Company Name</label>
                    <input value={settings.company_name || ''} onChange={(e)=>onChange('company_name', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Support Email</label>
                    <input value={settings.support_email || ''} onChange={(e)=>onChange('support_email', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Website URL</label>
                    <input value={settings.website_url || ''} onChange={(e)=>onChange('website_url', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
              </section>

              {/* Webhooks */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Webhooks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Webhook URL</label>
                    <input value={settings.webhook_url || ''} onChange={(e)=>onChange('webhook_url', e.target.value)} placeholder="https://example.com/api/webhooks/payment-status" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Webhook Secret</label>
                    <input value={settings.webhook_secret || ''} onChange={(e)=>onChange('webhook_secret', e.target.value)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
                <div className="mt-3 flex items-center space-x-2">
                  <button onClick={sendTestWebhook} disabled={!settings.webhook_url || testingWebhook} className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-sm">
                    {testingWebhook ? 'Sending…' : 'Send Test Event'}
                  </button>
                  {webhookResult && <span className="text-xs text-gray-600">{webhookResult}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-2">We'll sign events with HMAC SHA-256 using this secret.</p>

                {/* Delivery log */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900">Recent Deliveries</h3>
                    <div className="flex items-center space-x-2">
                      <input id="wh_filter_payment" placeholder="payment id" className="px-2 py-1 border rounded text-xs" />
                      <select id="wh_filter_success" className="px-2 py-1 border rounded text-xs">
                        <option value="">All</option>
                        <option value="true">Delivered</option>
                        <option value="false">Failed</option>
                      </select>
                      <input id="wh_filter_from" type="datetime-local" className="px-2 py-1 border rounded text-xs" />
                      <input id="wh_filter_to" type="datetime-local" className="px-2 py-1 border rounded text-xs" />
                      <button onClick={async()=>{
                        try{
                          const token=localStorage.getItem('swiftpay_token');
                          const pid=(document.getElementById('wh_filter_payment') as HTMLInputElement).value
                          const succ=(document.getElementById('wh_filter_success') as HTMLSelectElement).value
                          const from=(document.getElementById('wh_filter_from') as HTMLInputElement).value
                          const to=(document.getElementById('wh_filter_to') as HTMLInputElement).value
                          const params=new URLSearchParams(); if(pid) params.set('paymentId',pid); if(succ) params.set('success',succ); if(from) params.set('from',new Date(from).toISOString()); if(to) params.set('to',new Date(to).toISOString());
                          const r=await fetch(`/api/webhooks/list?${params.toString()}`,{ headers:{ Authorization:`Bearer ${token}` }, cache:'no-store' });
                          const j=await r.json(); if(j?.success) setDeliveries(j.data||[])
                        }catch{}
                      }} className="text-xs px-2 py-1 border rounded">Apply</button>
                      <button onClick={loadDeliveries} className="text-xs px-2 py-1 border rounded">Refresh</button>
                    </div>
                  </div>
                  <div className="border rounded-md divide-y">
                    {loadingDeliveries ? (
                      <div className="p-3 text-sm text-gray-500">Loading…</div>
                    ) : deliveries.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No deliveries</div>
                    ) : deliveries.map((d)=> (
                      <div key={d.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-mono">{d.payment_id}</div>
                          <div className="text-xs text-gray-500">{new Date(d.created_at).toLocaleString()} • {d.response_code ?? '-'} • {d.url}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${d.success? 'bg-green-100 text-green-700':'bg-rose-100 text-rose-700'}`}>{d.success? 'Delivered':'Failed'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Checkout Settings */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Checkout Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price lock (seconds)</label>
                    <input id="sp_price_lock_sec" type="number" min={30} step={10} defaultValue={parseInt(String(process.env.NEXT_PUBLIC_PRICE_LOCK_SEC || '120'),10)} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auto re-quote on expiry</label>
                    <select id="sp_auto_requote" defaultValue={(process.env.NEXT_PUBLIC_AUTO_REQUOTE||'1')==='0'?'0':'1'} className="w-full px-3 py-2 border rounded-md">
                      <option value="1">Enabled</option>
                      <option value="0">Disabled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Under/overpay tolerance (%)</label>
                    <input id="sp_tolerance_pct" type="number" min={0} step={0.1} defaultValue={parseFloat(String(process.env.NEXT_PUBLIC_TOLERANCE_PCT || '0'))} className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </div>
                <div className="mt-4">
                  <button onClick={() => {
                    try {
                      const lock = (document.getElementById('sp_price_lock_sec') as HTMLInputElement).value
                      const auto = (document.getElementById('sp_auto_requote') as HTMLSelectElement).value
                      const tol = (document.getElementById('sp_tolerance_pct') as HTMLInputElement).value
                      localStorage.setItem('sp_price_lock_sec', String(parseInt(lock||'120')))
                      localStorage.setItem('sp_auto_requote', auto==='1'?'1':'0')
                      localStorage.setItem('sp_tolerance_pct', String(parseFloat(tol||'0')))
                      alert('Saved. These apply to new checkout sessions.')
                    } catch {}
                  }} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Save</button>
                </div>
              </section>

              {/* Branding */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Branding</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Primary Color</label>
                    <input type="color" value={settings.branding_primary || '#4f46e5'} onChange={(e)=>onChange('branding_primary', e.target.value)} className="w-16 h-10 p-0 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Secondary Color</label>
                    <input type="color" value={settings.branding_secondary || '#10b981'} onChange={(e)=>onChange('branding_secondary', e.target.value)} className="w-16 h-10 p-0 border rounded" />
                  </div>
                </div>
              </section>

              {/* Custom Wallets (BYO) */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Custom Wallets (Bring Your Own)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <select value={newCW.network} onChange={(e)=>setNewCW(s=>({...s,network:e.target.value}))} className="px-3 py-2 border rounded-md">
                    {['ethereum','polygon','base','arbitrum','binance','solana'].map(n=> <option key={n} value={n}>{n}</option>)}
                  </select>
                  <input value={newCW.address} onChange={(e)=>setNewCW(s=>({...s,address:e.target.value}))} placeholder="Public address" className="px-3 py-2 border rounded-md"/>
                  <div className="flex space-x-2">
                    <input value={newCW.currency || ''} onChange={(e)=>setNewCW(s=>({...s,currency:e.target.value}))} placeholder="Currency (optional)" className="flex-1 px-3 py-2 border rounded-md"/>
                    <button onClick={async ()=>{
                      try {
                        const token = localStorage.getItem('swiftpay_token')
                        const r = await fetch('/api/settings/wallets-custom',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(newCW) })
                        const j = await r.json(); if (j.success) { setCustomWallets(w=>[j.data, ...w]); setNewCW({ network:'ethereum', address:'' }) } else alert(j.error)
                      } catch {}
                    }} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Add</button>
                  </div>
                </div>
                <div className="border rounded-md divide-y">
                  {customWallets.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No custom wallets</div>
                  ) : customWallets.map((w)=> (
                    <div key={w.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{w.network} {w.currency ? `• ${w.currency}` : ''}</div>
                        <div className="text-xs font-mono text-gray-500">{w.address}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={async()=>{
                          try{ const token=localStorage.getItem('swiftpay_token'); await fetch(`/api/settings/wallets-custom?id=${w.id}`,{ method:'DELETE', headers:{ Authorization:`Bearer ${token}` } }); setCustomWallets(list=>list.filter(x=>x.id!==w.id)) }catch{}
                        }} className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded">Delete</button>
                        <button onClick={async()=>{
                          try{ const token=localStorage.getItem('swiftpay_token'); await fetch('/api/settings/wallets-custom',{ method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ id:w.id, is_active: !w.is_active }) }); setCustomWallets(list=>list.map(x=> x.id===w.id? { ...x, is_active: !x.is_active }: x)) }catch{}
                        }} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{w.is_active? 'Deactivate':'Activate'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* API Keys */}
              <section className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">API Keys</h2>
                <div className="flex space-x-2 mb-3">
                  <input value={newKeyName} onChange={(e)=>setNewKeyName(e.target.value)} placeholder="Key name (e.g., backend server)" className="flex-1 px-3 py-2 border rounded-md" />
                  <button onClick={createKey} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">Create</button>
                </div>
                {newKeyPlain && (
                  <div className="p-3 rounded-md bg-indigo-50 text-indigo-800 text-sm mb-3">
                    Copy your new API key now: <span className="font-mono">{newKeyPlain}</span>
                  </div>
                )}
                <div className="border rounded-md divide-y">
                  {keys.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No keys yet</div>
                  ) : keys.map((k) => (
                    <div key={k.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{k.name}</div>
                        <div className="text-xs text-gray-500">Created {new Date(k.created_at).toLocaleString()} {k.last_used_at ? `• Last used ${new Date(k.last_used_at).toLocaleString()}` : ''}</div>
                      </div>
                      <button onClick={()=>deleteKey(k.id)} className="text-sm text-rose-600 hover:text-rose-700">Delete</button>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end">
                <button onClick={save} disabled={saving} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md">
                  {saving ? <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin"/> : <CheckCircleIcon className="h-4 w-4 mr-2"/>}
                  Save Settings
                </button>
                {saved && (
                  <span className="ml-3 inline-flex items-center text-green-700 text-sm"><ShieldCheckIcon className="h-4 w-4 mr-1"/>Saved</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


