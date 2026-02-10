'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'

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

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [picFilter, setPicFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Sorting
  const [sortField, setSortField] = useState<'issue_no' | 'duration_days'>('issue_no')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchIssues()
  }, [])

  async function fetchIssues() {
    const { data, error } = await supabase
      .from('issue_log')
      .select('*')
      .order('entry_issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching issues:', error)
    } else {
      setIssues(data || [])
    }
    setLoading(false)
  }

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => [...new Set(issues.map(i => i.status).filter(Boolean))], [issues])
  const uniquePICs = useMemo(() => [...new Set(issues.map(i => i.pic).filter(Boolean))].sort(), [issues])
  const uniqueCustomers = useMemo(() => [...new Set(issues.map(i => i.customer).filter(Boolean))].sort(), [issues])

  // Apply filters and sorting
  const filteredIssues = useMemo(() => {
    let result = issues.filter(issue => {
      const matchesSearch = !search ||
        issue.customer?.toLowerCase().includes(search.toLowerCase()) ||
        issue.issue_no?.toLowerCase().includes(search.toLowerCase()) ||
        issue.issue_description?.toLowerCase().includes(search.toLowerCase()) ||
        issue.project_number?.toLowerCase().includes(search.toLowerCase()) ||
        issue.action?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || issue.status?.toLowerCase() === statusFilter.toLowerCase()
      const matchesPIC = picFilter === 'all' || issue.pic === picFilter
      const matchesCustomer = customerFilter === 'all' || issue.customer === customerFilter

      const matchesDateFrom = !dateFrom || (issue.entry_issue_date && new Date(issue.entry_issue_date) >= new Date(dateFrom))
      const matchesDateTo = !dateTo || (issue.entry_issue_date && new Date(issue.entry_issue_date) <= new Date(dateTo))

      return matchesSearch && matchesStatus && matchesPIC && matchesCustomer && matchesDateFrom && matchesDateTo
    })

    // Apply sorting
    result = [...result].sort((a, b) => {
      let valueA: number, valueB: number

      if (sortField === 'issue_no') {
        // Extract number from issue_no (e.g., "ISS-001" → 1)
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
  }, [issues, search, statusFilter, picFilter, customerFilter, dateFrom, dateTo, sortField, sortDirection])

  // Stats - Workflow stages based on issue lifecycle
  const stats = useMemo(() => ({
    total: filteredIssues.length,
    firstResponsed: filteredIssues.filter(i => i.first_time_response && i.first_time_response.trim() !== '').length,
    planned: filteredIssues.filter(i => i.troubleshoot_date_start && i.troubleshoot_date_start.trim() !== '').length,
    completed: filteredIssues.filter(i => i.status?.toLowerCase() === 'done').length,
  }), [filteredIssues])

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPicFilter('all')
    setCustomerFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  if (loading) {
    return (
      <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #E2E8F0',
            borderTopColor: '#0077C8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    )
  }

  return (
    <main className="container" style={{ paddingTop: '32px', paddingBottom: '48px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
          Issue Log
        </h1>
        <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
          Track and manage customer issues
        </p>
      </div>

      {/* Stats Cards - Workflow Stages */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Issue Received */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
          borderRadius: '12px',
          border: '1px solid #CBD5E1',
          borderLeft: '4px solid #64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>📋</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#475569', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Issue Received</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#334155', margin: 0 }}>{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Card 2: First Responsed - Warning if less than total */}
        <div style={{
          padding: '20px',
          background: stats.firstResponsed < stats.total
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
            : 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderRadius: '12px',
          border: stats.firstResponsed < stats.total ? '1px solid #FECACA' : '1px solid #BFDBFE',
          borderLeft: stats.firstResponsed < stats.total ? '4px solid #EF4444' : '4px solid #3B82F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: stats.firstResponsed < stats.total ? '#EF4444' : '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>📨</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: stats.firstResponsed < stats.total ? '#991B1B' : '#1E40AF', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>First Responsed</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: stats.firstResponsed < stats.total ? '#DC2626' : '#2563EB', margin: 0 }}>{stats.firstResponsed}</p>
            </div>
          </div>
          {stats.firstResponsed < stats.total && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#FEE2E2',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              animation: 'pulse 2s infinite'
            }} title={`${stats.total - stats.firstResponsed} issues not yet responded`}>🔔</div>
          )}
        </div>

        {/* Card 3: Planned Troubleshoot - Warning if less than first responsed */}
        <div style={{
          padding: '20px',
          background: stats.planned < stats.firstResponsed
            ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
            : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderRadius: '12px',
          border: stats.planned < stats.firstResponsed ? '1px solid #FECACA' : '1px solid #FDE68A',
          borderLeft: stats.planned < stats.firstResponsed ? '4px solid #EF4444' : '4px solid #F59E0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: stats.planned < stats.firstResponsed ? '#EF4444' : '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>📅</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: stats.planned < stats.firstResponsed ? '#991B1B' : '#92400E', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Planned Troubleshoot</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: stats.planned < stats.firstResponsed ? '#DC2626' : '#D97706', margin: 0 }}>{stats.planned}</p>
            </div>
          </div>
          {stats.planned < stats.firstResponsed && (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#FEE2E2',
              border: '2px solid #EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              animation: 'pulse 2s infinite'
            }} title={`${stats.firstResponsed - stats.planned} responded issues not yet planned`}>🔔</div>
          )}
        </div>

        {/* Card 4: Completed */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          borderRadius: '12px',
          border: '1px solid #BBF7D0',
          borderLeft: '4px solid #22C55E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>✅</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#166534', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</p>
              <p style={{ fontSize: '28px', fontWeight: 800, color: '#16A34A', margin: 0 }}>{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse animation for warning bells */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      {/* Search & Filters Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        {/* Search Row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: showFilters ? '16px' : '0', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input
              type="text"
              placeholder="🔍 Search issues, customers, projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ margin: 0, fontSize: '15px' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '10px 20px',
              background: showFilters ? '#0077C8' : '#F1F5F9',
              color: showFilters ? '#fff' : '#475569',
              border: '1px solid #D0D7E2',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚙️ Filters {showFilters ? '▲' : '▼'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '10px 16px',
                background: viewMode === 'cards' ? '#0077C8' : '#F1F5F9',
                color: viewMode === 'cards' ? '#fff' : '#475569',
                border: '1px solid #D0D7E2',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              🎴 Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '10px 16px',
                background: viewMode === 'table' ? '#0077C8' : '#F1F5F9',
                color: viewMode === 'table' ? '#fff' : '#475569',
                border: '1px solid #D0D7E2',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              📊 Table
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                PIC
              </label>
              <select value={picFilter} onChange={(e) => setPicFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="all">All PICs</option>
                {uniquePICs.map(pic => (
                  <option key={pic} value={pic}>{pic}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Customer
              </label>
              <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="all">All Customers</option>
                {uniqueCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Date From
              </label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ margin: 0 }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Date To
              </label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ margin: 0 }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={clearFilters}
                style={{
                  padding: '10px 20px',
                  background: '#F1F5F9',
                  color: '#64748B',
                  border: '1px solid #D0D7E2',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>
          Showing <strong>{filteredIssues.length}</strong> of <strong>{issues.length}</strong> issues
        </p>
        {(statusFilter !== 'all' || picFilter !== 'all' || customerFilter !== 'all' || dateFrom || dateTo || search) && (
          <span style={{
            fontSize: '12px',
            color: '#0077C8',
            background: '#EAF3FB',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: 500
          }}>
            Filters Active
          </span>
        )}
      </div>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {filteredIssues.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px 24px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
              <p style={{ color: '#64748B', fontSize: '16px', margin: '0 0 8px 0' }}>No issues found</p>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>Try adjusting your filters</p>
            </div>
          ) : (
            filteredIssues.map((issue) => {
              const badgeStyle = statusBadgeColors[issue.status?.toLowerCase() || ''] || { bg: '#F3F4F6', color: '#4B5563', border: '#D1D5DB' }
              const picColor = getPICColor(issue.pic)

              return (
                <div key={issue.id} className="card" style={{
                  padding: '20px',
                  borderLeft: `4px solid ${badgeStyle.border}`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: '0 0 4px 0' }}>
                        {issue.issue_no}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
                        {issue.entry_issue_date ? new Date(issue.entry_issue_date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: badgeStyle.bg,
                      color: badgeStyle.color,
                      border: `1px solid ${badgeStyle.border}`
                    }}>
                      {issue.status}
                    </span>
                  </div>

                  {/* Customer & Project */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🏢</span>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>{issue.customer}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📁</span>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>{issue.project_number || 'No project'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{
                    background: '#F8FAFC',
                    padding: '14px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    border: '1px solid #E2E8F0'
                  }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                      Issue Description
                    </p>
                    <p style={{ fontSize: '14px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      {issue.issue_description || 'No description'}
                    </p>
                  </div>

                  {/* Action */}
                  {issue.action && (
                    <div style={{
                      background: '#EAF3FB',
                      padding: '14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      border: '1px solid #BFDBFE'
                    }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: '#0077C8', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                        Action Taken
                      </p>
                      <p style={{ fontSize: '14px', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
                        {issue.action}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px 0' }}>First Response</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {issue.first_time_response
                          ? new Date(issue.first_time_response).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                          : '-'}
                      </p>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '10px', color: '#64748B', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Duration</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                        {issue.duration_days ? `${issue.duration_days} days` : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Troubleshoot Period */}
                  {(issue.troubleshoot_date_start || issue.troubleshoot_date_end) && (
                    <div style={{
                      background: '#FEF3C7',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🔧</span>
                      <span style={{ fontSize: '13px', color: '#92400E' }}>
                        {issue.troubleshoot_date_start && new Date(issue.troubleshoot_date_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {' → '}
                        {issue.troubleshoot_date_end && new Date(issue.troubleshoot_date_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  )}

                  {/* PIC Badge */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: `${picColor}15`,
                      color: picColor,
                      border: `1px solid ${picColor}30`
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: picColor }} />
                      {issue.pic || 'Unassigned'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ margin: 0, border: 'none', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th
                    style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      if (sortField === 'issue_no') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortField('issue_no')
                        setSortDirection('asc')
                      }
                    }}
                    title="Click to sort by Issue Number"
                  >
                    No {sortField === 'issue_no' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '12px 10px' }}>Date</th>
                  <th style={{ padding: '12px 10px' }}>Customer</th>
                  <th style={{ padding: '12px 10px' }}>Project</th>
                  <th style={{ padding: '12px 10px', minWidth: '200px' }}>Issue</th>
                  <th style={{ padding: '12px 10px' }}>Response</th>
                  <th style={{ padding: '12px 10px' }}>T.Start</th>
                  <th style={{ padding: '12px 10px' }}>T.End</th>
                  <th
                    style={{ padding: '12px 10px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}
                    onClick={() => {
                      if (sortField === 'duration_days') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortField('duration_days')
                        setSortDirection('desc')
                      }
                    }}
                    title="Click to sort by Duration"
                  >
                    Days {sortField === 'duration_days' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '12px 10px', minWidth: '150px' }}>Action</th>
                  <th style={{ padding: '12px 10px' }}>Status</th>
                  <th style={{ padding: '12px 10px' }}>PIC</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '48px 24px' }}>
                      <p style={{ color: '#64748B', margin: 0 }}>No issues found</p>
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => {
                    const badgeStyle = statusBadgeColors[issue.status?.toLowerCase() || ''] || { bg: '#F3F4F6', color: '#4B5563', border: '#D1D5DB' }
                    const picColor = getPICColor(issue.pic)

                    return (
                      <tr key={issue.id}>
                        <td style={{ fontWeight: 600, padding: '10px' }}>{issue.issue_no}</td>
                        <td style={{ padding: '10px' }}>
                          {issue.entry_issue_date
                            ? new Date(issue.entry_issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : '-'}
                        </td>
                        <td style={{ padding: '10px' }}>{issue.customer}</td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>{issue.project_number}</td>
                        <td style={{ padding: '10px', maxWidth: '200px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {issue.issue_description}
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          {issue.first_time_response
                            ? new Date(issue.first_time_response).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : '-'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          {issue.troubleshoot_date_start
                            ? new Date(issue.troubleshoot_date_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : '-'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '12px' }}>
                          {issue.troubleshoot_date_end
                            ? new Date(issue.troubleshoot_date_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                            : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>
                          {issue.duration_days || '-'}
                        </td>
                        <td style={{ padding: '10px', maxWidth: '150px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
                            {issue.action}
                          </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`
                          }}>
                            {issue.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: `${picColor}15`,
                            color: picColor,
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: picColor }} />
                            {issue.pic || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}
