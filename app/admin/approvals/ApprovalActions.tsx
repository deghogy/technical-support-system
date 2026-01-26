'use client'

import { useState } from 'react'

export default function ApprovalActions({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function update(status: 'approved' | 'rejected') {
    setLoading(true)

    // call admin approvals endpoint so we use the server-side auth and auditing
    await fetch(`/api/admin/approvals/${id}`, {
      method: 'POST',
      body: new URLSearchParams({ status }),
    })

    setLoading(false)
    location.reload()
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button disabled={loading} onClick={() => update('approved')}>
        ✅ Approve
      </button>{' '}
      <button disabled={loading} onClick={() => update('rejected')}>
        ❌ Reject
      </button>
    </div>
  )
}
