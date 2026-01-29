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
    <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#64748B' }}>
      {label}:{' '}
      <code
        onClick={handleCopy}
        style={{
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          backgroundColor: copied ? '#0077C8' : '#F1F5F9',
          color: copied ? '#FFFFFF' : '#0F172A',
        }}
        title="Click to copy"
      >
        {copied ? '✓ Copied!' : value.length > 40 ? value.substring(0, 37) + '...' : value}
      </code>
    </p>
  )
}
