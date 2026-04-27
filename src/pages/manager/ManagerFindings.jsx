// src/pages/manager/ManagerFindings.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { generateResolutionReport } from '../../utils/generateResolutionReport'
import { generateReport } from '../../utils/generateReport'
import api from '../../services/api'
import '../css/ManagerFindings.css'
import '../css/ManagerShared.css'
import {
  FiFileText,
  FiSearch,
  FiTool,
  FiCheckCircle
} from 'react-icons/fi'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const getSeverityClass = (s) => {
  if (s === 'high')   return 'sev-high'
  if (s === 'medium') return 'sev-medium'
  if (s === 'low')    return 'sev-low'
  return 'sev-medium'
}

const getResolutionClass = (s) => {
  if (s === 'resolved') return 'badge-completed'
  if (s === 'assigned') return 'badge-ongoing'
  return 'badge-scheduled'
}

const getAuditStatusClass = (s) => {
  if (s === 'submitted')    return 'badge-submitted'
  if (s === 'acknowledged') return 'badge-ongoing'
  if (s === 'resolving')    return 'badge-resolving'
  if (s === 'pending_review') return 'badge-pending-review'
  if (s === 'completed')    return 'badge-completed'
  return 'badge-draft'
}

const getAuditStatusLabel = (s) => {
  if (s === 'submitted')      return 'Awaiting Acknowledgment'
  if (s === 'acknowledged')   return 'Awaiting CA Assignment'
  if (s === 'resolving')      return 'Corrective Actions In Progress'
  if (s === 'pending_review') return 'Awaiting Officer Sign-Off'
  if (s === 'completed')      return 'Completed'
  return s
}

