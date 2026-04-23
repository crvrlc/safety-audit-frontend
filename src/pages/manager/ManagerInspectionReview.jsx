// src/pages/manager/ManagerInspectionReview.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuditById } from '../../services/auditService'
import { generateReport } from '../../utils/generateReport'
import api from '../../services/api'
import '../css/ManagerInspectionReview.css'

const ManagerInspectionReview = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [audit, setAudit]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [confirmed, setConfirmed]   = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    getAuditById(id)
      .then(res => setAudit(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const responses = audit?.auditResponses || []
  const sections  = audit?.template?.sections || []

  const yesCount       = responses.filter(r => r.answer === 'yes').length
  const noCount        = responses.filter(r => r.answer === 'no').length
  const applicable     = yesCount + noCount
  const complianceRate = applicable > 0
    ? Math.round((yesCount / applicable) * 100) : 0

  const findingsWithContent = responses.filter(
    r => r.answer === 'no' && (r.finding?.trim() || r.correctiveAction?.trim())
  )

  const getComplianceClass = (rate) => {
    if (rate >= 90) return 'high'
    if (rate >= 70) return 'moderate'
    return 'low'
  }

  const getComplianceLabel = (rate) => {
    if (rate >= 90) return 'High Compliance'
    if (rate >= 70) return 'Moderate Compliance'
    return 'Low Compliance'
  }

  const getSectionStats = (section) => {
    const ids = section.items.map(i => i.id)
    const applicable = responses.filter(
      r => ids.includes(r.checklistItemId) && r.answer !== 'na'
    )
    if (applicable.length === 0) return null
    const yes  = applicable.filter(r => r.answer === 'yes').length
    const no   = applicable.filter(r => r.answer === 'no').length
    const rate = Math.round((yes / applicable.length) * 100)
    return { yes, no, rate }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const handleAcknowledge = async () => {
    if (!confirmed) return
    setAcknowledging(true)
    try {
      const res = await api.patch(`/manager/audits/${id}/acknowledge`)
      setAudit(prev => ({ ...prev, ...res.data }))
      navigate(`/manager/findings?tab=reports`)
    } catch (err) {
      console.error(err)
    } finally {
      setAcknowledging(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const res = await api.patch(`/manager/audits/${id}/complete`)
      setAudit(prev => ({ ...prev, ...res.data }))
      navigate(`/manager/findings?tab=reports`)
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  const status              = audit?.status
  const isAlreadyAcknowledged = !['submitted'].includes(status)
  const isPendingReview       = status === 'pending_review'
  const isCompleted           = status === 'completed'

  return (
    <div className="manager-inspection-review">

      {/* Header */}
      <div className="mir-header">
        <div>
          <h4>Inspection Report Review</h4>
          <p>
            {audit?.office?.facility?.name} — {audit?.office?.name} |{' '}
            {audit?.inspectionCode}
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => generateReport(audit)}
          disabled={!isAlreadyAcknowledged}
          title={!isAlreadyAcknowledged ? 'Acknowledge the report first before generating a PDF' : 'Generate PDF'}
        >
          📄 Generate PDF
        </button>
      </div>

      {/* Inspection Details */}
      <div className="mir-card">
        <div className="mir-card-header"><h6>Inspection Summary</h6></div>
        <div className="mir-details-grid">
          <div className="review-detail-item">
            <label>Inspection Code</label>
            <p className="code">{audit?.inspectionCode}</p>
          </div>
          <div className="mir-detail-item">
            <label>Inspection Type</label>
            <p style={{ textTransform: 'capitalize' }}>
              {audit?.inspectionType?.replace('_', ' ')}
            </p>
          </div>
          <div className="mir-detail-item">
            <label>Building / Facility</label>
            <p>{audit?.office?.facility?.name || '—'}</p>
          </div>
          <div className="review-detail-item">
            <label>Unit in Charge</label>
            <p>{audit?.office?.facility?.unitInCharge || '—'}</p>
          </div>
          <div className="mir-detail-item">
            <label>Office / Room</label>
            <p>{audit?.office?.name || '—'}</p>
          </div>
          <div className="mir-detail-item">
            <label>Inspector</label>
            <p>{audit?.inspector?.name || '—'}</p>
          </div>
          <div className="mir-detail-item">
            <label>Scheduled Date</label>
            <p>{formatDate(audit?.scheduledAt)}</p>
          </div>
          <div className="mir-detail-item">
            <label>Submitted Date</label>
            <p>{formatDate(audit?.submittedAt)}</p>
          </div>
          {audit?.notes && (
            <div className="mir-detail-item mir-full">
              <label>Notes</label>
              <p>{audit.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mir-summary-cards">
        <div className={`mir-summary-card compliance ${getComplianceClass(complianceRate)}`}>
          <h3>{complianceRate}%</h3>
          <p>Compliance Rate</p>
          <span className={`compliance-level-badge ${getComplianceClass(complianceRate)}`}>
            {getComplianceLabel(complianceRate)}
          </span>
        </div>
        <div className="mir-summary-card compliant">
          <h3>{yesCount}</h3>
          <p>Compliant Items</p>
        </div>
        <div className="mir-summary-card non-compliant">
          <h3>{noCount}</h3>
          <p>Non-Compliant Items</p>
        </div>
        <div className="mir-summary-card findings-noted">
          <h3>{findingsWithContent.length}</h3>
          <p>Findings Noted</p>
        </div>
        
      </div>

      {/* Section Breakdown */}
      {/* <div className="mir-card">
        <div className="mir-card-header"><h6>Section Compliance Breakdown</h6></div>
        <div className="mir-card-body">
          {sections.map(section => {
            const stats = getSectionStats(section)
            if (!stats) return null
            const { yes, no, rate } = stats
            const cls = getComplianceClass(rate)
            return (
              <div key={section.id} className="breakdown-row">
                <span className="breakdown-label">{section.name}</span>
                <div className="breakdown-bar">
                  <div
                    className={`breakdown-bar-fill ${cls}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="breakdown-meta">
                  <span className="breakdown-percent">{rate}%</span>
                  <span className="breakdown-counts">
                    <span className="yes-count">✓ {yes}</span>
                    <span className="no-count">✗ {no}</span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div> */}
      <div className="breakdown-card">
            <h6>Section Compliance Breakdown</h6>
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>Yes</th>
                  <th>No</th>
                  <th>N/A</th>
                  <th>Rate</th>
                  <th>Compliance Level</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(section => {
                  const stats = getSectionStats(section)
                  if (!stats || (stats.yes === 0 && stats.no === 0)) return null
                  const { yes, no, na, rate } = stats
                  const cls = getComplianceClass(rate)
                  return (
                    <tr key={section.id}>
                      <td className="breakdown-label">{section.name}</td>
                      <td className="yes-count">✓ {yes}</td>
                      <td className="no-count">✗ {no}</td>
                      <td className="na-count">{na > 0 ? `${na}` : '—'}</td>
                      <td className={`compliance-rate ${cls}`}>{rate}%</td>
                      <td><span className={`compliance-badge ${cls}`}>{getComplianceLabel(rate)}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>


      {/* Findings Summary */}
            <div className="findings-table-card">
              <div className="findings-table-card-header">
                <h6>Findings & Corrective Actions Noted</h6>
              </div>
              {findingsWithContent.length === 0 ? (
                <div className="no-findings">
                  <div className="no-findings-icon">✅</div>
                  <p>No findings — all items are compliant!</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="findings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Section</th>
                        <th>Checklist Item</th>
                        <th>Finding</th>
                        <th>Corrective Action</th>
                        <th>Severity</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findingsWithContent.map((r, index) => {
                        const section = sections.find(s => s.items.some(i => i.id === r.checklistItemId))
                        const item = section?.items.find(i => i.id === r.checklistItemId)
                        return (
                          <tr key={r.id}>
                            <td>{index + 1}</td>
                            <td><small className="text-muted">{section?.name || '—'}</small></td>
                            <td style={{ maxWidth: '180px' }}><small>{item?.statement || '—'}</small></td>
                            <td style={{ maxWidth: '180px' }}>
                              <small>{r.finding || <span className="text-muted">—</span>}</small>
                            </td>
                            <td style={{ maxWidth: '180px' }}>
                              <small>{r.correctiveAction || <span className="text-muted">—</span>}</small>
                            </td>
                            <td>
                              <span className={`severity-badge ${r.severity || 'medium'}`}>
                                {r.severity || 'medium'}
                              </span>
                            </td>
                            <td>
                              {r.evidence?.map((ev, i) =>
                                ev.fileType?.startsWith('image') ? (
                                  <img
                                    key={i}
                                    src={ev.fileUrl}
                                    alt={`evidence ${i + 1}`}
                                    className="findings-evidence-thumb"
                                    onClick={() => window.open(ev.fileUrl, '_blank')}
                                    title="Click to view full size"
                                  />
                                ) : (
                                  <a key={i} href={ev.fileUrl} target="_blank" rel="noreferrer" className="findings-evidence-file">
                                    📄 File {i + 1}
                                  </a>
                                )
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

      {/* ── BOTTOM ACTIONS ── */}

      {/* Case 1: Awaiting acknowledgement */}
      {!isAlreadyAcknowledged && (
        <>
          <div className="mir-confirmation">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirm">
              I hereby confirm that I have reviewed inspection report{' '}
              <strong>{audit?.inspectionCode}</strong> and acknowledge the safety
              issues identified. Corrective actions will be addressed through the
              Audit Findings module.
            </label>
          </div>
          <div className="mir-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate('/manager/findings?tab=reports')}
            >
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleAcknowledge}
              disabled={!confirmed || acknowledging}
            >
              {acknowledging ? 'Acknowledging...' : '✅ Acknowledge Report'}
            </button>
          </div>
        </>
      )}

      {/* Case 2: All findings resolved — ready to close out */}
      {isPendingReview && (
        <>
          <div className="mir-confirmation">
            <p className="text-success mb-0">
              ✅ All corrective actions have been resolved. You may now mark this inspection as complete.
            </p>
          </div>
          <div className="mir-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate('/manager/findings?tab=reports')}
            >
              ← Back
            </button>
            <button
              className="btn-primary"
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? 'Completing...' : 'Mark as Complete'}
            </button>
          </div>
        </>
      )}

      {/* Case 3: Acknowledged (findings still in progress) or fully completed */}
      {isAlreadyAcknowledged && !isPendingReview && (
        <div className="mir-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/manager/findings?tab=reports')}
          >
            ← Back to Reports
          </button>
          {isCompleted ? (
            <div className="mir-acknowledged-badge">
              🏁 Completed on {formatDate(audit?.completedAt)}
            </div>
          ) : (
            <div className="mir-acknowledged-badge">
              ✅ Acknowledged on {formatDate(audit?.acknowledgedAt)}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

export default ManagerInspectionReview