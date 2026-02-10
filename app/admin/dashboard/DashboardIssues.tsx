'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Issue {
  id: number
  issue_no: string
  entry_issue_date: string
  pic: string
  customer: string
  first_time_response: string
  troubleshoot_date_start: string
  troubleshoot_date_end: string
  duration_days: number
  project_number: string
  issue_description: string
  action: string
  status: string
}

interface DashboardIssuesProps {
  initialIssues: Issue[]
}

const statusBadgeColors: Record<string, { bg: string; color: string; border: string }> = {
  'done': { bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
  'pending': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  'in progress': { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
}

const picColors = ['#0077C8', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

function getPICColor(pic: string) {
  if (!pic) return '#64748B'
  const index = pic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % picColors.length
  return picColors[index]
}

export default function DashboardIssues({ initialIssues }: DashboardIssuesProps) {
  const [issues] = useState<Issue[]>(initialIssues)
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Sorting
  const [sortField, setSortField] = useState<'issue_no' | 'duration_days'>('issue_no')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => [...new Set(issues.map(i => i.status).filter(Boolean))], [issues])

  // Apply filters and sorting
  const filteredIssues = useMemo(() => {
    let result = issues.filter(issue => {
      const matchesSearch = !search ||
        issue.customer?.toLowerCase().includes(search.toLowerCase()) ||
        issue.issue_no?.toLowerCase().includes(search.toLowerCase()) ||
        issue.issue_description?.toLowerCase().includes(search.toLowerCase()) ||
        issue.project_number?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || issue.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })

    // Apply sorting
    result = [...result].sort((a, b) => {
      let valueA: number, valueB: number

      if (sortField === 'issue_no') {
        valueA = parseInt(a.issue_no?.replace(/\D/g, '') || '0', 10)
        valueB = parseInt(b.issue_no?.replace(/\D/g, '') || '0', 10)
      } else if (sortField === 'duration_days') {
        valueA = a.duration_days || 0
        valueB = b.duration_days || 0
      } else {
        return 0
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
    })

    return result
  }, [issues, search, statusFilter, sortField, sortDirection])

  // Stats - Workflow stages based on issue lifecycle
  const stats = useMemo(() => ({
    total: issues.length,
    firstResponsed: issues.filter(i => i.first_time_response && i.first_time_response.trim() !== '').length,
    planned: issues.filter(i => i.troubleshoot_date_start && i.troubleshoot_date_start.trim() !== '').length,
    completed: issues.filter(i => i.status?.toLowerCase() === 'done').length,
  }), [issues])

  if (issues.length === 0) {
    return null
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      {/* Section Header - Same format as Service Contract Active */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Issue Log Overview
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          Track issue by realtime
        </p>
      </div>

      {/* Issues Workflow Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* Card 1: Issue Received */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
          borderRadius: '10px',
          border: '1px solid #CBD5E1',
          borderLeft: '4px solid #64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>📋</div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#475569', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issue Received</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#334155', margin: 0 }}>{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Card 2: First Responsed - Warning if less than total */}
        <div style={{
          padding: '16px',
          background: stats.firstResponsed < stats.total
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
            : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderRadius: '10px',
          border: stats.firstResponsed < stats.total ? '1px solid #FECACA' : '1px solid #BFDBFE',
          borderLeft: stats.firstResponsed < stats.total ? '4px solid #EF4444' : '4px solid #3B82F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: stats.firstResponsed < stats.total ? '#EF4444' : '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>📨</div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: stats.firstResponsed < stats.total ? '#991B1B' : '#1E40AF', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Responsed</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: stats.firstResponsed < stats.total ? '#DC2626' : '#2563EB', margin: 0 }}>{stats.firstResponsed}</p>
            </div>
          </div>
          {stats.firstResponsed < stats.total && (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#FEE2E2',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              animation: 'pulse 2s infinite'
            }} title={`${stats.total - stats.firstResponsed} issues not yet responded`}>🔔</div>
          )}
        </div>

        {/* Card 3: Planned Troubleshoot - Warning if less than first responsed */}
        <div style={{
          padding: '16px',
          background: stats.planned < stats.firstResponsed
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
            : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderRadius: '10px',
          border: stats.planned < stats.firstResponsed ? '1px solid #FECACA' : '1px solid #FDE68A',
          borderLeft: stats.planned < stats.firstResponsed ? '4px solid #EF4444' : '4px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: stats.planned < stats.firstResponsed ? '#EF4444' : '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>📅</div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: stats.planned < stats.firstResponsed ? '#991B1B' : '#92400E', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Planned Troubleshoot</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: stats.planned < stats.firstResponsed ? '#DC2626' : '#D97706', margin: 0 }}>{stats.planned}</p>
            </div>
          </div>
          {stats.planned < stats.firstResponsed && (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#FEE2E2',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              animation: 'pulse 2s infinite'
            }} title={`${stats.firstResponsed - stats.planned} responded issues not yet planned`}>🔔</div>
          )}
        </div>

        {/* Card 4: Completed */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          borderRadius: '10px',
          border: '1px solid #BBF7D0',
          borderLeft: '4px solid #22C55E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '80px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>✅</div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#166534', margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', margin: 0 }}>{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header - Always Visible */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            background: isExpanded ? '#F8FAFC' : 'transparent',
            borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '16px' }}>🔧</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>Issue Details</span>
            <span style={{
              fontSize: '12px',
              color: '#64748B',
              background: '#F1F5F9',
              padding: '2px 10px',
              borderRadius: '12px'
            }}>
              {filteredIssues.length} of {issues.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/admin/issues"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '13px',
                color: '#0077C8',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#EAF3FB'
              }}
            >
              View Full Page →
            </Link>
            <span style={{
              fontSize: '14px',
              color: '#64748B',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>▼</span>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div style={{ padding: '20px' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search issues, customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ margin: 0, fontSize: '14px' }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '150px', margin: 0 }}
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '8px 14px',
                    background: viewMode === 'table' ? '#0077C8' : '#F1F5F9',
                    color: viewMode === 'table' ? '#fff' : '#475569',
                    border: '1px solid #D0D7E2',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  📊 Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    padding: '8px 14px',
                    background: viewMode === 'cards' ? '#0077C8' : '#F1F5F9',
                    color: viewMode === 'cards' ? '#fff' : '#475569',
                    border: '1px solid #D0D7E2',
                    borderRadius: '6px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  🎴 Cards
                </button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ margin: 0, border: 'none', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th
                        style={{ padding: '10px 8px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          if (sortField === 'issue_no') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('issue_no')
                            setSortDirection('asc')
                          }
                        }}
                      >
                        No {sortField === 'issue_no' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th style={{ padding: '10px 8px' }}>Date</th>
                      <th style={{ padding: '10px 8px' }}>Customer</th>
                      <th style={{ padding: '10px 8px' }}>Project</th>
                      <th style={{ padding: '10px 8px', minWidth: '150px' }}>Issue</th>
                      <th style={{ padding: '10px 8px' }}>Response</th>
                      <th style={{ padding: '10px 8px' }}>T.Start</th>
                      <th style={{ padding: '10px 8px' }}>T.End</th>
                      <th
                        style={{ padding: '10px 8px', cursor: 'pointer', textAlign: 'center' }}
                        onClick={() => {
                          if (sortField === 'duration_days') {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortField('duration_days')
                            setSortDirection('desc')
                          }
                        }}
                      >
                        Days {sortField === 'duration_days' && (sortDirection === 'asc' ? '▲' : '▼')}
                      </th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px' }}>PIC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '32px 24px' }}>
                          <p style={{ color: '#64748B', margin: 0 }}>No issues found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.slice(0, 10).map((issue) => {
                        const badgeStyle = statusBadgeColors[issue.status?.toLowerCase() || ''] || { bg: '#F3F4F6', color: '#4B5563', border: '#D1D5DB' }
                        const picColor = getPICColor(issue.pic)

                        return (
                          <tr key={issue.id}>
                            <td style={{ fontWeight: 600, padding: '10px 8px' }}>{issue.issue_no}</td>
                            <td style={{ padding: '10px 8px', fontSize: '12px' }}>
                              {issue.entry_issue_date
                                ? new Date(issue.entry_issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                : '-'}
                            </td>
                            <td style={{ padding: '10px 8px' }}>{issue.customer}</td>
                            <td style={{ padding: '10px 8px', fontSize: '12px' }}>{issue.project_number}</td>
                            <td style={{ padding: '10px 8px', maxWidth: '200px' }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                                {issue.issue_description}
                              </div>
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '12px' }}>
                              {issue.first_time_response
                                ? new Date(issue.first_time_response).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                : '-'}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '12px' }}>
                              {issue.troubleshoot_date_start
                                ? new Date(issue.troubleshoot_date_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                : '-'}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '12px' }}>
                              {issue.troubleshoot_date_end
                                ? new Date(issue.troubleshoot_date_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                                : '-'}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 600 }}>
                              {issue.duration_days || '-'}
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                background: badgeStyle.bg,
                                color: badgeStyle.color,
                                border: `1px solid ${badgeStyle.border}`
                              }}>
                                {issue.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 8px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: `${picColor}15`,
                                color: picColor,
                              }}>
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: picColor }} />
                                {issue.pic || '-'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
                {filteredIssues.length > 10 && (
                  <p style={{ fontSize: '12px', color: '#64748B', textAlign: 'center', margin: '12px 0 0 0' }}>
                    Showing 10 of {filteredIssues.length} issues. <Link href="/admin/issues" style={{ color: '#0077C8' }}>View all →</Link>
                  </p>
                )}
              </div>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredIssues.slice(0, 6).map((issue) => {
                  const badgeStyle = statusBadgeColors[issue.status?.toLowerCase() || ''] || { bg: '#F3F4F6', color: '#4B5563', border: '#D1D5DB' }
                  const picColor = getPICColor(issue.pic)

                  return (
                    <div key={issue.id} style={{
                      padding: '16px',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${badgeStyle.border}`,
                      background: '#FAFBFC'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{issue.issue_no}</span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: `1px solid ${badgeStyle.border}`
                        }}>
                          {issue.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: '0 0 6px 0' }}>{issue.customer}</p>
                      <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                        {issue.issue_description?.substring(0, 60)}{issue.issue_description?.length > 60 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {issue.entry_issue_date ? new Date(issue.entry_issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: `${picColor}15`,
                          color: picColor,
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: picColor }} />
                          {issue.pic || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {filteredIssues.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: '#64748B' }}>No issues found</p>
                  </div>
                )}
                {filteredIssues.length > 6 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                    <Link href="/admin/issues" style={{ fontSize: '13px', color: '#0077C8' }}>
                      View all {filteredIssues.length} issues →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