// ── Assign Modal ──────────────────────────────────────────────────
const AssignModal = ({ finding, sections, onClose, onSaved }) => {
  const [assignedTo, setAssignedTo] = useState(finding?.assignedTo || '')
  const [dueDate,    setDueDate]    = useState('')
  const [saving,     setSaving]     = useState(false)

  const itemStatement = (() => {
    for (const section of sections) {
      const item = section.items?.find(i => i.id === finding?.checklistItemId)
      if (item) return item.statement
    }
    return '—'
  })()

  const handleSubmit = async () => {
    if (!assignedTo.trim()) return
    setSaving(true)
    try {
      await api.patch(`/manager/findings/${finding.id}`, {
        assignedTo: assignedTo.trim(),
        dueDate:    dueDate || undefined,
        resolutionStatus: 'assigned'
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Assign Corrective Action</h5>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-info-block">
            <div className="modal-info-row">
              <span className="modal-info-label">Inspection Code</span>
              <span className="modal-info-value mono">
                {finding?.audit?.inspectionCode}
              </span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Office</span>
              <span className="modal-info-value">
                {finding?.audit?.office?.name} —{' '}
                {finding?.audit?.office?.facility?.name}
              </span>
            </div>
            {/* <pre>{JSON.stringify(finding, null, 2)}</pre> */}
            <div className="modal-info-row">
              <span className="modal-info-label">Checklist Item</span>
              <span className="modal-info-value">{finding?.checklistItem?.statement}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Severity</span>
              <span className={`severity-badge ${getSeverityClass(finding?.severity)}`}>
                {finding?.severity || '—'}
              </span>
            </div>
          </div>

          <div className="modal-finding-box">
            <div className="modal-finding-label">🔍 Finding</div>
            <div className="modal-finding-text">{finding?.finding || '—'}</div>
          </div>

          <div className="modal-finding-box">
            <div className="modal-finding-label">📝 Recommended Corrective Action</div>
            <div className="modal-finding-text">{finding?.correctiveAction || '—'}</div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Assign To (Email) *</label>
            <input
              className="modal-input"
              placeholder="e.g. jdcruz@up.edu.ph"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Due Date</label>
            <input
              type="date"
              className="modal-input"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || !assignedTo.trim()}
          >
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Resolve Modal ─────────────────────────────────────────────────
const ResolveModal = ({ finding, sections, audit, onClose, onSaved }) => {
  const [resolutionNote,     setResolutionNote]     = useState(finding?.resolutionNote || '')
  const [resolutionEvidence, setResolutionEvidence] = useState(finding?.resolutionEvidence || null)
  const [uploading,          setUploading]          = useState(false)
  const [saving,             setSaving]             = useState(false)
  // const fileRef = useRef(null)

  const itemStatement = (() => {
    for (const section of sections) {
      const item = section.items?.find(i => i.id === finding?.checklistItemId)
      if (item) return item.statement
    }
    return '—'
  })()

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      // const res = await api.post(
      //   `/evidence/response/${finding.id}`,
      //   formData,
      //   { headers: { 'Content-Type': 'multipart/form-data' } }
      // )
      const res = await api.post(`/evidence/response/${finding.id}`, formData)
      setResolutionEvidence(res.data.fileUrl)
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await api.patch(`/manager/findings/${finding.id}`, {  
       resolutionStatus:   'resolved',
        resolutionNote:     resolutionNote.trim() || null,
        resolutionEvidence: resolutionEvidence    || null,
        resolvedAt:         new Date().toISOString(),
      })
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Mark as Resolved</h5>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-info-block">
            <div className="modal-info-row">
              <span className="modal-info-label">Inspection Code</span>
              <span className="modal-info-value mono">
                {finding?.audit?.inspectionCode}
              </span>
            </div>
            {/* <pre>{JSON.stringify(finding, null, 2)}</pre> */}
            <div className="modal-info-row">
              <span className="modal-info-label">Checklist Item</span>
              <span className="modal-info-value">{finding?.checklistItem?.statement}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Assigned To</span>
              <span className="modal-info-value">
                {finding?.assignedTo || '—'}
              </span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Due Date</span>
              <span className="modal-info-value">
                {fmtDate(finding?.dueDate)}
              </span>
            </div>
          </div>

          <div className="modal-finding-box">
            <div className="modal-finding-label">🔍 Finding</div>
            <div className="modal-finding-text">{finding?.finding || '—'}</div>
          </div>

          <div className="modal-finding-box">
            <div className="modal-finding-label">📝 Corrective Action To Be Done</div>
            <div className="modal-finding-text">{finding?.correctiveAction || '—'}</div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Resolution Note — What was done? *</label>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="Describe what corrective actions were taken…"
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Photo Evidence (Optional)</label>
            {/* <input
              type="file"
              ref={fileRef}
              style={{ display: 'none' }}
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            /> */}
            {resolutionEvidence ? (
              <div className="resolution-evidence-preview">
                {resolutionEvidence.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                  <img
                    src={resolutionEvidence}
                    alt="resolution evidence"
                    className="evidence-thumb-large"
                    onClick={() => window.open(resolutionEvidence, '_blank')}
                  />
                ) : (
                  <a href={resolutionEvidence} target="_blank" rel="noreferrer">
                    📄 View File
                  </a>
                )}
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setResolutionEvidence(null)}
                >
                  Remove
                </button>
              </div>
            ) : 
            // (
            //   <button
            //     className="btn-secondary"
            //     onClick={() => fileRef.current?.click()}
            //     disabled={uploading}
            //   >
            //     {uploading ? 'Uploading…' : '📎 Upload Photo / File'}
            //   </button>
            // )
            (
              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                {uploading ? 'Uploading…' : '📎 Upload Photo / File'}
                <input
                  type="file"
                  style={{ display: 'none' }}
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )
            }
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || !resolutionNote.trim()}
          >
            {saving ? 'Saving…' : 'Mark as Resolved'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
const TABS = [
  { key: 'reports',  label: '📋 Inspection Reports' },
  { key: 'findings', label: '🔍 Findings' },
  { key: 'resolved', label: '✅ Resolved' },
]

const ManagerFindings = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'reports'
  const setTab = (key) => setSearchParams({ tab: key })

  const [audits,    setAudits]    = useState([])
  const [findings,  setFindings]  = useState([])
  const [sections,  setSections]  = useState([])
  const [loading,   setLoading]   = useState(true)

  const [assignTarget,  setAssignTarget]  = useState(null)
  const [resolveTarget, setResolveTarget] = useState(null)

  const [search,       setSearch]       = useState('')
  const [filterSev,    setFilterSev]    = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchAll = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/manager/audits'),
      api.get('/manager/findings'),
    ])
      .then(([aRes, fRes]) => {
        setAudits(aRes.data)
        setFindings(fRes.data)
        // Extract sections from first audit's template for item lookup
        const firstAudit = aRes.data[0]
        if (firstAudit?.template?.sections) {
          setSections(firstAudit.template.sections)
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Derived ────────────────────────────────────────────────────
  const reportAudits = audits.filter(a => {
    const matchSearch =
      !search ||
      a.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.office?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.office?.facility?.name?.toLowerCase().includes(search.toLowerCase())

    return (
      ['submitted', 'acknowledged', 'resolving', 'pending_review', 'completed'].includes(a.status) &&
      matchSearch
    )
  })

  const filteredFindings = findings.filter(f => {
    const matchSearch = !search ||
      f.finding?.toLowerCase().includes(search.toLowerCase()) ||
      f.audit?.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
      f.audit?.office?.name?.toLowerCase().includes(search.toLowerCase())
    const matchSev    = filterSev    === 'all' || f.severity    === filterSev
    const matchStatus = filterStatus === 'all' || f.resolutionStatus === filterStatus
    return matchSearch && matchSev && matchStatus
  })

  const openFindings     = filteredFindings.filter(f => f.resolutionStatus !== 'resolved')
  const resolvedFindings = filteredFindings.filter(f => f.resolutionStatus === 'resolved')

  // ── After all resolved, offer resolution PDF ──────────────────
  const handleResolveSaved = () => {
    fetchAll()
    // Check if all findings for that audit are now resolved
    // The backend auto-sets pending_review — we just refresh
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  return (
    <div className="manager-findings">
      <div className="page-header">
        <div>
          <h4 className="page-title">Audit Findings & Reports</h4>
          <p className="page-subtitle">
            Review inspection reports and manage corrective actions
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="findings-summary-grid">

  <div
    className="findings-summary-card"
    style={{ borderBottom: '4px solid #e65100' }}
    onClick={() => setTab('reports')}
  >
    <div className="fsc-icon" style={{ color: '#e65100' }}>
      <FiFileText size={18} />
    </div>
    <div className="fsc-value">
      {audits.filter(a => a.status === 'submitted').length}
    </div>
    <div className="fsc-label">Awaiting Acknowledgment</div>
  </div>

  <div
    className="findings-summary-card"
        style={{ borderBottom: '4px solid #1565c0' }}
        onClick={() => setTab('findings')}
      >
        <div className="fsc-icon" style={{ color: '#1565c0' }}>
          <FiSearch size={18} />
        </div>
        <div className="fsc-value">
          {findings.filter(f => f.resolutionStatus === 'pending').length}
        </div>
        <div className="fsc-label">Unassigned Findings</div>
      </div>

      <div
        className="findings-summary-card"
        style={{ borderBottom: '4px solid #6a1b9a' }}
        onClick={() => setTab('findings')}
      >
        <div className="fsc-icon" style={{ color: '#6a1b9a' }}>
          <FiTool size={18} />
        </div>
        <div className="fsc-value">
          {findings.filter(f => f.resolutionStatus === 'assigned').length}
        </div>
        <div className="fsc-label">Corrective Actions In Progress</div>
      </div>

      <div
        className="findings-summary-card"
        style={{ borderBottom: '4px solid #2e7d32' }}
        onClick={() => setTab('resolved')}
      >
        <div className="fsc-icon" style={{ color: '#2e7d32' }}>
          <FiCheckCircle size={18} />
        </div>
        <div className="fsc-value">
          {findings.filter(f => f.resolutionStatus === 'resolved').length}
        </div>
        <div className="fsc-label">Resolved</div>
      </div>

    </div>

      {/* Tabs */}
      <div className="findings-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`findings-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Inspection Reports ── */}
      {activeTab === 'reports' && (
        <div className="findings-section">
        <div className="findings-filters">
            <input
              className="filter-input"
              placeholder="Search ID or office…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
        </div>
          <div className="findings-table-wrap">
            <table className="findings-table">
              <thead>
                <tr>
                  <th>Inspection ID</th>
                  <th>Office / Facility</th>
                  <th>Inspector</th>
                  <th>Submitted</th>
                  <th>Findings</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reportAudits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
                      No inspection reports found
                    </td>
                  </tr>
                ) : reportAudits.map(a => {
                  const findingCount = a.auditResponses?.filter(
                    r => r.finding?.trim() || r.correctiveAction?.trim()
                  ).length || 0
                  return (
                    <tr key={a.id}>
                      <td className="mono-cell">{a.inspectionCode}</td>
                      <td>
                        <div>{a.office?.name}</div>
                        <div className="sub-text">{a.office?.facility?.name}</div>
                      </td>
                      <td>{a.inspector?.name}</td>
                      <td>{fmtDate(a.submittedAt)}</td>
                      <td>
                        <span className={`badge-status ${findingCount > 0 ? 'badge-high' : 'badge-low'}`}>
                          {findingCount} finding{findingCount !== 1 ? 's' : ''} noted
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${getAuditStatusClass(a.status)}`}>
                          {getAuditStatusLabel(a.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => {
                            if (a.status === 'completed') {
                              generateResolutionReport(a)  
                            } else {
                              navigate(`/manager/inspections/${a.id}/review`)
                            }
                          }}
                        >
                          {a.status === 'submitted' ? 'Review' : 'View Report'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Findings ── */}
      {activeTab === 'findings' && (
        <div className="findings-section">
          {/* <div className="findings-note">
            <span>
              💡 <strong>Findings</strong> are non-compliant items where the officer has recorded 
              a finding description and corrective action. Items answered "No" without a recorded 
              finding are non-compliant but not listed here.
            </span>
          </div> */}
          <div className="findings-filters">
            <input
              className="filter-input"
              placeholder="Search finding, ID or office…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterSev}
              onChange={e => setFilterSev(e.target.value)}
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
            </select>
          </div>

          <div className="findings-table-wrap">
            <table className="findings-table">
              <thead>
                <tr>
                  <th>Inspection ID</th>
                  <th>Office</th>
                  <th>Finding</th>
                  <th>Corrective Action</th>
                  <th>Severity</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openFindings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-cell">
                      No open findings
                    </td>
                  </tr>
                ) : openFindings.map(f => (
                  <tr key={f.id}>
                    <td className="mono-cell">
                      {f.audit?.inspectionCode || '—'}
                    </td>
                    <td>
                      <div>{f.audit?.office?.name || '—'}</div>
                      <div className="sub-text">
                        {f.audit?.office?.facility?.name || '—'}
                      </div>
                    </td>
                    <td className="desc-cell">{f.finding || '—'}</td>
                    <td className="desc-cell">{f.correctiveAction || '—'}</td>
                    <td>
                      <span className={`severity-badge ${getSeverityClass(f.severity)}`}>
                        {f.severity || '—'}
                      </span>
                    </td>
                    <td>
                      {f.assignedTo || (
                        <span className="unassigned">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-status ${getResolutionClass(f.resolutionStatus)}`}>
                        {f.resolutionStatus}
                      </span>
                    </td>
                    <td>
                      {f.resolutionStatus === 'pending' ? (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => setAssignTarget(f)}
                        >
                          Assign
                        </button>
                      ) : (
                        <button
                          className="btn-secondary btn-sm"
                          onClick={() => setResolveTarget(f)}
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Resolved ── */}
      {activeTab === 'resolved' && (
      <div className="findings-section">
        <div className="findings-filters">
          <input
            className="filter-input"
            placeholder="Search finding, ID or office…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Group resolved findings by audit */}
        {Object.values(
          resolvedFindings.reduce((groups, f) => {
            const key = f.auditId
              if (!groups[key]) groups[key] = { audit: audits.find(a => a.id === Number(key)), findings: [] }
            groups[key].findings.push(f)
            return groups
          }, {})
        ).sort((a, b) => b.audit?.id - a.audit?.id).map(({ audit, findings }) => (
          <div key={audit?.id} className="findings-section" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span className="mono-cell">{audit?.inspectionCode}</span>
                <span className="sub-text" style={{ marginLeft: 8 }}>
                  {audit?.office?.name} — {audit?.office?.facility?.name}
                </span>
              </div>
              <button
                className="btn-primary btn-sm"
                onClick={() => generateResolutionReport(audit)}
              >
                📄 Generate Resolution Report
              </button>
            </div>

            <div className="findings-table-wrap">
              <table className="findings-table">
                <thead>
                  <tr>
                    <th>Finding</th>
                    <th>Corrective Action Done</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Resolved At</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {findings.map(f => (
                    <tr key={f.id}>
                      <td className="desc-cell">{f.finding || '—'}</td>
                      <td className="desc-cell">{f.resolutionNote || '—'}</td>
                      <td>{f.assignedTo || '—'}</td>
                      <td>{fmtDate(f.dueDate)}</td>
                      <td>{fmtDate(f.resolvedAt)}</td>
                      <td>
                        {f.resolutionEvidence ? (
                          f.resolutionEvidence.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                            <img
                              src={f.resolutionEvidence}
                              alt="evidence"
                              className="evidence-thumb"
                              onClick={() => window.open(f.resolutionEvidence, '_blank')}
                            />
                          ) : (
                            <a href={f.resolutionEvidence} target="_blank" rel="noreferrer">
                              📄 File
                            </a>
                          )
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

    {resolvedFindings.length === 0 && (
      <div className="empty-cell" style={{ textAlign: 'center', padding: 32 }}>
        No resolved findings
      </div>
    )}
  </div>
)}

      {/* Modals */}
      {assignTarget && (
        <AssignModal
          finding={assignTarget}
          sections={sections}
          onClose={() => setAssignTarget(null)}
          onSaved={fetchAll}
        />
      )}
      {resolveTarget && (
        <ResolveModal
          finding={resolveTarget}
          sections={sections}
          audit={audits.find(a => a.id === resolveTarget?.auditId)}
          onClose={() => setResolveTarget(null)}
          onSaved={handleResolveSaved}
        />
      )}
    </div>
  )
}

export default ManagerFindings