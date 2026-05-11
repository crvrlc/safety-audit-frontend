import { useEffect, useState, useMemo } from 'react'
import api from '../../services/api'
import { FiSearch, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
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

const capitalizeSeverity = (s) => {
  if (!s) return '—'
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const isOverdue = (f) =>
  f.resolutionStatus !== 'resolved' &&
  f.dueDate &&
  new Date(f.dueDate) < new Date()

// ── Finding Detail Modal ──────────────────────────────────────────
const FindingModal = ({ finding, onClose }) => {
  if (!finding) return null
  return (
    <div className="af-modal-overlay" onClick={onClose}>
      <div className="af-modal" onClick={e => e.stopPropagation()}>
        <div className="af-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <code className="af-modal-code">{finding.audit?.inspectionCode ?? '—'}</code>
            {isOverdue(finding) && <span className="af-overdue-badge">Overdue</span>}
          </div>
          <button className="af-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="af-modal-body">
          <div className="af-modal-grid">
            <div className="af-modal-item">
              <span className="af-modal-label">Office</span>
              <span className="af-modal-value">{finding.audit?.office?.name ?? '—'}</span>
            </div>
            <div className="af-modal-item">
              <span className="af-modal-label">Facility</span>
              <span className="af-modal-value">{finding.audit?.office?.facility?.name ?? '—'}</span>
            </div>
            <div className="af-modal-item">
              <span className="af-modal-label">Inspector</span>
              <span className="af-modal-value">{finding.audit?.inspector?.name ?? '—'}</span>
            </div>
            <div className="af-modal-item">
              <span className="af-modal-label">Section</span>
              <span className="af-modal-value">{finding.checklistItem?.section?.name ?? '—'}</span>
            </div>
            <div className="af-modal-item">
              <span className="af-modal-label">Severity</span>
              <span className="af-modal-value">
                {finding.severity
                  ? <span className="af-badge" style={getSeverityStyle(finding.severity)}>{capitalizeSeverity(finding.severity)}</span>
                  : '—'}
              </span>
            </div>
            <div className="af-modal-item">
              <span className="af-modal-label">Status</span>
              <span className="af-modal-value">
                <span className="af-badge" style={getResolutionStyle(finding.resolutionStatus)}>
                  {getStatusLabel(finding.resolutionStatus)}
                </span>
              </span>
            </div>
            {finding.assignedTo && (
              <div className="af-modal-item">
                <span className="af-modal-label">Assigned To</span>
                <span className="af-modal-value">{finding.assignedTo}</span>
              </div>
            )}
            <div className="af-modal-item">
              <span className="af-modal-label">Due Date</span>
              <span className="af-modal-value" style={{ color: isOverdue(finding) ? '#b91c1c' : 'inherit', fontWeight: isOverdue(finding) ? 600 : 400 }}>
                {formatDate(finding.dueDate)}{isOverdue(finding) ? ' (Overdue)' : ''}
              </span>
            </div>
            {finding.resolvedAt && (
              <div className="af-modal-item">
                <span className="af-modal-label">Resolved At</span>
                <span className="af-modal-value">{formatDate(finding.resolvedAt)}</span>
              </div>
            )}
          </div>

          {finding.checklistItem?.statement && (
            <div className="af-modal-box">
              <div className="af-modal-box-label">Checklist Item</div>
              <div className="af-modal-box-text">{finding.checklistItem.statement}</div>
            </div>
          )}

          <div className="af-modal-box">
            <div className="af-modal-box-label">🔍 Finding</div>
            <div className="af-modal-box-text">{finding.finding || '—'}</div>
          </div>

          <div className="af-modal-box">
            <div className="af-modal-box-label">📝 Recommended Corrective Action</div>
            <div className="af-modal-box-text">{finding.correctiveAction || '—'}</div>
          </div>

          {finding.resolutionNote && (
            <div className="af-modal-box af-modal-box--resolved">
              <div className="af-modal-box-label">✅ Resolution Note</div>
              <div className="af-modal-box-text">{finding.resolutionNote}</div>
            </div>
          )}

          {finding.resolutionEvidence && (
            <div className="af-modal-box">
              <div className="af-modal-box-label">📎 Resolution Evidence</div>
              <div className="af-modal-box-text">
                {finding.resolutionEvidence.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                  <img
                    src={finding.resolutionEvidence}
                    alt="evidence"
                    className="af-evidence-thumb"
                    onClick={() => window.open(finding.resolutionEvidence, '_blank')}
                  />
                ) : (
                  <a href={finding.resolutionEvidence} target="_blank" rel="noreferrer">View File</a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="af-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
const AdminFindings = () => {
  const [findings,        setFindings]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedFinding, setSelectedFinding] = useState(null)

  const [search,         setSearch]         = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const [overdueFilter,  setOverdueFilter]  = useState(false)
  const [facilityFilter, setFacilityFilter] = useState('')
  const [sectionFilter,  setSectionFilter]  = useState('')
  const [page,           setPage]           = useState(1)

  useEffect(() => {
    api.get('/findings')
      .then(res => setFindings(res.data))
      .catch(err => console.error('Fetch findings error:', err))
      .finally(() => setLoading(false))
  }, [])

  const facilities = useMemo(() => {
    const names = new Set(findings.map(f => f.audit?.office?.facility?.name).filter(Boolean))
    return [...names].sort()
  }, [findings])

  const sections = useMemo(() => {
    const names = new Set(findings.map(f => f.checklistItem?.section?.name).filter(Boolean))
    return [...names].sort()
  }, [findings])

  const counts = useMemo(() => ({
    total:    findings.length,
    open:     findings.filter(f => f.resolutionStatus === 'pending').length,
    assigned: findings.filter(f => f.resolutionStatus === 'assigned').length,
    resolved: findings.filter(f => f.resolutionStatus === 'resolved').length,
    overdue:  findings.filter(isOverdue).length,
  }), [findings])

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
      const matchOverdue  = !overdueFilter  || isOverdue(f)
      const matchFacility = !facilityFilter || f.audit?.office?.facility?.name === facilityFilter
      const matchSection  = !sectionFilter  || f.checklistItem?.section?.name === sectionFilter
      return matchSearch && matchStatus && matchOverdue && matchFacility && matchSection
    })
  }, [findings, search, statusFilter, overdueFilter, facilityFilter, sectionFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, statusFilter, overdueFilter, facilityFilter, sectionFilter])

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setOverdueFilter(false)
    setFacilityFilter(''); setSectionFilter('')
  }

  const hasFilters = search || statusFilter || overdueFilter || facilityFilter || sectionFilter

  const handleCardClick = (key) => {
    if (key === 'total')   { clearFilters(); return }
    if (key === 'overdue') { setStatusFilter(''); setOverdueFilter(p => !p); return }
    setOverdueFilter(false)
    setStatusFilter(p => p === key ? '' : key)
  }

  if (loading) return (
    <div className="af-loading"><div className="af-spinner" /></div>
  )

  return (
    <div className="af-page">

      <div className="af-header">
        <div>
          <h4 className="page-title">Findings and Corrective Actions</h4>
          <p className="af-subtitle">
            All non-compliant items and their corrective action status across all audits and facilities
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="af-cards-grid">
        {[
          { key: 'total',    label: 'Total Findings', value: counts.total,    color: '#8B0000', active: !statusFilter && !overdueFilter },
          { key: 'pending',  label: 'Open',           value: counts.open,     color: '#b45309', active: statusFilter === 'pending' && !overdueFilter },
          { key: 'assigned', label: 'Assigned',       value: counts.assigned, color: '#6d28d9', active: statusFilter === 'assigned' && !overdueFilter },
          { key: 'resolved', label: 'Resolved',       value: counts.resolved, color: '#166534', active: statusFilter === 'resolved' && !overdueFilter },
          { key: 'overdue',  label: 'Overdue',        value: counts.overdue,  color: '#b91c1c', active: overdueFilter },
        ].map(c => (
          <div
            key={c.key}
            className={`af-card af-card--clickable ${c.active ? 'af-card--active' : ''}`}
            style={{ borderBottom: `3px solid ${c.color}` }}
            onClick={() => handleCardClick(c.key)}
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
            type="text" className="af-search"
            placeholder="Search finding, inspection code, office, inspector..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="af-select" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setOverdueFilter(false) }}>
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
        {hasFilters && <button className="btn-secondary" onClick={clearFilters}>Clear</button>}
      </div>

      <p className="af-results-label">
        {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
        {overdueFilter ? ' — overdue only' : hasFilters ? ' matching filters' : ''}
      </p>

      {/* Table */}
      <div className="af-table-wrap">
        <table className="af-table">
          <thead>
            <tr>
              <th>Inspection Code</th>
              <th>Office / Facility</th>
              <th>Inspector</th>
              <th>Finding</th>
              <th>Severity</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="af-empty-row">
                  {hasFilters ? 'No findings match your filters.' : 'No findings recorded yet.'}
                </td>
              </tr>
            ) : paginated.map(f => (
              <tr
                key={f.id}
                className={`af-row--clickable ${isOverdue(f) ? 'af-row--overdue' : ''}`}
                onClick={() => setSelectedFinding(f)}
              >
                <td><code className="af-code">{f.audit?.inspectionCode ?? '—'}</code></td>
                <td>
                  <div className="af-office-cell">
                    <span className="af-office">{f.audit?.office?.name ?? '—'}</span>
                    <span className="af-facility">{f.audit?.office?.facility?.name ?? ''}</span>
                  </div>
                </td>
                <td className="af-inspector">{f.audit?.inspector?.name ?? '—'}</td>
                <td className="af-truncate" title={f.finding}>{f.finding || '—'}</td>
                <td>
                  {f.severity
                    ? <span className="af-badge" style={getSeverityStyle(f.severity)}>{capitalizeSeverity(f.severity)}</span>
                    : '—'}
                </td>
                <td className="af-assigned">
                  {f.assignedTo
                    ? <span className="af-assigned-text">{f.assignedTo}</span>
                    : <span className="af-unassigned">—</span>}
                </td>
                <td>
                  <span className="af-badge" style={getResolutionStyle(f.resolutionStatus)}>
                    {getStatusLabel(f.resolutionStatus)}
                  </span>
                </td>
                <td className={isOverdue(f) ? 'af-overdue-date' : ''}>
                  {formatDate(f.dueDate)}
                  {isOverdue(f) && <span className="af-overdue-tag"> ⚠</span>}
                </td>
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
            <button className="af-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
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
                  : <button key={item} className={`af-page-btn ${item === page ? 'af-page-btn--active' : ''}`} onClick={() => setPage(item)}>{item}</button>
              )
            }
            <button className="af-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedFinding && (
        <FindingModal finding={selectedFinding} onClose={() => setSelectedFinding(null)} />
      )}

    </div>
  )
}

export default AdminFindings