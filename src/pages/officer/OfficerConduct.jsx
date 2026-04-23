import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuditById, startAudit } from '../../services/auditService'
import '../css/OfficerConduct.css'

const steps = [
  { key: 'schedule',  label: 'Schedule' },
  { key: 'start',     label: 'Review Inspection Details' },
  { key: 'checklist', label: 'Start Checklist Assessment' },
  { key: 'findings',  label: 'Findings & Corrective Actions' },
  { key: 'review',    label: 'Review & Submit' }
]

const reminders = [
  { icon: '📸', text: 'Take photos for any deficiencies or non-compliant items you find.' },
  { icon: '✅', text: 'Be objective and honest in your assessments.' },
  { icon: '📝', text: 'Add remarks for items that need clarification or context.' },
  { icon: '🔍', text: 'Check all areas thoroughly — do not skip sections unless truly not applicable.' },
  { icon: '⏱️', text: 'Complete the checklist in one session if possible to ensure accuracy.' },
  { icon: '📋', text: 'Mark the entire section as N/A only if it truly does not apply to this facility.' }
]

const OfficerConduct = () => {
  const [auditData, setAuditData] = useState( null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    if (id) {
      getAuditById(id)
        .then(res => setAuditData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [id])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleTimeString('en-PH', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const handleBeginAssessment = async () => {
    if (!auditData) return
    setStarting(true)
    try {
      if (auditData.status === 'scheduled') {
        await startAudit(auditData.id)
      }

      // Find last section that has been worked on
      if (auditData.status === 'ongoing') {
        const sections = auditData.template?.sections || []
        const answeredItemIds = new Set(auditData.auditResponses?.map(r => r.checklistItemId) || [])

        let lastWorkedIndex = 0
        sections.forEach((s, i) => {
          if (s.items?.some(item => answeredItemIds.has(item.id))) {
            lastWorkedIndex = i
          }
        })

        navigate(`/officer/inspections/${id}/checklist`, {
          state: { startSectionIndex: lastWorkedIndex }
        })
      } else {
        navigate(`/officer/inspections/${id}/checklist`)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setStarting(false)
    }
  }

 const handleEdit = () => {
  navigate(`/officer/schedule/${id}/edit`)
}

  const getStepStatus = (stepKey) => {
    if (stepKey === 'schedule') return 'completed'
    if (stepKey === 'start') return 'active'
    return 'pending'
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  if (!auditData) return (
    <div className="text-center mt-5">
      <p className="text-muted">No inspection selected.</p>
      <button
        className="btn-begin"
        onClick={() => navigate(`/officer/inspections/`)}
      >
        Go to Inspections
      </button>
    </div>
  )

  return (
    <div className="officer-conduct">

      {/* Header */}
      <div className="conduct-header">
        <h4>Review Inspection Details</h4>
        <p>Review the inspection details before beginning the checklist assessment.</p>
      </div>

      <div className="conduct-body">
        <div className="conduct-left">

          {/* Details Card */}
          <div className="details-card">
            <div className="details-card-header">
              <h6>Inspection Details</h6>
              <span className={`conduct-status-badge ${auditData.status}`}>
                {auditData.status}
              </span>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <label>Inspection Code</label>
                <p className="inspection-code">{auditData.inspectionCode}</p>
              </div>
              <div className="detail-item">
                <label>Inspection Type</label>
                <p style={{ textTransform: 'capitalize' }}>
                  {auditData.inspectionType?.replace('_', ' ')}
                </p>
              </div>
              <div className="detail-item">
                <label>Facility - Office</label>
                <p>{auditData.office?.facility?.name || '—'} - {auditData.office?.name || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Unit in Charge</label>
                <p>{auditData.office?.facility?.unitInCharge || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Facility Manager</label>
                <p>{auditData.office?.facility?.facilityManagerName || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Inspector</label>
                <p>{auditData.inspector?.name || '—'}</p>
              </div>
              <div className="detail-item">
                <label>Scheduled Date</label>
                <p>{formatDate(auditData.scheduledAt)}</p>
              </div>
              <div className="detail-item">
                <label>Scheduled Time</label>
                <p>{formatTime(auditData.scheduledAt)}</p>
              </div>
              {auditData.purpose && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Purpose</label>
                  <p>{auditData.purpose}</p>
                </div>
              )}
              {auditData.notes && (
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Notes</label>
                  <p>{auditData.notes}</p>
                </div>
              )}
            </div>

            <div className="details-actions">
              <button className="btn-edit" onClick={handleEdit}>
                ✏️ Edit Schedule
              </button>
              <button
                className="btn-begin"
                onClick={handleBeginAssessment}
                disabled={starting}
              >
                {starting
                  ? 'Starting...'
                  : auditData.status === 'ongoing'
                    ? '🔄 Resume Inspection'
                    : '▶ Begin Assessment'
                }
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div className="reminders-card">
            <h6>📝 Reminders</h6>
            <ul className="reminders-list">
              {reminders.map((r, i) => (
                <li key={i}>
                  <span className="reminder-icon">{r.icon}</span>
                  {r.text}
                </li>
              ))}
            </ul>
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

export default OfficerConduct