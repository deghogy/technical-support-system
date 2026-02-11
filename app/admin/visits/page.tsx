'use client'

import { useState, useEffect } from 'react'
import { formatDateGMT7, formatDateOnlyGMT7 } from '@/lib/dateFormatter'
import VisitRecorder from '@/components/VisitRecorder'
import QRCode from '@/components/QRCode'
import { CopyableText } from '@/components/CopyableText'
import { getBaseUrl } from '@/lib/env'
import Unauthorized from '@/components/Unauthorized'

// Calculate duration between two dates in hours (rounded down to favor customer)
function calculateDurationHours(startTime: string, endTime: string): string {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)
  return Math.floor(diffHours).toString()
}

function isRemoteVisit(location: string): boolean {
  return location?.includes('Automation - Boccard Indonesia') || false
}

export default function VisitsPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'recorded'>('scheduled')
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([])
  const [recordedVisits, setRecordedVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true
    let intervalId: NodeJS.Timeout | null = null

    async function loadVisits() {
      if (!isActive) return

      try {
        // Fetch both types of visits
        const [scheduledRes, recordedRes] = await Promise.all([
          fetch('/api/admin/visits?type=scheduled'),
          fetch('/api/admin/visits?type=recorded')
        ])

        if (!isActive) return

        if (scheduledRes.ok) {
          const data = await scheduledRes.json()
          setScheduledVisits(data.visits || [])
        }

        if (recordedRes.ok) {
          const data = await recordedRes.json()
          setRecordedVisits(data.visits || [])
        }
      } catch (err) {
        console.error('Failed to load visits:', err)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    // Initial load
    loadVisits()

    // Only start polling if tab is visible
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(loadVisits, 30000) // Increased to 30 seconds
    }

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Handle visibility change to pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        loadVisits() // Refresh immediately when tab becomes visible
        startPolling()
      }
    }

    startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isActive = false
      stopPolling()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <p style={{ color: '#64748B' }}>Loading visits...</p>
        </div>
      </main>
    )
  }

  return (
    <Unauthorized>
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1000px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Site Visit Tracking
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Record visits and track customer confirmations
        </p>
      </div>

      {/* Tabs */}
      <div className="visit-tabs">
        <button
          className={`visit-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          <span>Scheduled</span>
          <span className="visit-tab-badge">{scheduledVisits.length}</span>
        </button>
        <button
          className={`visit-tab ${activeTab === 'recorded' ? 'active' : ''}`}
          onClick={() => setActiveTab('recorded')}
        >
          <span>Recorded</span>
          <span className="visit-tab-badge">{recordedVisits.length}</span>
        </button>
      </div>

      {/* Scheduled Visits Tab */}
      {activeTab === 'scheduled' && (
        <div>
          {scheduledVisits.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No scheduled visits
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                All pending visits have been recorded
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {scheduledVisits.map((visit) => {
                const isRemote = isRemoteVisit(visit.site_location)

                return (
                  <div
                    key={visit.id}
                    className="card"
                    style={{
                      padding: '20px',
                      borderLeft: isRemote ? '4px solid #8B5CF6' : '4px solid #0077C8',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Type Indicator */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '12px',
                        background: isRemote ? '#F3E8FF' : '#EAF3FB',
                        borderRadius: '8px',
                        minWidth: '70px',
                      }}>
                        <span style={{ fontSize: '24px' }}>{isRemote ? '💻' : '📍'}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: isRemote ? '#7C3AED' : '#0077C8',
                          textTransform: 'uppercase',
                        }}>
                          {isRemote ? 'Remote' : 'On-site'}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {visit.requester_name}
                          </h3>
                          <span style={{ fontSize: '13px', color: '#64748B' }}>
                            ({visit.requester_email})
                          </span>
                        </div>

                        <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#475569' }}>
                          <strong>Location:</strong> {visit.site_location}
                        </p>

                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          color: '#64748B',
                          lineHeight: 1.5,
                        }}>
                          {visit.problem_desc}
                        </p>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '10px 14px',
                          background: '#F8FAFC',
                          borderRadius: '6px',
                          marginBottom: '12px',
                          flexWrap: 'wrap',
                        }}>
                          <span style={{ fontSize: '13px', color: '#475569' }}>
                            📅 <strong>{formatDateGMT7(visit.scheduled_date)}</strong>
                          </span>
                        </div>

                        <CopyableText label="Visit ID" value={visit.id} />
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                        <VisitRecorder id={visit.id} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Recorded Visits Tab */}
      {activeTab === 'recorded' && (
        <div>
          {recordedVisits.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: '#64748B', margin: '0 0 8px 0', fontSize: '15px' }}>
                No recorded visits pending confirmation
              </p>
              <p style={{ color: '#94A3B8', margin: 0, fontSize: '13px' }}>
                All recorded visits have been confirmed by customers
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {recordedVisits.map((visit) => {
                const isRemote = isRemoteVisit(visit.site_location)

                return (
                  <div
                    key={visit.id}
                    className="card"
                    style={{
                      padding: '20px',
                      borderLeft: isRemote ? '4px solid #8B5CF6' : '4px solid #22C55E',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      {/* Type Indicator */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '12px',
                        background: isRemote ? '#F3E8FF' : '#F0FDF4',
                        borderRadius: '8px',
                        minWidth: '70px',
                      }}>
                        <span style={{ fontSize: '24px' }}>{isRemote ? '💻' : '📍'}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: isRemote ? '#7C3AED' : '#16A34A',
                          textTransform: 'uppercase',
                        }}>
                          {isRemote ? 'Remote' : 'On-site'}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                            {visit.requester_name}
                          </h3>
                          <span style={{ fontSize: '13px', color: '#64748B' }}>
                            ({visit.requester_email})
                          </span>
                        </div>

                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>
                          <strong>Location:</strong> {visit.site_location}
                        </p>

                        <div style={{
                          background: '#F8FAFC',
                          padding: '14px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: '1px solid #E2E8F0',
                        }}>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
                            🕐 <strong>Started:</strong> {formatDateGMT7(visit.actual_start_time)}
                          </p>
                          <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#475569' }}>
                            🕑 <strong>Ended:</strong> {formatDateGMT7(visit.actual_end_time)}
                          </p>
                          {visit.actual_start_time && visit.actual_end_time && (
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#0F172A', fontWeight: 600 }}>
                              ⏱ Duration: {calculateDurationHours(visit.actual_start_time, visit.actual_end_time)} hours worked
                            </p>
                          )}
                        </div>

                        {visit.technician_notes && (
                          <div style={{
                            marginBottom: '12px',
                            padding: '12px',
                            background: '#EAF3FB',
                            borderRadius: '6px',
                            borderLeft: '3px solid #0077C8',
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#0077C8', fontWeight: 600 }}>
                              📝 Technician Notes
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
                              {visit.technician_notes}
                            </p>
                          </div>
                        )}

                        {/* Attached Document */}
                        {visit.document_url && (
                          <div style={{
                            marginBottom: '12px',
                            padding: '12px',
                            background: '#EAF3FB',
                            borderRadius: '6px',
                            borderLeft: '3px solid #0077C8',
                          }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0077C8', fontWeight: 600 }}>
                              📎 Attached Document
                            </p>
                            <a
                              href={visit.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#0077C8',
                                color: '#fff',
                                textDecoration: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                fontWeight: 500,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⬇️ Download Document
                            </a>
                          </div>
                        )}

                        <div style={{
                          padding: '10px 14px',
                          background: '#FFFBEB',
                          borderRadius: '6px',
                          border: '1px solid #FDE68A',
                          marginBottom: '12px',
                        }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                            ⏳ Waiting for customer confirmation...
                          </p>
                        </div>

                        <CopyableText label="Confirmation Link" value={`${getBaseUrl()}/confirm-visit/${visit.id}`} />
                      </div>

                      {/* QR Code */}
                      <div style={{ textAlign: 'center', minWidth: '120px' }}>
                        <QRCode url={`${getBaseUrl()}/confirm-visit/${visit.id}`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </main>
    </Unauthorized>
  )
}
