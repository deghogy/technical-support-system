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

      if (res.ok) {
        setMessage(`✓ Quota updated for ${formEmail}`)
        setFormEmail('')
        setFormHours('')
        setShowForm(false)
        await loadData()
      } else {
        setMessage('Failed to save quota')
      }
    } catch (error) {
      console.error(error)
      setMessage('Error saving quota')
    } finally {
      setSaving(false)
    }
  }


  return (
    <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
      <h1>Customer Hour Quotas</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setTab('quotas')}
          style={{
            background: tab === 'quotas' ? 'var(--accent)' : 'transparent',
            color: tab === 'quotas' ? '#fff' : 'var(--muted)',
            border: tab === 'quotas' ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Quotas ({quotas.length})
        </button>
        <button
          onClick={() => setTab('logs')}
          style={{
            background: tab === 'logs' ? 'var(--accent)' : 'transparent',
            color: tab === 'logs' ? '#fff' : 'var(--muted)',
            border: tab === 'logs' ? 'none' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          Usage History ({logs.length})
        </button>
      </div>

      {tab === 'quotas' && (
        <div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ marginBottom: 20 }}
          >
            {showForm ? 'Cancel' : '+ Add/Edit Quota'}
          </button>

          {showForm && (
            <form onSubmit={handleSaveQuota} className="card" style={{ marginBottom: 20 }}>
              <input
                type="email"
                placeholder="Customer email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Total hours"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
                min="0"
                required
              />
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Quota'}
              </button>
              {message && <p>{message}</p>}
            </form>
          )}

          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Loading quotas...</p>
          ) : quotas.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No quotas configured yet</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Customer Email</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>Total Hours</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>Used Hours</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>Available</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>Usage %</th>
                  </tr>
                </thead>
                <tbody>
                  {quotas.map((quota) => (
                    <tr key={quota.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{quota.customerEmail}</td>
                      <td style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>{quota.totalHours}h</td>
                      <td style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>{quota.usedHours}h</td>
                      <td style={{ textAlign: 'center', padding: '12px', fontSize: '14px', color: quota.availableHours === 0 ? 'var(--danger)' : 'var(--accent)' }}>
                        {quota.availableHours}h
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>
                        {quota.totalHours === 0 ? '–' : Math.round((quota.usedHours / quota.totalHours) * 100)}%
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
            <p style={{ color: 'var(--muted)' }}>Loading history...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No quota usage history</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Customer Email</th>
                    <th style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>Hours Deducted</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px' }}>Reason</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontSize: '14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>{log.customerEmail}</td>
                      <td style={{ textAlign: 'center', padding: '12px', fontSize: '14px' }}>{log.hoursDeducted}h</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: 'var(--muted)' }}>{log.reason}</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px', color: 'var(--muted)' }}>
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
