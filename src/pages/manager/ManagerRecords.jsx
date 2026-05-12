// src/pages/manager/ManagerRecords.jsx
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { generateReport } from '../../utils/generateReport'
import { generateResolutionReport } from '../../utils/generateResolutionReport'
import '../css/ManagerRecords.css'
import '../css/ManagerShared.css'
import { FiClipboard, FiTrendingUp, FiCheckCircle, FiSearch, FiFileText } from 'react-icons/fi'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const ManagerRecords = () => {
  const { user }    = useAuth()
  const [audits,    setAudits]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [dateFilter,     setDateFilter]     = useState('all')
  const [generating,     setGenerating]     = useState(null)

  useEffect(() => {
    if (!user?.token) return
    api.get('/manager/audits?status=completed')
      .then(res => setAudits(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [user])

  // Summary metrics
  const summaryStats = useMemo(() => {
    const totalAudits = audits.length
    const avgRate = audits.length > 0
      ? Math.round(
          audits.reduce((sum, a) => sum + (a.auditReport?.complianceRate ?? 0), 0) / audits.length
        )
      : 0
    const totalResolved = audits.reduce((sum, a) => {
      const resolved = a.auditResponses?.filter(r => r.resolutionStatus === 'resolved').length ?? 0
      return sum + resolved
    }, 0)
    return { totalAudits, avgRate, totalResolved }
  }, [audits])

  // Unique facilities for filter
  const facilities = useMemo(() => {
    const names = new Set(audits.map(a => a.office?.facility?.name).filter(Boolean))
    return [...names].sort()
  }, [audits])

  // Date filter logic
  const getDateThreshold = () => {
    const now = new Date()
    if (dateFilter === '1month')  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    if (dateFilter === '3months') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    if (dateFilter === '6months') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    return null
  }

  // Filtered audits
  const filtered = useMemo(() => {
    const q         = search.toLowerCase()
    const threshold = getDateThreshold()
    return audits.filter(a => {
      const matchSearch   = !search ||
        a.inspectionCode?.toLowerCase().includes(q) ||
        a.office?.name?.toLowerCase().includes(q) ||
        a.inspector?.name?.toLowerCase().includes(q) ||
        a.office?.facility?.name?.toLowerCase().includes(q)
      const matchFacility = !facilityFilter || a.office?.facility?.name === facilityFilter
      const matchDate     = !threshold || new Date(a.completedAt ?? a.createdAt) >= threshold
      return matchSearch && matchFacility && matchDate
    })
  }, [audits, search, facilityFilter, dateFilter])

  const hasFilters = search || facilityFilter || dateFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setFacilityFilter('')
    setDateFilter('all')
  }

  const handleGenerateReport = async (audit, type) => {
    setGenerating(`${audit.id}-${type}`)
    try {
      const res = await api.get(`/manager/audits/${audit.id}`)
      if (type === 'inspection') {
        generateReport(res.data)
      } else {
        generateResolutionReport(res.data)
      }
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGenerating(null)
    }
  }

  const hasFindingsResolved = (audit) => {
    return audit.auditResponses?.some(r =>
      r.answer === 'no' && r.resolutionStatus === 'resolved'
    )
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  return (
    <div className="manager-records">

      {/* Header */}
      <div className="page-header">
        <div>
          <h4 className="page-title">Records Archive</h4>
          <p className="page-subtitle">
            Completed inspection reports and resolved corrective actions available for download
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="records-summary-grid">
        <div className="records-summary-card" style={{ borderBottom: '4px solid #8B0000' }}>
          <div className="rsc-icon" style={{ color: '#8B0000' }}>
            <FiClipboard size={20} />
          </div>
          <div className="rsc-value" style={{ color: '#8B0000' }}>{summaryStats.totalAudits}</div>
          <div className="rsc-label">Completed Audits</div>
        </div>

        <div className="records-summary-card" style={{ borderBottom: '4px solid #1565c0' }}>
          <div className="rsc-icon" style={{ color: '#1565c0' }}>
            <FiTrendingUp size={20} />
          </div>
          <div className="rsc-value" style={{ color: '#1565c0' }}>
            {summaryStats.avgRate}%
          </div>
          <div className="rsc-label">Average Compliance Rate</div>
        </div>

        <div className="records-summary-card" style={{ borderBottom: '4px solid #2e7d32' }}>
          <div className="rsc-icon" style={{ color: '#2e7d32' }}>
            <FiCheckCircle size={20} />
          </div>
          <div className="rsc-value" style={{ color: '#2e7d32' }}>{summaryStats.totalResolved}</div>
          <div className="rsc-label">Total Findings Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="findings-filters">
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} size={14} />
          <input
            className="filter-input"
            style={{ paddingLeft: 30 }}
            placeholder="Search inspection code, office, inspector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
          <option value="">All Facilities</option>
          {facilities.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
          <option value="all">All Time</option>
          <option value="1month">Last Month</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
        </select>

        {hasFilters && (
          <button className="btn-secondary" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* Results count */}
      <p style={{ fontSize: '0.775rem', color: '#888', margin: '0 0 8px' }}>
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        {hasFilters ? ' matching filters' : ''}
      </p>

      {/* Table */}
      <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="findings-table-wrap">
          <table className="findings-table">
            <thead>
              <tr>
                <th>Inspection Code</th>
                <th>Office / Facility</th>
                <th>Inspector</th>
                <th>Compliance Rate</th>
                <th>Findings</th>
                <th>Completed Date</th>
                <th>Inspection Report</th>
                <th>Resolution Report</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    {hasFilters ? 'No records match your filters.' : 'No completed audits yet.'}
                  </td>
                </tr>
              ) : filtered.map(a => {
                const rate         = a.auditReport?.complianceRate
                const findingCount = a.auditResponses?.filter(r =>
                  r.answer === 'no' && (r.finding?.trim() || r.correctiveAction?.trim())
                ).length ?? 0
                const hasResolution = hasFindingsResolved(a)
                const rateColor    = rate >= 85 ? '#166534' : rate >= 70 ? '#b45309' : '#b91c1c'

                return (
                  <tr key={a.id}>
                    <td className="mono-cell">{a.inspectionCode}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1a1a2e' }}>
                        {a.office?.name ?? '—'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#888' }}>
                        {a.office?.facility?.name ?? ''}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{a.inspector?.name ?? '—'}</td>
                    <td>
                      {rate != null ? (
                        <span style={{ fontWeight: 700, color: rateColor, fontSize: '0.85rem' }}>
                          {rate}%
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {findingCount > 0 ? (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          background: '#fee2e2', color: '#b91c1c',
                          padding: '2px 8px', borderRadius: 99
                        }}>
                          {findingCount} finding{findingCount !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          background: '#dcfce7', color: '#166534',
                          padding: '2px 8px', borderRadius: 99
                        }}>
                          Clean
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{fmtDate(a.completedAt)}</td>
                    <td>
                      <button
                        className="btn-sm btn-pdf"
                        onClick={() => handleGenerateReport(a, 'inspection')}
                        disabled={generating === `${a.id}-inspection`}
                      >
                        <FiFileText size={12} style={{ marginRight: 4 }} />
                        {generating === `${a.id}-inspection` ? '...' : 'Download'}
                      </button>
                    </td>
                    <td>
                      {hasResolution ? (
                        <button
                          className="btn-sm btn-pdf"
                          onClick={() => handleGenerateReport(a, 'resolution')}
                          disabled={generating === `${a.id}-resolution`}
                        >
                          <FiFileText size={12} style={{ marginRight: 4 }} />
                          {generating === `${a.id}-resolution` ? '...' : 'Download'}
                        </button>
                      ) : (
                        <span style={{ color: '#ccc', fontSize: '0.78rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default ManagerRecords