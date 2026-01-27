'use client'

import { useState } from 'react'

export function CopyableText({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
      {label}:{' '}
      <code
        onClick={handleCopy}
        style={{
          background: 'var(--card)',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          backgroundColor: copied ? 'var(--accent)' : 'var(--card)',
          color: copied ? 'white' : 'inherit',
        }}
        title="Click to copy"
      >
        {copied ? '✓ Copied!' : value.length > 40 ? value.substring(0, 37) + '...' : value}
      </code>
    </p>
  )
}
