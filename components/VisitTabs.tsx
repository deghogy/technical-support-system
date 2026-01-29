'use client'

import Link from 'next/link'

interface VisitTabsProps {
  activeTab: string
  scheduledCount: number
  recordedCount: number
}

export default function VisitTabs({ activeTab, scheduledCount, recordedCount }: VisitTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: '24px', borderBottom: '2px solid #E2E8F0' }}>
      <Link
        href="/admin/visits?tab=scheduled"
        replace
        scroll={false}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 600,
          color: activeTab === 'scheduled' ? '#0077C8' : '#64748B',
          borderBottom: activeTab === 'scheduled' ? '2px solid #0077C8' : 'none',
          marginBottom: '-2px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: activeTab === 'scheduled' ? '#F8FAFC' : 'transparent',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
        }}
      >
        Scheduled
        <span style={{
          background: activeTab === 'scheduled' ? '#0077C8' : '#E2E8F0',
          color: activeTab === 'scheduled' ? '#FFFFFF' : '#64748B',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>
          {scheduledCount}
        </span>
      </Link>
      <Link
        href="/admin/visits?tab=recorded"
        replace
        scroll={false}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: 600,
          color: activeTab === 'recorded' ? '#0077C8' : '#64748B',
          borderBottom: activeTab === 'recorded' ? '2px solid #0077C8' : 'none',
          marginBottom: '-2px',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: activeTab === 'recorded' ? '#F8FAFC' : 'transparent',
          borderRadius: '6px 6px 0 0',
          cursor: 'pointer',
        }}
      >
        Recorded
        <span style={{
          background: activeTab === 'recorded' ? '#0077C8' : '#E2E8F0',
          color: activeTab === 'recorded' ? '#FFFFFF' : '#64748B',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
        }}>
          {recordedCount}
        </span>
      </Link>
    </div>
  )
}
