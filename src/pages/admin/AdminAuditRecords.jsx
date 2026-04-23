import { useState, useEffect, useMemo } from 'react'
import api from '../../services/api'
import { generateReport } from '../../utils/generateReport'
import { generateResolutionReport } from '../../utils/generateResolutionReport'
import '../css/AdminAuditRecords.css'

import {
  FiClipboard, FiCheckCircle, FiAlertCircle, FiClock,
  FiSearch, FiFilter, FiEye, FiFileText, FiChevronLeft, FiChevronRight
} from 'react-icons/fi'


// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  draft:          { label: 'Draft',          color: '#78909c', bg: '#eceff1' },
  scheduled:      { label: 'Scheduled',      color: '#1565c0', bg: '#e3f2fd' },
  ongoing:        { label: 'Ongoing',        color: '#e65100', bg: '#fff3e0' },
  submitted:      { label: 'Submitted',      color: '#6a1b9a', bg: '#f3e5f5' },
  acknowledged:   { label: 'Acknowledged',   color: '#00695c', bg: '#e0f2f1' },
  resolving:      { label: 'Resolving',      color: '#f57f17', bg: '#fffde7' },
  pending_review: { label: 'Pending Review', color: '#ad1457', bg: '#fce4ec' },
  completed:      { label: 'Completed',      color: '#2e7d32', bg: '#e8f5e9' },
  archived:       { label: 'Archived',       color: '#455a64', bg: '#eceff1' },
}

const TYPE_META = {
  routine:   { label: 'Routine',   color: '#1565c0' },
  follow_up: { label: 'Follow-up', color: '#e65100' },
}

const ALL_STATUSES = Object.keys(STATUS_META)

const PAGE_SIZE = 10

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

const getRelevantDate = (audit) => {
  if (audit.completedAt)    return { label: 'Completed',  value: audit.completedAt }
  if (audit.submittedAt)    return { label: 'Submitted',  value: audit.submittedAt }
  if (audit.acknowledgedAt) return { label: 'Acknowledged', value: audit.acknowledgedAt }
  if (audit.scheduledAt)    return { label: 'Scheduled',  value: audit.scheduledAt }
  return                           { label: 'Created',    value: audit.createdAt }
}

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: '#555', bg: '#eee' }
  return (
    <span className="ar-status-badge" style={{ color: meta.color, background: meta.bg }}>
      {meta.label}
    </span>
  )
}

