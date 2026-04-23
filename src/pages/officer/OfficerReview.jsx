import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuditById, submitAudit } from '../../services/auditService'
import { generateReport } from '../../utils/generateReport'
import '../css/OfficerFindings.css'
import '../css/OfficerReview.css'

const steps = [
  { key: 'schedule',  label: 'Schedule' },
  { key: 'start',     label: 'Start Inspection' },
  { key: 'checklist', label: 'Checklist Assessment' },
  { key: 'findings',  label: 'Findings & Corrective Actions' },
  { key: 'review',    label: 'Review & Submit' }
]

const OfficerReview = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [audit, setAudit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAuditById(id)
      .then(res => setAudit(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const responses = audit?.auditResponses || []

    // Read timer from localStorage
    const inspectionDuration = (() => {
      const saved = localStorage.getItem(`audit-timer-${id}`)
      if (!saved) return null
      const seconds = parseInt(saved)
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
    })()


  const totalAnswered  = responses.filter(r => r.answer !== null).length
  const yesCount       = responses.filter(r => r.answer === 'yes').length
  const noCount        = responses.filter(r => r.answer === 'no').length
  const naCount        = responses.filter(r => r.answer === 'na').length
  const applicable     = yesCount + noCount   // not totalAnswered - naCount
  const complianceRate = applicable > 0
    ? Math.round((yesCount / applicable) * 100) : 0

  // Findings = no-answers with finding or corrective action written
  const findingsWithContent = responses.filter(
    r => r.answer === 'no' && (r.finding?.trim() || r.correctiveAction?.trim())
  )
  const highCount = findingsWithContent.filter(r => r.severity === 'high').length

  const getComplianceClass = (rate) => {
    if (rate >= 90) return 'high'
    if (rate >= 70) return 'moderate'
    return 'low'
  }

  const getStepStatus = (stepKey) => {
    if (['schedule', 'start', 'checklist', 'findings'].includes(stepKey)) return 'completed'
    if (stepKey === 'review') return isSubmitted ? 'completed' : 'active'
    return 'pending'
  }
 

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const handleSubmit = async () => {
    if (!confirmed) return
    setSubmitting(true)
    try {
      await submitAudit(id)
      localStorage.removeItem(`audit-timer-${id}`)  
      navigate(`/officer/inspections/${id}/success`)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // For summary cards (mirrors OfficerFindings)
  const sections = audit?.template?.sections || []

  const findingsCount      = findingsWithContent.length
  const correctiveActCount = responses.filter(
    r => r.answer === 'no' && r.correctiveAction?.trim()
  ).length
  

  const getComplianceLabel = (rate) => {
    if (rate >= 90) return 'High Compliance'
    if (rate >= 70) return 'Moderate Compliance'
    return 'Low Compliance'
  }

  const getSectionStats = (section) => {
    const ids = section.items.map(i => i.id)
    const sectionResponses = responses.filter(r => ids.includes(r.checklistItemId))
    if (sectionResponses.length === 0) return null

    const na  = sectionResponses.filter(r => r.answer === 'na').length
    const applicable = sectionResponses.filter(r => r.answer !== 'na')
    if (applicable.length === 0) return { yes: 0, no: 0, na, rate: 0 }

    const yes  = applicable.filter(r => r.answer === 'yes').length
    const no   = applicable.filter(r => r.answer === 'no').length
    const rate = Math.round((yes / applicable.length) * 100)
    return { yes, no, na, rate }
  }

  // const isSubmitted = audit?.status !== 'pending' && audit?.status !== 'in_progress'
  const isSubmitted = audit?.status === 'submitted' || audit?.status === 'awaiting_acknowledgment'
  console.log(audit?.status)


  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  return (
    <div className="officer-review">

      {/* Header */}
      <div className="review-header">
        <h4>Review & Submit Report</h4>
        <p>
          {audit?.office?.facility?.name} — {audit?.office?.name} |{' '}
          {audit?.inspectionCode}
        </p>
      </div>

      <div className="review-body">
        <div className="review-left">

          {/* Inspection Summary */}
          <div className="review-card">
            <div className="review-card-header">
              <h6>Inspection Summary</h6>
            </div>
            <div className="review-card-body">
              <div className="review-details-grid">
                <div className="review-detail-item">
                  <label>Inspection Code</label>
                  <p className="code">{audit?.inspectionCode}</p>
                </div>
                <div className="review-detail-item">
                  <label>Inspection Type</label>
                  <p style={{ textTransform: 'capitalize' }}>
                    {audit?.inspectionType?.replace('_', ' ')}
                  </p>
                </div>
                <div className="review-detail-item">
                  <label>Building / Facility</label>
                  <p>{audit?.office?.facility?.name || '—'}</p>
                </div>
                <div className="review-detail-item">
                  <label>Unit in Charge</label>
                  <p>{audit?.office?.facility?.unitInCharge || '—'}</p>
                </div>
                <div className="review-detail-item">
                  <label>Office / Room</label>
                  <p>{audit?.office?.name || '—'}</p>
                </div>
                <div className="review-detail-item">
                  <label>Inspector</label>
                  <p>{audit?.inspector?.name || '—'}</p>
                </div>
                <div className="review-detail-item">
                  <label>Scheduled Date</label>
                  <p>{formatDate(audit?.scheduledAt)}</p>
                </div>
                <div className="review-detail-item">
                  <label>Inspection Duration</label>
                  <p>{inspectionDuration}</p>
                </div>
                {/* <div classNam   e="review-detail-item"> */}
                  {/* <label>Checklist Template</label>
                  <p>{audit?.template?.name || '—'}</p>
                </div> */}
                {audit?.purpose && (
                  <div className="review-detail-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Purpose</label>
                    <p>{audit.purpose}</p>
                  </div>
                )}
                {audit?.notes && (
                  <div className="review-detail-item" style={{ gridColumn: '1 / -1' }}>
                    <label>Notes</label>
                    <p>{audit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="findings-summary-cards">
            <div className={`findings-summary-card compliance ${getComplianceClass(complianceRate)}`}>
              <h3>{complianceRate}%</h3>
              <p>Compliance Rate</p>
              <span className={`compliance-level-badge ${getComplianceClass(complianceRate)}`}>
                {getComplianceLabel(complianceRate)}
              </span>
            </div>
            <div className="findings-summary-card actions">
              <h3>{yesCount}</h3>
              <p>Compliant Items</p>
            </div>
            <div className="findings-summary-card non-compliant">
              <h3>{noCount}</h3>
              <p>Non-Compliant Items</p>
            </div>
            <div className="findings-summary-card findings-noted">
              <h3>{findingsCount}</h3>
              <p>Findings Noted</p>
            </div>
            {/* {inspectionDuration && (
              <div className="findings-summary-card duration">
                <h3>{inspectionDuration}</h3>
                <p>Inspection Duration</p>
              </div>
            )} */}
          </div>

          {/* Section Breakdown */}
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

         {/* Confirmation */}
          <div className="review-confirmation">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed || isSubmitted}
              onChange={e => !isSubmitted && setConfirmed(e.target.checked)}
              disabled={isSubmitted}
            />
            <label htmlFor="confirm" style={isSubmitted ? { color: '#888', cursor: 'default' } : {}}>
              I confirm that this inspection report is accurate and complete.
              {isSubmitted
                ? ' This report has already been submitted.'
                : ' Submitting will notify the facility manager for acknowledgment and corrective action tracking.'}
            </label>
          </div>

          {/* Actions */}
          <div className="review-actions">
            <button
              className="btn-review back"
              disabled={submitting || isSubmitted}
              onClick={() => navigate(`/officer/inspections/${id}/findings`)}
            >
              ← Back to Findings
            </button>
            <button
              className="btn-review submit"
              onClick={handleSubmit}
              disabled={!confirmed || submitting || isSubmitted}
              title={isSubmitted ? 'This report has already been submitted.' : ''}
            >
              {isSubmitted ? '✅ Already Submitted' : submitting ? 'Submitting...' : ' Submit to Facility Manager'}
            </button>
            <button
              className="btn-review pdf"
              onClick={() => generateReport(audit)}
            >
              📄 Generate PDF
            </button>
          </div>
 
        </div>

        {/* Progress Stepper */}
          <div className="progress-stepper">
            <h6>Progress</h6>
            {steps.map((step, index) => {
              const status = getStepStatus(step.key)
              return (
                <div key={step.key} className="step-item">
                  <div className="step-row">
                    <div className={`step-circle ${status}`}>
                      {status === 'completed' ? '✓' : index + 1}
                    </div>
                    <span className={`step-label ${status}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`step-connector ${status === 'completed' ? 'completed' : ''}`} />
                  )}
                </div>
              )
            })}
          </div>
      </div>
    </div>
  )
}

export default OfficerReview