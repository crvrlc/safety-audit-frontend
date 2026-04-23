import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllFindings, resolveFinding } from '../../services/findingService'
import '../css/OfficerRecords.css'

// AuditResponse doesn't have a severity field — resolution status is the main indicator
const getResolutionStyle = (status) => {
  switch (status) {
    case 'resolved': return { background: '#dcfce7', color: '#166534' }
    case 'ongoing':  return { background: '#dbeafe', color: '#1d4ed8' }
    case 'pending':  return { background: '#fef3c7', color: '#b45309' }
    case 'assigned': return { background: '#ede9fe', color: '#6d28d9' }
    default:         return { background: '#f3f4f6', color: '#6b7280' }
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'pending':  return 'Open'
    case 'assigned': return 'Assigned'
    case 'ongoing':  return 'In Progress'
    case 'resolved': return 'Resolved'
    default:         return status ?? '—'
  }
}

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const OfficerFindingsRecords = () => {
  const navigate = useNavigate()
  const [findings,  setFindings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [resolving, setResolving] = useState(null)

  useEffect(() => { fetchFindings() }, [])

  const fetchFindings = () => {
    setLoading(true)
    getAllFindings()
      .then(res => setFindings(res.data))
      .finally(() => setLoading(false))
  }

  const handleResolve = async (id) => {
    setResolving(id)
    await resolveFinding(id)
    setResolving(null)
    fetchFindings()
  }

  // Fields from AuditResponse: finding, correctiveAction, resolutionStatus, resolvedAt
  const filtered = findings.filter(f =>
    f.finding?.toLowerCase().includes(search.toLowerCase()) ||
    f.correctiveAction?.toLowerCase().includes(search.toLowerCase()) ||
    f.audit?.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
    f.audit?.office?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const unresolvedCount = findings.filter(f => f.resolutionStatus !== 'resolved').length

  return (
    <div className="records-page">

       <div className="inspections-header">
        <div className="header-left-group">
          <button className="btn-back" onClick={() => navigate('/officer/records')}>
            ← Back
          </button>

            <h4>Findings</h4>
            <p className="page-subtext">
              {unresolvedCount} unresolved finding{unresolvedCount !== 1 ? 's' : ''} across all inspections.
            </p>
        </div>
      </div>

      {/* <div className="inspections-header">
        <div>
          <h4>Findings & Issues</h4>
          <p className="page-subtext">
            {unresolvedCount} unresolved finding{unresolvedCount !== 1 ? 's' : ''} across all inspections.
          </p>
        </div>
      </div> */}

      <div className="records-section">
        <div className="records-section-header">
          <p className="section-label">
            {filtered.length} finding{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="records-toolbar">
            <input
              className="records-search"
              placeholder="Search by finding, code, office..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border" style={{ color: '#8B0000' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="records-empty">
            {search ? 'No findings match your search.' : 'No findings recorded yet.'}
          </div>
        ) : (
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Inspection Code</th>
                  <th>Office</th>
                  <th>Finding</th>
                  <th>Corrective Action</th>
                  <th>Status</th>
                  <th>Resolved</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td><code>{f.audit?.inspectionCode || '—'}</code></td>
                    <td>{f.audit?.office?.name || '—'}</td>
                    {/* ✅ correct field: f.finding not f.description */}
                    <td className="truncate-cell">{f.finding || '—'}</td>
                    {/* ✅ correct field: f.correctiveAction */}
                    <td className="truncate-cell">{f.correctiveAction || '—'}</td>
                    <td>
                      <span className="badge-pill" style={getResolutionStyle(f.resolutionStatus)}>
                        {getStatusLabel(f.resolutionStatus)}
                      </span>
                    </td>
                    <td>{formatDate(f.resolvedAt)}</td>
                    <td>
                      {f.resolutionStatus !== 'resolved' ? (
                        <button
                          className="btn-table-action btn-resolve"
                          onClick={() => handleResolve(f.id)}
                          disabled={resolving === f.id}
                        >
                          {resolving === f.id ? '...' : 'Resolve'}
                        </button>
                      ) : (
                        <button className="btn-table-action" disabled>
                          Resolved
                        </button>
                      )}
                    </td>
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

export default OfficerFindingsRecords