const TypeBadge = ({ type }) => {
  const meta = TYPE_META[type] || { label: type, color: '#555' }
  return (
    <span className="ar-type-badge" style={{ color: meta.color, borderColor: meta.color }}>
      {meta.label}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, accent, active, onClick }) => (
  <div
    className={`ar-stat-card ${active ? 'ar-stat-card--active' : ''}`}
    style={{ borderBottom: `4px solid ${accent}`, cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <div className="ar-stat-icon" style={{ color: accent }}>{icon}</div>
    <div className="ar-stat-value" style={{ color: accent }}>{value}</div>
    <div className="ar-stat-label">{label}</div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminAuditRecords = () => {
  const [audits, setAudits]       = useState([])
  const [loading, setLoading]     = useState(true)

  // Filters
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter]     = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)

  // Detail modal
  const [detailAudit, setDetailAudit] = useState(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    api.get('/audits')
      .then(res => setAudits(res.data))
      .catch(err => console.error('Fetch audits error:', err))
      .finally(() => setLoading(false))
  }, [])

  // ── Derived counts for stat cards ─────────────────────────────────────────
  const counts = useMemo(() => ({
    total:          audits.length,
    submitted:      audits.filter(a => a.status === 'submitted').length,
    acknowledged:   audits.filter(a => a.status === 'acknowledged').length,
    resolving:      audits.filter(a => a.status === 'resolving').length,
    pending_review: audits.filter(a => a.status === 'pending_review').length,
    completed:      audits.filter(a => a.status === 'completed').length,
    ongoing:        audits.filter(a => ['draft','scheduled','ongoing'].includes(a.status)).length,
  }), [audits])

  // ── Unique facilities for filter dropdown ──────────────────────────────────
  const facilities = useMemo(() => {
    const names = new Set(audits.map(a => a.office?.facility?.name).filter(Boolean))
    return [...names].sort()
  }, [audits])

  // ── Filter + Search ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return audits.filter(a => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        a.inspectionCode?.toLowerCase().includes(q) ||
        a.office?.name?.toLowerCase().includes(q) ||
        a.office?.facility?.name?.toLowerCase().includes(q) ||
        a.inspector?.name?.toLowerCase().includes(q)

      const matchStatus   = !statusFilter   || a.status === statusFilter
      const matchType     = !typeFilter     || a.inspectionType === typeFilter
      const matchFacility = !facilityFilter || a.office?.facility?.name === facilityFilter

      return matchSearch && matchStatus && matchType && matchFacility
    })
  }, [audits, search, statusFilter, typeFilter, facilityFilter])

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter, facilityFilter])

  const handleStatCardClick = (status) => {
    setStatusFilter(prev => prev === status ? '' : status)
  }

  // ── View PDF ───────────────────────────────────────────────────────────────
  // Resolution report: resolving → completed (CAs resolved, officer signed off)
  // Inspection report: submitted → acknowledged (before resolution phase)
  const RESOLUTION_STATUSES = ['resolving', 'pending_review', 'completed', 'archived']

  const pickReportFn = (status) =>
    RESOLUTION_STATUSES.includes(status) ? generateResolutionReport : generateReport

  const handleViewPdf = async (audit) => {
    const reportFn = pickReportFn(audit.status)

    // auditResponses already included in getAudits — use directly if present
    if (audit.auditResponses?.length > 0) {
      reportFn(audit)
      return
    }
    // Fetch full audit with nested data if not already loaded
    try {
      const res = await api.get(`/audits/${audit.id}`)
      reportFn(res.data)
    } catch (err) {
      console.error('Failed to fetch audit for PDF:', err)
    }
  }

  if (loading) return (
    <div className="admin-loading">
      <div className="spinner" style={{ borderTopColor: '#8B0000' }} />
    </div>
  )

  return (
    <div className="admin-audit-records">

      {/* ── Page Header ── */}
      <div className="page-header">
        <h4 className="page-title">Audit Records</h4>
        <p className="page-subtitle">All inspections across all offices and inspectors</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="ar-stat-grid">
        <StatCard
          icon={<FiClipboard size={18} />}
          label="Total Audits"
          value={counts.total}
          accent="#8B0000"
          active={!statusFilter}
          onClick={() => setStatusFilter('')}
        />
        <StatCard
          icon={<FiClock size={18} />}
          label="In Progress"
          value={counts.ongoing}
          accent="#e65100"
          active={statusFilter === 'ongoing'}
          onClick={() => handleStatCardClick('ongoing')}
        />
        <StatCard
          icon={<FiAlertCircle size={18} />}
          label="Submitted"
          value={counts.submitted}
          accent="#6a1b9a"
          active={statusFilter === 'submitted'}
          onClick={() => handleStatCardClick('submitted')}
        />
        <StatCard
          icon={<FiAlertCircle size={18} />}
          label="Acknowledged"
          value={counts.acknowledged}
          accent="#00695c"
          active={statusFilter === 'acknowledged'}
          onClick={() => handleStatCardClick('acknowledged')}
        />
        <StatCard
          icon={<FiClock size={18} />}
          label="Resolving"
          value={counts.resolving}
          accent="#f57f17"
          active={statusFilter === 'resolving'}
          onClick={() => handleStatCardClick('resolving')}
        />
        <StatCard
          icon={<FiClock size={18} />}
          label="Pending Review"
          value={counts.pending_review}
          accent="#ad1457"
          active={statusFilter === 'pending_review'}
          onClick={() => handleStatCardClick('pending_review')}
        />
        <StatCard
          icon={<FiCheckCircle size={18} />}
          label="Completed"
          value={counts.completed}
          accent="#2e7d32"
          active={statusFilter === 'completed'}
          onClick={() => handleStatCardClick('completed')}
        />
      </div>

      {/* ── Filters ── */}
      <div className="filter-row">
        <div className="filter-search-wrap">
          <FiSearch className="filter-search-icon" size={14} />
          <input
            type="text"
            className="filter-input"
            placeholder="Search inspection code, office, inspector..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>

        <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="routine">Routine</option>
          <option value="follow_up">Follow-up</option>
        </select>

        <select className="filter-select" value={facilityFilter} onChange={e => setFacilityFilter(e.target.value)}>
          <option value="">All Facilities</option>
          {facilities.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {(search || statusFilter || typeFilter || facilityFilter) && (
          <button
            className="btn-secondary"
            onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setFacilityFilter('') }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Inspection ID</th>
              <th>Type</th>
              <th>Office / Facility</th>
              <th>Inspector</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">No audits found</td>
              </tr>
            ) : paginated.map(audit => {
              const date       = getRelevantDate(audit)
              const canPdf     = ["submitted","acknowledged","resolving","pending_review","completed","archived"].includes(audit.status)
              const isResolution = ["resolving","pending_review","completed","archived"].includes(audit.status)

              return (
                <tr key={audit.id}>
                  <td>
                    <span className="ar-code">{audit.inspectionCode}</span>
                  </td>
                  <td>
                    <TypeBadge type={audit.inspectionType} />
                  </td>
                  <td>
                    <div className="ar-office-cell">
                      <span className="ar-office-name">{audit.office?.name ?? '—'}</span>
                      <span className="ar-facility-name">{audit.office?.facility?.name ?? ''}</span>
                    </div>
                  </td>
                  <td>
                    <span className="ar-inspector">{audit.inspector?.name ?? '—'}</span>
                  </td>
                  <td>
                    <div className="ar-date-cell">
                      <span className="ar-date-value">{formatDate(date.value)}</span>
                      <span className="ar-date-label">{date.label}</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={audit.status} />
                  </td>
                  <td>
                    <div className="action-btns">
                      {/* <button
                        className="btn-sm btn-edit"
                        onClick={() => setDetailAudit(audit)}
                        title="View Details"
                      >
                        <FiEye size={13} style={{ marginRight: 4 }} />
                        View
                      </button> */}
                      <button
                        className={`btn-sm ${canPdf ? "btn-pdf" : "btn-pdf btn-pdf--disabled"}`}
                        onClick={() => canPdf && handleViewPdf(audit)}
                        disabled={!canPdf}
                        title={canPdf ? (isResolution ? 'View Resolution Report' : 'View Inspection Report') : 'Report not available yet'}
                      >
                        <FiFileText size={13} style={{ marginRight: 4 }} />
                        {isResolution ? 'Resolution' : 'Report'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="ar-pagination">
          <span className="ar-pagination-info">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="ar-pagination-controls">
            <button
              className="ar-page-btn"
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
                  ? <span key={`ellipsis-${idx}`} className="ar-page-ellipsis">…</span>
                  : <button
                      key={item}
                      className={`ar-page-btn ${item === page ? 'ar-page-btn--active' : ''}`}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </button>
              )
            }
            <button
              className="ar-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailAudit && (
        <div className="au-modal-overlay" onClick={() => setDetailAudit(null)}>
          <div className="au-modal ar-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="au-modal-close" onClick={() => setDetailAudit(null)}>✕</button>

            <div className="ar-detail-header">
              <div>
                <h3 className="ar-detail-code">{detailAudit.inspectionCode}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <StatusBadge status={detailAudit.status} />
                  <TypeBadge type={detailAudit.inspectionType} />
                </div>
              </div>
            </div>

            <div className="ar-detail-grid">
              <div className="ar-detail-item">
                <span className="ar-detail-label">Office</span>
                <span className="ar-detail-value">{detailAudit.office?.name ?? '—'}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Facility</span>
                <span className="ar-detail-value">{detailAudit.office?.facility?.name ?? '—'}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Inspector</span>
                <span className="ar-detail-value">{detailAudit.inspector?.name ?? '—'}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Inspector Email</span>
                <span className="ar-detail-value">{detailAudit.inspector?.email ?? '—'}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Scheduled</span>
                <span className="ar-detail-value">{formatDate(detailAudit.scheduledAt)}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Submitted</span>
                <span className="ar-detail-value">{formatDate(detailAudit.submittedAt)}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Completed</span>
                <span className="ar-detail-value">{formatDate(detailAudit.completedAt)}</span>
              </div>
              <div className="ar-detail-item">
                <span className="ar-detail-label">Created</span>
                <span className="ar-detail-value">{formatDate(detailAudit.createdAt)}</span>
              </div>
              {detailAudit.auditReport && (
                <>
                  <div className="ar-detail-item">
                    <span className="ar-detail-label">Compliance Rate</span>
                    <span className="ar-detail-value">
                      {detailAudit.auditReport.complianceRate != null
                        ? `${detailAudit.auditReport.complianceRate}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="ar-detail-item">
                    <span className="ar-detail-label">Findings Count</span>
                    <span className="ar-detail-value">
                      {detailAudit.auditReport.findingsCount ?? '—'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {detailAudit.notes && (
              <div className="ar-detail-notes">
                <span className="ar-detail-label">Notes</span>
                <p>{detailAudit.notes}</p>
              </div>
            )}

            <div className="au-modal-footer">
              <button className="btn-secondary" onClick={() => setDetailAudit(null)}>Close</button>
              {["submitted","acknowledged","resolving","pending_review","completed","archived"].includes(detailAudit.status) && (
                <button className="btn-primary" onClick={() => handleViewPdf(detailAudit)}>
                  <FiFileText size={14} style={{ marginRight: 6 }} />
                  {["resolving","pending_review","completed","archived"].includes(detailAudit.status)
                    ? 'View Resolution Report'
                    : 'View Inspection Report'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminAuditRecords