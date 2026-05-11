import { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import { FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import '../css/AdminFindings.css'

const PAGE_SIZE = 15

const getResolutionStyle = (status) => {
  switch (status) {
    case 'resolved': return { background: '#dcfce7', color: '#166534' }
    case 'assigned': return { background: '#ede9fe', color: '#6d28d9' }
    case 'pending':  return { background: '#fef3c7', color: '#b45309' }
    default:         return { background: '#f3f4f6', color: '#6b7280' }
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':  return 'Open'
    case 'assigned': return 'Assigned'
    case 'resolved': return 'Resolved'
    default:         return status ?? '—'
  }
}

const getSeverityStyle = (severity) => {
  switch (severity) {
    case 'high':   return { background: '#fee2e2', color: '#b91c1c' }
    case 'medium': return { background: '#fef9c3', color: '#b45309' }
    case 'low':    return { background: '#dcfce7', color: '#166534' }
    default:       return { background: '#f3f4f6', color: '#6b7280' }
  }
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const AdminFindings = () => {
  const [findings, setFindings] = useState([])
  const [loading,  setLoading]  = useState(true)

  // Filters
  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [sectionFilter,  setSectionFilter]  = useState('')

  // Pagination
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/findings')
      .then(res => setFindings(res.data))
      .catch(err => console.error('Fetch findings error:', err))
      .finally(() => setLoading(false))
  }, [])

  // Unique values for filter dropdowns
  const facilities = useMemo(() => {
    const names = new Set(
      findings.map(f => f.audit?.office?.facility?.name).filter(Boolean)
    )
    return [...names].sort()
  }, [findings])

  const sections = useMemo(() => {
    const names = new Set(
      findings.map(f => f.checklistItem?.section?.name).filter(Boolean)
    )
    return [...names].sort()
  }, [findings])

  // Summary counts
  const counts = useMemo(() => ({
    total:    findings.length,
    open:     findings.filter(f => f.resolutionStatus === 'pending').length,
    assigned: findings.filter(f => f.resolutionStatus === 'assigned').length,
    resolved: findings.filter(f => f.resolutionStatus === 'resolved').length,
    overdue:  findings.filter(f =>
      f.resolutionStatus !== 'resolved' &&
      f.dueDate &&
      new Date(f.dueDate) < new Date()
    ).length,
  }), [findings])

  // Filter + search
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return findings.filter(f => {
      const matchSearch = !search ||
        f.finding?.toLowerCase().includes(q) ||
        f.correctiveAction?.toLowerCase().includes(q) ||
        f.audit?.inspectionCode?.toLowerCase().includes(q) ||
        f.audit?.office?.name?.toLowerCase().includes(q) ||
        f.audit?.inspector?.name?.toLowerCase().includes(q) ||
        f.audit?.office?.facility?.name?.toLowerCase().includes(q)

      const matchStatus   = !statusFilter   || f.resolutionStatus === statusFilter
      const matchFacility = !facilityFilter || f.audit?.office?.facility?.name === facilityFilter
      const matchSection  = !sectionFilter  || f.checklistItem?.section?.name === sectionFilter

      return matchSearch && matchStatus && matchFacility && matchSection
    })
  }, [findings, search, statusFilter, facilityFilter, sectionFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter, facilityFilter, sectionFilter])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setFacilityFilter('')
    setSectionFilter('')
  }

  const hasFilters = search || statusFilter || facilityFilter || sectionFilter

  if (loading) return (
    <div className="af-loading">
      <div className="af-spinner" />
    </div>
  )

  return (
    <div className="af-page">

      {/* Header */}
      <div className="af-header">
        <div>
          <h4 className="page-title">Findings</h4>
          <p className="af-subtitle">All non-compliant items across all audits and facilities</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="af-cards-grid">
        {[
          { label: 'Total Findings', value: counts.total,    color: '#8B0000',  active: !statusFilter,             onClick: () => setStatusFilter('') },
          { label: 'Open',           value: counts.open,     color: '#b45309',  active: statusFilter === 'pending',  onClick: () => setStatusFilter(s => s === 'pending'  ? '' : 'pending') },
          { label: 'Assigned',       value: counts.assigned, color: '#6d28d9',  active: statusFilter === 'assigned', onClick: () => setStatusFilter(s => s === 'assigned' ? '' : 'assigned') },
          { label: 'Resolved',       value: counts.resolved, color: '#166534',  active: statusFilter === 'resolved', onClick: () => setStatusFilter(s => s === 'resolved' ? '' : 'resolved') },
          { label: 'Overdue',        value: counts.overdue,  color: '#b91c1c',  active: false,                       onClick: null },
        ].map((c, i) => (
          <div
            key={i}
            className={`af-card ${c.active ? 'af-card--active' : ''} ${c.onClick ? 'af-card--clickable' : ''}`}
            style={{ borderBottom: `3px solid ${c.color}` }}
            onClick={c.onClick ?? undefined}
          >
            <div className="af-card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="af-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="af-filter-row">
        <div className="af-search-wrap">
          <FiSearch className="af-search-icon" size={14} />
          <input
            type="text"
            className="af-search"
            placeholder="Search finding, inspection code, office, inspector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="af-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Open</option>
          <option value="assigned">Assigned</option>
          <option value="resolved">Resolved</option>
        </select>

        <select className="af-select" value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
          <option value="">All Facilities</option>
          {facilities.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select className="af-select" value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
          <option value="">All Sections</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {hasFilters && (
          <button className="btn-secondary" onClick={clearFilters}>Clear</button>
        )}
      </div>

      {/* Results count */}
      <p className="af-results-label">
        {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
        {hasFilters ? ' matching filters' : ''}
      </p>

      {/* Table */}
      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Inspection Code</th>
              <th>Facility / Office</th>
              <th>Inspector</th>
              <th>Section</th>
              <th>Finding</th>
              <th>Corrective Action</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={10} className="af-empty-row">
                  {hasFilters ? 'No findings match your filters.' : 'No findings recorded yet.'}
                </td>
              </tr>
            ) : paginated.map(f => (
              <tr key={f.id} className={
                f.resolutionStatus !== 'resolved' && f.dueDate && new Date(f.dueDate) < new Date()
                  ? 'af-row--overdue' : ''
              }>
                <td><code className="af-code">{f.audit?.inspectionCode ?? '—'}</code></td>
                <td>
                  <div className="af-office-cell">
                    <span className="af-facility">{f.audit?.office?.facility?.name ?? '—'}</span>
                    <span className="af-office">{f.audit?.office?.name ?? ''}</span>
                  </div>
                </td>
                <td className="af-inspector">{f.audit?.inspector?.name ?? '—'}</td>
                <td className="af-section">{f.checklistItem?.section?.name ?? '—'}</td>
                <td className="af-truncate" title={f.finding}>{f.finding || '—'}</td>
                <td className="af-truncate" title={f.correctiveAction}>{f.correctiveAction || '—'}</td>
                <td>
                  {f.severity ? (
                    <span className="af-badge" style={getSeverityStyle(f.severity)}>
                      {f.severity}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  <span className="af-badge" style={getResolutionStyle(f.resolutionStatus)}>
                    {getStatusLabel(f.resolutionStatus)}
                  </span>
                </td>
                <td className={
                  f.resolutionStatus !== 'resolved' && f.dueDate && new Date(f.dueDate) < new Date()
                    ? 'af-overdue-date' : ''
                }>
                  {formatDate(f.dueDate)}
                </td>
                <td>{formatDate(f.resolvedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="af-pagination">
          <span className="af-pagination-info">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="af-pagination-controls">
            <button
              className="af-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <FiChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((item, idx) =>
                item === '...'
                  ? <span key={`ellipsis-${idx}`} className="af-page-ellipsis">…</span>
                  : <button
                      key={item}
                      className={`af-page-btn ${item === page ? 'af-page-btn--active' : ''}`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
              )
            }
            <button
              className="af-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminFindings