import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyAudits } from '../../services/auditService'
import { getAllFindings } from '../../services/findingService'
import '../css/OfficerRecords.css'

// An audit is "archived" if it is completed AND older than 6 months
const isArchived = (audit) => {
  if (audit.status !== 'completed') return false
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return new Date(audit.completedAt ?? audit.createdAt) < sixMonthsAgo
}

const getResolutionStyle = (status) => {
  switch (status) {
    case 'resolved': return { background: '#dcfce7', color: '#166534' }
    case 'ongoing':  return { background: '#dbeafe', color: '#1d4ed8' }
    case 'pending':  return { background: '#fef3c7', color: '#b45309' }
    default:         return { background: '#f3f4f6', color: '#6b7280' }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const OfficerRecords = () => {
  const navigate = useNavigate()

  const [audits,   setAudits]   = useState([])
  const [findings, setFindings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getMyAudits(), getAllFindings()])
      .then(([auditsRes, findingsRes]) => {
        setAudits(auditsRes.data)
        setFindings(findingsRes.data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const archivedAudits = audits
    .filter(isArchived)
    .sort((a, b) => new Date(b.completedAt ?? b.createdAt) - new Date(a.completedAt ?? a.createdAt))

  const recentArchived = archivedAudits.slice(0, 5)

  const recentFindings = [...findings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="records-page">
      <div>
        <h4>Records</h4>
        <p className="page-subtext">
          Accessed finalized safety inspection reports for compliance tracking and auditing.
        </p>
      </div>

      {/* STATUS CARDS */}
      <div className="status-cards">
        <div className="status-card" onClick={() => navigate('/officer/archived')}>
          <div className="status-card-count">{archivedAudits.length}</div>
          <div className="status-card-label">Archived Records</div>
          <div className="status-card-sub">Completed &gt; 6 months ago</div>
        </div>

        <div className="status-card" onClick={() => navigate('/officer/findings')}>
          <div className="status-card-count">{findings.length}</div>
          <div className="status-card-label">Findings Noted</div>
          <div className="status-card-sub">
            {findings.filter(f => f.resolutionStatus !== 'resolved').length} unresolved
          </div>
        </div>
      </div>

      {/* RECENT ARCHIVED RECORDS */}
      <div className="records-section">
        <div className="records-section-header">
          <p className="section-label">Recent Archived Records</p>
          {archivedAudits.length > 5 && (
            <button className="records-view-all" onClick={() => navigate('/officer/archived')}>
              View all ({archivedAudits.length})
            </button>
          )}
        </div>

        {recentArchived.length === 0 ? (
          <div className="records-empty">No archived records yet</div>
        ) : (
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Office</th>
                  <th>Facility</th>
                  <th>Type</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {recentArchived.map(audit => (
                  <tr key={audit.id} onClick={() => navigate(`/officer/inspections/${audit.id}/start`)}>
                    <td><code>{audit.inspectionCode}</code></td>
                    <td>{audit.office?.name || '—'}</td>
                    <td>{audit.office?.facility?.name || '—'}</td>
                    <td className="capitalize">{audit.inspectionType || '—'}</td>
                    <td>{formatDate(audit.completedAt ?? audit.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RECENT FINDINGS */}
      <div className="records-section">
        <div className="records-section-header">
          <p className="section-label">Recent Findings & Issues</p>
          {findings.length > 5 && (
            <button className="records-view-all" onClick={() => navigate('/officer/findings')}>
              View all ({findings.length})
            </button>
          )}
        </div>

        {recentFindings.length === 0 ? (
          <div className="records-empty">No findings recorded yet</div>
        ) : (
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Finding</th>
                  <th>Office</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentFindings.map(finding => (
                  <tr key={finding.id} onClick={() => navigate('/officer/findings')}>
                    <td className="truncate-cell">{finding.finding || '—'}</td>
                    <td>{finding.audit?.office?.name || '—'}</td>
                    <td>
                      <span className="badge-pill" style={getResolutionStyle(finding.resolutionStatus)}>
                        {finding.resolutionStatus || '—'}
                      </span>
                    </td>
                    <td>{formatDate(finding.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default OfficerRecords