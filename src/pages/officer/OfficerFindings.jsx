// Full updated OfficerFindings.jsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getAuditById } from '../../services/auditService'
import { saveResponsesBulk } from '../../services/auditService'
import '../css/OfficerFindings.css'

const steps = [
  { key: 'schedule',  label: 'Schedule' },
  { key: 'start',     label: 'Start Inspection' },
  { key: 'checklist', label: 'Checklist Assessment' },
  { key: 'findings',  label: 'Findings & Corrective Actions' },
  { key: 'review',    label: 'Review & Submit' }
]

const SEVERITY_OPTIONS = ['low', 'medium', 'high']

const OfficerFindings = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const lastSectionIndex = location.state?.fromSectionIndex ?? null

  const [audit, setAudit]       = useState(null)
  const [sections, setSections] = useState([])
  const [responses, setResponses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

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

  // ── Metrics ─────────────────────────────────────────────────────────────────
  const yesCount       = responses.filter(r => r.answer === 'yes').length
  const noCount        = responses.filter(r => r.answer === 'no').length
  const applicableCount = yesCount + noCount
  const complianceRate = applicableCount > 0
    ? Math.round((yesCount / applicableCount) * 100) : 0

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

  const noResponses        = responses.filter(r => r.answer === 'no')
  const findingsWithContent = noResponses.filter(
    r => r.finding?.trim() || r.correctiveAction?.trim()
  )
  const findingsCount      = findingsWithContent.length
  const correctiveActCount = noResponses.filter(r => r.correctiveAction?.trim()).length

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
  // ── Item lookup ──────────────────────────────────────────────────────────────
  const getItemStatement = (itemId) => {
    for (const section of sections) {
      const item = section.items.find(i => i.id === itemId)
      if (item) return { statement: item.statement, section: section.name }
    }
    return { statement: '—', section: '—' }
  }

  // ── Severity edit (local, saved on "Proceed to Review") ─────────────────────
  const [severityMap, setSeverityMap] = useState({})
  const [severityInitialized, setSeverityInitialized] = useState(false)

  useEffect(() => {
    if (responses.length === 0 || severityInitialized) return
    const map = {}
    responses.forEach(r => {
      if (r.answer === 'no') map[r.id] = r.severity || 'medium'
    })
    setSeverityMap(map)
    setSeverityInitialized(true)
  }, [responses, severityInitialized])
    const handleSeverityChange = (responseId, value) => {
      setSeverityMap(prev => ({ ...prev, [responseId]: value }))
    }

  // ── Save severity + navigate to review ───────────────────────────────────────
  const handleProceedToReview = async () => {
    setSaving(true)
    try {
      // Merge severity back into responses payload
      const payload = responses.map(r => ({
        checklistItemId:  r.checklistItemId,
        answer:           r.answer,
        remarks:          r.remarks          || '',
        finding:          r.finding          || '',
        correctiveAction: r.correctiveAction || '',
        severity:         severityMap[r.id]  || r.severity || 'medium',
        isNASection:      r.isNASection      || false
      }))
      await saveResponsesBulk(id, { responses: payload })
      navigate(`/officer/inspections/${id}/review`)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }
  
  // ── Save severity + exit to inspections list ───────────────────────────────────────
  // const handleSaveAndExit = async () => {
  //   setSaving(true)
  //   try {
  //     // Only thing editable on this page is severity
  //     const payload = responses
  //       .filter(r => r.answer === 'no')
  //       .map(r => ({
  //         checklistItemId: r.checklistItemId,
  //         answer:          r.answer,
  //         remarks:         r.remarks          || '',
  //         finding:         r.finding          || '',
  //         correctiveAction:r.correctiveAction || '',
  //         isNASection:     r.isNASection      || false,
  //         severity:        severityMap[r.id]  || r.severity || 'medium'
  //       }))

  //     await saveResponsesBulk(id, { responses: payload })
  //     navigate('/officer/inspections')
  //   } catch (err) {
  //     console.error(err)
  //   } finally {
  //     setSaving(false)
  //   }
  // }

  const getStepStatus = (stepKey) => {
    if (['schedule', 'start', 'checklist'].includes(stepKey)) return 'completed'
    if (stepKey === 'findings') return 'active'
    return 'pending'
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  return (
    <div className="officer-findings">
      <div className="findings-header">
        <h4>Findings & Corrective Actions</h4>
        <p>
          {audit?.inspectionCode} |{' '}
          {audit?.office?.facility?.name} — {audit?.office?.name} 
        </p>
      </div>

      <div className="findings-body">
        <div className="findings-left">

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
                <th>Compliance Rate</th>
                <th>Compliance Level</th>
              </tr>
            </thead>
            <tbody>
              {sections.map(section => {
                const stats = getSectionStats(section)
                // Skip fully N/A sections (stats will be null or rate meaningless)
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

          {/* Findings Table */}
          <div className="findings-table-card">
            <div className="findings-table-card-header">
              <h6>Findings & Corrective Actions Noted</h6>
              {findingsWithContent.length > 0 && (
                <small className="text-muted">
                  You can adjust severity before proceeding.
                </small>
              )}
            </div>

            {findingsWithContent.length === 0 ? (
              <div className="no-findings">
                <div className="no-findings-icon">✅</div>
                <p>
                  {noCount > 0
                    ? 'Non-compliant items exist but no findings have been written yet. Go back to the checklist to add findings.'
                    : 'No findings — all items are compliant!'}
                </p>
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
                      <th>Priority Level</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findingsWithContent.map((response, index) => {
                      const { statement, section } = getItemStatement(response.checklistItemId)
                      return (
                        <tr key={response.id}>
                          <td>{index + 1}</td>
                          <td><small className="text-muted">{section}</small></td>
                          <td style={{ maxWidth: '180px' }}>
                            <small>{statement}</small>
                          </td>
                          <td style={{ maxWidth: '180px' }}>
                            <small>{response.finding || <span className="text-muted">—</span>}</small>
                          </td>
                          <td style={{ maxWidth: '180px' }}>
                            <small>{response.correctiveAction || <span className="text-muted">—</span>}</small>
                          </td>
                          <td>
                            <select
                              className="severity-select"
                              value={severityMap[response.id] || 'medium'}
                              onChange={e => handleSeverityChange(response.id, e.target.value)}
                            >                              
                              {SEVERITY_OPTIONS.map(s => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {response.evidence.map((ev, i) =>
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
                                <a
                                  key={i}
                                  href={ev.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="findings-evidence-file"
                                >
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

          {/* Actions */}
          <div className="findings-actions">
            <button
              className="btn-findings back"
              onClick={() => navigate(`/officer/inspections/${id}/checklist`, {
                state: { startSectionIndex: lastSectionIndex ?? 0 }
              })}
            >
              ← Back to Checklist
            </button>
            {/* <button
              className="btn-findings exit"
              onClick={handleSaveAndExit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Exit'}
            </button> */}
            <button
              className="btn-findings next"
              onClick={handleProceedToReview}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Proceed to Review →'}
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
                  <span className={`step-label ${status}`}>{step.label}</span>
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

export default OfficerFindings