import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyAudits } from '../../services/auditService'
import '../css/OfficerRecords.css'

const isArchived = (audit) => {
  if (audit.status !== 'completed') return false
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return new Date(audit.completedAt ?? audit.createdAt) < sixMonthsAgo
}

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric'
  })
}

const OfficerArchived = () => {
  const navigate = useNavigate()
  const [audits, setAudits] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyAudits()
      .then(res => setAudits(res.data.filter(isArchived)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = audits.filter(a =>
    a.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
    a.office?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.office?.facility?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="records-page">

      <div className="inspections-header">
        <div className="header-left-group">
          <button className="btn-back" onClick={() => navigate('/officer/records')}>
            ← Back
          </button>

            <h4>Archived Records</h4>
            <p className="page-subtext">
              Completed inspections older than 6 months.
            </p>
        </div>
      </div>

      <div className="records-section">
        <div className="records-section-header">
          <p className="section-label">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="records-toolbar">
            <input
              className="records-search"
              placeholder="Search by code, office, facility..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {/* <button className="btn-export">⬇ Export</button> */}
          </div>
        </div>

        {loading ? (
          <div className="text-center mt-5">
            <div className="spinner-border" style={{ color: '#8B0000' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="records-empty">
            {search ? 'No records match your search.' : 'No archived records yet.'}
          </div>
        ) : (
          <div className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Office</th>
                  <th>Facility</th>
                  <th>Type</th>
                  <th>Findings</th>
                  <th>Completed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td><code>{a.inspectionCode}</code></td>
                    <td>{a.office?.name || '—'}</td>
                    <td>{a.office?.facility?.name || '—'}</td>
                    <td className="capitalize">{a.inspectionType || '—'}</td>
                    <td>{a.findings?.length ?? 0}</td>
                    <td>{formatDate(a.completedAt ?? a.createdAt)}</td>
                    <td>
                      <button
                        className="btn-table-action"
                        onClick={() => navigate(`/officer/inspections/${a.id}/start`)}
                      >
                        View
                      </button>
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

export default OfficerArchived