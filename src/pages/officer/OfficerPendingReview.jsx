import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuditById, signOffAudit } from '../../services/auditService'
import '../css/OfficerPendingReview.css'

const steps = [
  { key: 'submitted',      label: 'Submitted to Manager' },
  { key: 'acknowledged',   label: 'Manager Acknowledged' },
  { key: 'resolving',      label: 'Corrective Actions Assigned' },
  { key: 'pending_review', label: 'Repairs Done — Your Review' },
  { key: 'completed',      label: 'Completed' },
]

const OfficerPendingReview = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [audit, setAudit]         = useState(null)
  const [sections, setSections]   = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [comment, setComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAuditById(id)
      .then(res => {
        const data = res.data
        setAudit(data)
        setSections(data.template?.sections || [])
        setResponses(data.auditResponses || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  // Only show findings that were resolved by the manager
  const resolvedFindings = responses.filter(
    r => r.answer === 'no' &&
    (r.finding?.trim() || r.correctiveAction?.trim()) &&
    r.resolutionStatus === 'resolved'
  )

  const unresolvedFindings = responses.filter(
    r => r.answer === 'no' &&
    (r.finding?.trim() || r.correctiveAction?.trim()) &&
    r.resolutionStatus !== 'resolved'
  )

  const getItemStatement = (itemId) => {
    for (const section of sections) {
      const item = section.items?.find(i => i.id === itemId)
      if (item) return { statement: item.statement, section: section.name }
    }
    return { statement: '—', section: '—' }
  }

  const getStepStatus = (stepKey) => {
    const order = ['submitted', 'acknowledged', 'resolving', 'pending_review', 'completed']
    const currentIndex = order.indexOf(audit?.status || 'pending_review')
    const stepIndex    = order.indexOf(stepKey)
    if (stepIndex < currentIndex)  return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

    const formatDateTime = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }


  const handleSignOff = async () => {
    if (!confirmed) return
    setSubmitting(true)
    try {
      await signOffAudit(id, { comment: comment.trim() || null })
      navigate(`/officer/inspections`, { state: { tab: 'completed' } })
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  return (
    <div className="officer-pending-review">

      {/* Header */}
      <div className="pr-header">
        <h4>Inspection Sign-Off</h4>
        <p>
          {audit?.office?.facility?.name} — {audit?.office?.name} |{' '}
          {audit?.inspectionCode}
        </p>
      </div>

      <div className="pr-body">
        <div className="pr-left">

          {/* Info banner */}
          <div className="pr-info-banner">
            <span className="pr-info-icon">🔍</span>
            <div>
              <strong>Corrective actions have been marked as resolved by the facility manager.</strong>
              <p>
                Please review the resolution notes and evidence below. If satisfied,
                sign off to complete this inspection.
              </p>
            </div>
          </div>

          {/* Unresolved warning */}
          {unresolvedFindings.length > 0 && (
            <div className="pr-warning-banner">
              <span>⚠️</span>
              <div>
                <strong>{unresolvedFindings.length} finding(s) are not yet marked as resolved.</strong>
                <p>You may still sign off, but unresolved items will be noted.</p>
              </div>
            </div>
          )}

          {/* Resolved CAs table */}
          <div className="pr-card">
            <div className="pr-card-header">
              <h6>Resolved Corrective Actions</h6>
              <span className="pr-badge resolved">{resolvedFindings.length} resolved</span>
            </div>

            {resolvedFindings.length === 0 ? (
              <div className="pr-empty">
                <p>No corrective actions have been marked as resolved yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Section</th>
                      <th>Finding</th>
                      <th>Corrective Action</th>
                      <th>Assigned To</th>
                      <th>Resolution Note</th>
                      <th>Evidence</th>
                      <th>Resolved At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedFindings.map((r, index) => {
                      const { statement, section } = getItemStatement(r.checklistItemId)
                      return (
                        <tr key={r.id}>
                          <td>{index + 1}</td>
                          <td><small className="text-muted">{section}</small></td>
                          <td style={{ maxWidth: '160px' }}>
                            <small>{r.finding || '—'}</small>
                          </td>
                          <td style={{ maxWidth: '160px' }}>
                            <small>{r.correctiveAction || '—'}</small>
                          </td>
                          <td>
                            <small>{r.assignedTo || '—'}</small>
                          </td>
                          <td style={{ maxWidth: '160px' }}>
                            <small>{r.resolutionNote || '—'}</small>
                          </td>
                          <td>
                            {r.resolutionEvidence ? (
                              r.resolutionEvidence.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                                <img
                                  src={r.resolutionEvidence}
                                  alt="resolution evidence"
                                  className="pr-evidence-thumb"
                                  onClick={() => window.open(r.resolutionEvidence, '_blank')}
                                  title="Click to view full size"
                                />
                              ) : (
                                <a
                                  href={r.resolutionEvidence}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="pr-evidence-link"
                                >
                                  📄 View File
                                </a>
                              )
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>
                            <small>{formatDateTime(r.resolvedAt)}</small>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Officer comment */}
          <div className="pr-card">
            <div className="pr-card-header">
              <h6>Sign-Off Comment <span className="text-muted">(optional)</span></h6>
            </div>
            <div className="pr-card-body">
              <textarea
                className="pr-comment-input"
                placeholder="Add any remarks or observations about the corrective actions taken..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          {/* Confirmation */}
          <div className="pr-confirmation">
            <input
              type="checkbox"
              id="confirm"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirm">
              I have reviewed the corrective actions and resolution evidence.
              I confirm that the findings have been adequately addressed and
              this inspection cycle is ready to be closed.
            </label>
          </div>

          {/* Actions */}
          <div className="pr-actions">
            <button
              className="btn-pr back"
              onClick={() => navigate('/officer/inspections')}
            >
              ← Back to Inspections
            </button>
            <button
              className="btn-pr signoff"
              onClick={handleSignOff}
              disabled={!confirmed || submitting}
            >
              {submitting ? 'Completing...' : '✅ Sign Off & Complete'}
            </button>
          </div>

        </div>

        {/* Progress Stepper */}
        {/* <div className="progress-stepper"> */}
          {/* <h6>Inspection Progress</h6>
          {steps.map((step, index) => {
            const status = getStepStatus(step.key)
            return (
              <div key={step.key} className="step-item">
                <div className="step-row">
                  <div className={`step-circle ${status}`}>
                    {status === 'completed' ? '✓' : index + 1}
                  </div>
                  <span className={`step-label ${status}`}>{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`step-connector ${status === 'completed' ? 'completed' : ''}`} />
                )}
              </div>
            )
          })} */}

          {/* Timestamps */}
          {/* <div className="pr-timestamps">
            <div className="pr-timestamp-row">
              <span>Submitted</span>
              <span>{formatDate(audit?.submittedAt)}</span>
            </div>
            <div className="pr-timestamp-row">
              <span>Acknowledged</span>
              <span>{formatDate(audit?.acknowledgedAt)}</span>
            </div>
            <div className="pr-timestamp-row">
              <span>Completed</span>
              <span>{formatDate(audit?.completedAt) || 'Pending'}</span>
            </div>
          </div>
        </div> */}

      </div>
    </div>
  )
}

export default OfficerPendingReview