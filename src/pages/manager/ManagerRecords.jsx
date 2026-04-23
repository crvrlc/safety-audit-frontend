import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../css/ManagerRecords.css'
import '../css/ManagerShared.css'
import {
  FiFileText,
  FiCheckCircle
} from 'react-icons/fi'


const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const getSeverityClass = (s) => {
  switch (s) {
    case 'critical': return 'badge-critical'
    case 'high':     return 'badge-high'
    case 'medium':   return 'badge-medium'
    case 'low':      return 'badge-low'
    default:         return 'badge-draft'
  }
}

const TABS = [
  { key: 'all',        label: '🗂️ All Records' },
  { key: 'inspection', label: '📋 Inspection Reports' },
  { key: 'resolved',   label: '✅ Resolved Findings' },
]

const ManagerRecords = () => {
  const { user }  = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [audits,    setAudits]    = useState([])
  const [findings,  setFindings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (!user?.token) return

    Promise.all([
      api.get('/manager/audits?status=completed'),
      api.get('/manager/findings?status=resolved'),
    ])
      .then(([aRes, fRes]) => {
        setAudits(aRes.data)
        setFindings(fRes.data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [user])

  // Build combined records list
  const allRecords = [
    ...audits.map(a => ({
      ...a,
      recordType:  'Inspection Report',
      submittedBy: a.inspector?.name,
      date:        a.submittedAt,
      status:      'Acknowledged'
    })),
    ...findings.map(f => ({
      ...f,
      recordType:      'Resolution Report',
      submittedBy:     f.assignedTo || '—',  // ← was f.assignedUser?.name
      date:            f.resolvedAt,
      status:          'Verified',
      inspectionCode:  f.audit?.inspectionCode,
      office:          f.audit?.office,
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  const filtered = allRecords.filter(r => {
    const matchSearch = !search ||
      r.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
      r.office?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || r.recordType === filterType
    return matchSearch && matchType
  })

  const inspectionRecords = filtered.filter(r => r.recordType === 'Inspection Report')
  const resolvedRecords   = filtered.filter(r => r.recordType === 'Resolution Report')

  const display = activeTab === 'all' ? filtered
    : activeTab === 'inspection' ? inspectionRecords
    : resolvedRecords

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="manager-records">
      <div className="page-header">
        <div>
          <h4 className="page-title">Records Archive</h4>
          <p className="page-subtitle">Completed inspection reports and resolved findings</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="records-summary-grid">

      <div
        className="records-summary-card"
        style={{ borderBottom: '4px solid #1565c0' }}
        onClick={() => setActiveTab('inspection')}
      >
        <div className="rsc-icon" style={{ color: '#1565c0' }}>
          <FiFileText size={18} />
        </div>

        <div className="rsc-value">{audits.length}</div>
        <div className="rsc-label">Completed Inspection Reports</div>
      </div>

      <div
        className="records-summary-card"
        style={{ borderBottom: '4px solid #2e7d32' }}
        onClick={() => setActiveTab('resolved')}
      >
        <div className="rsc-icon" style={{ color: '#2e7d32' }}>
          <FiCheckCircle size={18} />
        </div>

        <div className="rsc-value">
          {findings.filter(f => f.resolutionStatus === 'resolved').length}
        </div>

        <div className="rsc-label">Resolved Findings</div>
      </div>

    </div>

      {/* Tabs */}
      <div className="findings-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`findings-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="findings-filters">
        <input
          className="filter-input"
          placeholder="Search inspection ID or office…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {activeTab === 'all' && (
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Inspection Report">Inspection Report</option>
            <option value="Resolution Report">Resolution Report</option>
          </select>
        )}
      </div>

      {/* All / Inspection tab */}
      {(activeTab === 'all' || activeTab === 'inspection') && (
        <div className="findings-table-wrap">
          <table className="findings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Office / Facility</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th>Status</th>
                {/* <th>Action</th> */}
              </tr>
            </thead>
            <tbody>
              {display.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No records found</td></tr>
              ) : display.map((r, i) => (
                <tr key={i}>
                  <td className="mono-cell">{r.inspectionCode || `MT-${r.id}`}</td>
                  <td>
                    <span className={`badge-status ${r.recordType === 'Inspection Report' ? 'badge-submitted' : 'badge-completed'}`}>
                      {r.recordType}
                    </span>
                  </td>
                  <td>
                    <div>{r.office?.name || '—'}</div>
                    <div className="sub-text">{r.office?.facility?.name || '—'}</div>
                  </td>
                  <td>{r.submittedBy || '—'}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>
                    <span className="badge-status badge-completed">{r.status}</span>
                  </td>
                  {/* <td>
                    <button className="btn-secondary btn-sm">View</button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolved tab - more detailed */}
      {activeTab === 'resolved' && (
        <div className="findings-table-wrap">
          <table className="findings-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Office</th>
                <th>Facility</th>
                <th>Finding</th>
                <th>Severity</th>
                <th>Date Resolved</th>
                <th>Assigned To</th>
                <th>Verified By</th>
              </tr>
            </thead>
            <tbody>
              {findings.filter(f => f.resolutionStatus === 'resolved').length === 0 ? (
                <tr><td colSpan={8} className="empty-cell">No resolved findings</td></tr>
              ) : 
                findings.filter(f => {
                  if (!search) return true
                  return f.finding?.toLowerCase().includes(search.toLowerCase()) ||
                        f.audit?.inspectionCode?.toLowerCase().includes(search.toLowerCase())
                }).map(f => (
                  <tr key={f.id}>
                    <td className="mono-cell">{f.audit?.inspectionCode || '—'}</td>
                    <td>{f.audit?.office?.name || '—'}</td>
                    <td>{f.audit?.office?.facility?.name || '—'}</td>
                    <td className="desc-cell">{f.finding || '—'}</td>  {/* ← was f.description */}
                    <td>
                      <span className={`badge-status ${getSeverityClass(f.severity)}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td>{fmtDate(f.resolvedAt)}</td>
                    <td>{f.assignedTo || '—'}</td>  {/* ← was f.assignedUser?.name */}
                    <td>{f.audit?.inspector?.name || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManagerRecords