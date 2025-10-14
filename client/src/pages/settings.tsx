import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { CogIcon, CheckCircleIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

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

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null
        if (!token) { setError('Please log in'); setLoading(false); return }
        const r = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const j = await r.json()
        if (j.success) setSettings(j.data || {})
        else setError(j.error || 'Failed to load settings')
      } catch (e) { setError('Failed to load settings') }
      finally { setLoading(false) }
    }
    load()
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
                <p className="text-xs text-gray-500 mt-2">We'll sign events with HMAC SHA-256 using this secret.</p>
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


