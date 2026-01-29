'use client'

import { useEffect, useState } from 'react'

export default function QuotasPageClient() {
  const [quotas, setQuotas] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formEmail, setFormEmail] = useState('')
  const [formHours, setFormHours] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'quotas' | 'logs'>('quotas')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const quotasRes = await fetch('/api/admin/quotas')
      if (quotasRes.ok) {
        const data = await quotasRes.json()
        setQuotas(data.quotas || [])
      }

      const logsRes = await fetch('/api/admin/quotas/logs')
      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveQuota(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/quotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: formEmail,
          totalHours: parseInt(formHours),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✓ Quota updated for ${formEmail}`)
        setFormEmail('')
        setFormHours('')
        setShowForm(false)
        await loadData()
      } else {
        setMessage(data.message || 'Failed to save quota')
        console.error('Quota save error:', data)
      }
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Error saving quota')
    } finally {
      setSaving(false)
    }
  }


  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Customer Hour Quotas
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Manage customer support hour allocations
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('quotas')}
          style={{
            background: tab === 'quotas' ? '#0077C8' : '#FFFFFF',
            color: tab === 'quotas' ? '#FFFFFF' : '#475569',
            border: `1px solid ${tab === 'quotas' ? '#0077C8' : '#D0D7E2'}`,
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Quotas
          <span style={{
            background: tab === 'quotas' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
            color: tab === 'quotas' ? '#FFFFFF' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            {quotas.length}
          </span>
        </button>
        <button
          onClick={() => setTab('logs')}
          style={{
            background: tab === 'logs' ? '#0077C8' : '#FFFFFF',
            color: tab === 'logs' ? '#FFFFFF' : '#475569',
            border: `1px solid ${tab === 'logs' ? '#0077C8' : '#D0D7E2'}`,
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Usage History
          <span style={{
            background: tab === 'logs' ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
            color: tab === 'logs' ? '#FFFFFF' : '#64748B',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
          }}>
            {logs.length}
          </span>
        </button>
      </div>

      {tab === 'quotas' && (
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: '#0077C8',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 20,
            }}
          >
            {showForm ? 'Cancel' : '+ Add/Edit Quota'}
          </button>

          {showForm && (
            <form onSubmit={handleSaveQuota} className="card" style={{ marginBottom: 20, padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Customer Email
                </label>
                <input
                  type="email"
                  placeholder="customer@company.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                  Total Hours
                </label>
                <input
                  type="number"
                  placeholder="e.g., 40"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  min="0"
                  required
                  style={{ marginBottom: 0, maxWidth: '200px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Quota'}
                </button>
                {message && (
                  <span style={{
                    fontSize: '14px',
                    color: message.includes('✓') ? '#22C55E' : '#DC2626',
                  }}>
                    {message}
                  </span>
                )}
              </div>
            </form>
          )}

          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Loading quotas...</p>
            </div>
          ) : quotas.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏱️</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No quotas configured yet
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                Add your first customer quota to get started
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Customer Email</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Total Hours</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Used Hours</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Available</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((quota) => (
                    <tr key={quota.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{quota.customerEmail}</td>
                      <td style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0077C8' }}>{quota.totalHours}h</td>
                      <td style={{ textAlign: 'center', padding: '16px', fontSize: '14px', color: '#475569' }}>{quota.usedHours}h</td>
                      <td style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: quota.availableHours === 0 ? '#DC2626' : '#22C55E' }}>
                        {quota.availableHours}h
                      </td>
                      <td style={{ textAlign: 'center', padding: '16px', fontSize: '14px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: quota.totalHours === 0 ? '#F1F5F9' : (quota.usedHours / quota.totalHours) > 0.8 ? '#FEF2F2' : (quota.usedHours / quota.totalHours) > 0.5 ? '#FFFBEB' : '#F0FDF4',
                          color: quota.totalHours === 0 ? '#64748B' : (quota.usedHours / quota.totalHours) > 0.8 ? '#DC2626' : (quota.usedHours / quota.totalHours) > 0.5 ? '#F59E0B' : '#22C55E',
                        }}>
                          {quota.totalHours === 0 ? '–' : Math.round((quota.usedHours / quota.totalHours) * 100) + '%'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#64748B', margin: 0 }}>Loading history...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No quota usage history
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                Usage will be recorded when visits are confirmed
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Customer Email</th>
                    <th style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Hours Deducted</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Reason</th>
                    <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0F172A' }}>{log.customerEmail}</td>
                      <td style={{ textAlign: 'center', padding: '16px', fontSize: '14px', fontWeight: 600, color: '#DC2626' }}>-{log.hoursDeducted}h</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{log.reason}</td>
                      <td style={{ textAlign: 'right', padding: '16px', fontSize: '14px', color: '#64748B' }}>
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
