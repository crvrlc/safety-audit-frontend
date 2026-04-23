import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getAuditById, saveResponsesBulk, submitAudit } from '../../services/auditService'
import api from '../../services/api'
import '../css/OfficerChecklist.css'

const OfficerChecklist = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [audit, setAudit] = useState(null)
  const [sections, setSections] = useState([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(
    location.state?.startSectionIndex || 0
  )
  const [responses, setResponses] = useState({})
  const [sectionNA, setSectionNA] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timer, setTimer] = useState(() => {
    const saved = localStorage.getItem(`audit-timer-${id}`)
    return saved ? parseInt(saved) : 0
  })
  const timerRef = useRef(null)
  const fileInputRef = useRef(null)
  const [activeEvidenceItem, setActiveEvidenceItem] = useState(null)

  // Load audit + checklist
  useEffect(() => {
    getAuditById(id).then(res => {
      const data = res.data
      setAudit(data)
      const sections = data.template?.sections || []
      setSections(sections)

      // Pre-fill existing responses
      const existingResponses = {}
      data.auditResponses?.forEach(r => {
        existingResponses[r.checklistItemId] = {
          answer:           r.answer,
          remarks:          r.remarks || '',
          finding:          r.finding || '',
          correctiveAction: r.correctiveAction || '',
          evidence:         r.evidence || [],
          isNASection:      r.isNASection || false,
          id:               r.id
        }
      })
      setResponses(existingResponses)

      // Restore collapsed sections — if ALL items in a section are isNASection, collapse it
      const restoredSectionNA = {}
      sections.forEach(section => {
        const allNA = section.items?.length > 0 && section.items.every(
          item => existingResponses[item.id]?.isNASection === true
        )
        if (allNA) restoredSectionNA[section.id] = true
      })
      setSectionNA(restoredSectionNA)

      const firstIncompleteIndex = sections.findIndex(section =>
        section.items.some(item => !existingResponses[item.id]?.answer)
      )
      setCurrentSectionIndex(
        firstIncompleteIndex === -1
          ? sections.length - 1  // all done, go to last section
          : firstIncompleteIndex
      )

    }).catch(err => console.error(err))
    .finally(() => setLoading(false))
  }, [id])

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(t => {
        const next = t + 1
        localStorage.setItem(`audit-timer-${id}`, next)  // ← save every tick
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
  }

  const currentSection = sections[currentSectionIndex]
  const totalSections = sections.length
  const isLastSection = currentSectionIndex === totalSections - 1
  const isFirstSection = currentSectionIndex === 0

  // Count answered items across all sections
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)
  const answeredItems = Object.keys(responses).length
  const progressPercent = totalItems > 0
    ? Math.round((answeredItems / totalItems) * 100)
    : 0

  const handleAnswer = (itemId, answer) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        answer
      }
    }))
  }

  const handleRemarks = (itemId, remarks) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        remarks
      }
    }))
  }

  const handleSectionNA = (sectionId, checked) => {
    setSectionNA(prev => ({ ...prev, [sectionId]: checked }))

    if (checked && currentSection) {
      const updates = {}
      currentSection.items.forEach(item => {
        updates[item.id] = {
          answer:           'na',
          remarks:          '',
          finding:          '',
          correctiveAction: '',
          evidence:         [],
          isNASection:      true
        }
      })
      setResponses(prev => ({ ...prev, ...updates }))
    } else if (currentSection) {
      const updates = { ...responses }
      currentSection.items.forEach(item => {
        delete updates[item.id]
      })
      setResponses(updates)
    }
  }

const handleEvidenceUpload = async (e, itemId) => {
  const file = e.target.files[0]
  if (!file) return

  let responseId = responses[itemId]?.id

  // Auto-save first if this item hasn't been persisted yet
  if (!responseId) {
    try {
      const result = await saveResponsesBulk(id, { responses: buildResponsesPayload() })

      // Update local state with the returned IDs so future uploads skip this step
      setResponses(prev => {
        const updated = { ...prev }
        result.saved.forEach(savedItem => {
          const key = savedItem.checklistItemId
          if (updated[key]) {
            updated[key] = { ...updated[key], id: savedItem.id }
          }
        })
        return updated
      })

      console.log('itemId:', itemId, typeof itemId)
      console.log('saved items:', result.saved.map(s => ({ id: s.checklistItemId, type: typeof s.checklistItemId })))

      // Get the ID for the current item
      const savedItem = result.saved.find(s => s.checklistItemId === itemId)

      console.log('savedItem:', savedItem)
      console.log('responseId:', savedItem?.id) 

      responseId = savedItem?.id
    } catch (err) {
      console.error('Auto-save failed:', err)
      alert('Failed to save progress. Please try again.')
      return
    }
  }

  if (!responseId) {
    alert('Could not get response ID. Please try again.')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await api.post(`/evidence/response/${responseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        evidence: [...(prev[itemId]?.evidence || []), res.data]
      }
    }))
  } catch (err) {
    console.error('Evidence upload error:', err)
  }
}

  const buildResponsesPayload = () => {
    return Object.entries(responses).map(([itemId, data]) => ({
      checklistItemId: parseInt(itemId),
      answer:          data.answer,
      remarks:         data.remarks || '',
      finding:         data.finding || '',
      correctiveAction:data.correctiveAction || '',
      evidence:        data.evidence || [],
      isNASection:     data.isNASection || false
    }))
  }

  const handleSaveAndExit = async () => {
    setSaving(true)
    try {
      await saveResponsesBulk(id, { responses: buildResponsesPayload() })
      navigate('/officer/inspections')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleNextSection = async () => {
    setSaving(true)
    try {
      await saveResponsesBulk(id, { responses: buildResponsesPayload() })
      setCurrentSectionIndex(i => i + 1)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handlePrevSection = async () => {
    setSaving(true)
    try {
      await saveResponsesBulk(id, { responses: buildResponsesPayload() })
      setCurrentSectionIndex(i => i - 1)
      window.scrollTo(0, 0)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await saveResponsesBulk(id, { responses: buildResponsesPayload() })
      // ← no submitAudit call, no status change, just navigate
      navigate(`/officer/inspections/${id}/findings`, {
        state: { fromSectionIndex: currentSectionIndex }
      })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const updateResponse = (itemId, newData) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...newData
      }
    }))
  }

  const handleFinding = (itemId, value) => {
    updateResponse(itemId, { finding: value })
  }

  const handleCorrectiveAction = (itemId, value) => {
    updateResponse(itemId, { correctiveAction: value })
  }

  const handleRemoveEvidence = async (itemId, evidenceId) => {
  try {
    await api.delete(`/evidence/${evidenceId}`)
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        evidence: prev[itemId].evidence.filter(ev => ev.id !== evidenceId)
      }
    }))
  } catch (err) {
    console.error('Remove evidence error:', err)
  }
}

  const getRowClass = (itemId) => {
    const answer = responses[itemId]?.answer
    if (answer === 'yes') return 'answered-yes'
    if (answer === 'no')  return 'answered-no'
    if (answer === 'na')  return 'answered-na'
    return ''
  }

  if (loading) return (
    <div className="text-center mt-5">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  if (!audit || !currentSection) return (
    <div className="text-center mt-5">
      <p className="text-muted">Checklist not found.</p>
    </div>
  )

  const isSectionNA = sectionNA[currentSection.id] || false

  return (
    <div className="officer-checklist">

      {/* Top Bar */}
      <div className="checklist-topbar">
        <div className="checklist-topbar-left">
          <h5>
            {audit.office?.facility?.name} — {audit.office?.name}
          </h5>
          <p>{audit.inspectionCode}</p>
        </div>
        <div className="checklist-timer">
          <span className="checklist-timer-icon">⏱️</span>
          <span>{formatTimer(timer)}</span>
        </div>
      </div>

      {/* Section Card */}
      <div className="checklist-section-card">

        {/* Section Header */}
        <div className="checklist-section-header">
          <h5 className="checklist-section-title">
            {currentSection.name}
          </h5>
          <label className="checklist-section-na">
            <input
              type="checkbox"
              checked={isSectionNA}
              onChange={e => handleSectionNA(currentSection.id, e.target.checked)}
            />
            Section Not Applicable
          </label>
        </div>

        {/* Progress */}
        <div className="checklist-progress-bar-wrap">
          <div className="checklist-progress-label">
            <span>
              Checklist Progress: Section {currentSectionIndex + 1} of {totalSections}
            </span>
            <span>{answeredItems}/{totalItems} items ({progressPercent}%)</span>
          </div>
          <div className="checklist-progress-bar">
            <div
              className="checklist-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Table or NA message */}
        {isSectionNA ? (
          <div className="section-na-overlay">
            ✓ This section has been marked as Not Applicable
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>Checklist Item</th>
                  <th>Yes</th>
                  <th>No</th>
                  <th>N/A</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {currentSection.items.map(item => {
                  const response = responses[item.id]
                  const answer = response?.answer

                  return (
                    <tr key={item.id} className={getRowClass(item.id)}>

                      {/* Item Statement */}
                      <td>
                        <div className="item-statement">
                          {item.statement}
                          {item.isRequired && (
                            <span className="item-required">*</span>
                          )}
                        </div>
                      </td>

                      {/* Yes */}
                      <td className="answer-cell">
                        <button
                          className={`answer-radio ${answer === 'yes' ? 'selected-yes' : ''}`}
                          onClick={() => handleAnswer(item.id, 'yes')}
                        >
                          {answer === 'yes' ? '✓' : ''}
                        </button>
                      </td>

                      {/* No */}
                      <td className="answer-cell">
                        <button
                          className={`answer-radio ${answer === 'no' ? 'selected-no' : ''}`}
                          onClick={() => handleAnswer(item.id, 'no')}
                        >
                          {answer === 'no' ? '✗' : ''}
                        </button>
                      </td>

                      {/* N/A */}
                      <td className="answer-cell">
                        <button
                          className={`answer-radio ${answer === 'na' ? 'selected-na' : ''}`}
                          onClick={() => handleAnswer(item.id, 'na')}
                        >
                          {answer === 'na' ? '—' : ''}
                        </button>
                      </td>

                      {/* Remarks + Evidence */}
                      <td>
                        <div className="remarks-cell">

                          {/* If NO → show finding + corrective action */}
                          {answer === 'no' ? (
                            <>
                              <textarea
                                className="remarks-input"
                                placeholder="Describe the finding..."
                                value={response?.finding || ''}
                                onChange={e => handleFinding(item.id, e.target.value)}
                                rows={2}
                              />

                              <textarea
                                className="remarks-input"
                                placeholder="Enter corrective action..."
                                value={response?.correctiveAction || ''}
                                onChange={e => handleCorrectiveAction(item.id, e.target.value)}
                                rows={2}
                              />
                            </>
                          ) : (
                            <textarea
                              className="remarks-input"
                              placeholder="Optional notes..."
                              value={response?.remarks || ''}
                              onChange={e => handleRemarks(item.id, e.target.value)}
                              rows={2}
                              disabled={!answer}
                            />
                          )}

                         
                          {/* Evidence upload */}
                          <button
                            className="btn-evidence"
                            onClick={() => {
                              setActiveEvidenceItem(item.id)
                              fileInputRef.current?.click()
                            }}
                            disabled={!answer}
                          >
                            📎 Add Photo/File
                          </button>

                          {/* Evidence previews */}
                          {response?.evidence?.length > 0 && (
                            <div className="evidence-preview">
                              {response.evidence.map((ev, i) => (
                                <div key={i} className="evidence-thumb-wrapper">
                                  {ev.fileType?.startsWith('image') ? (
                                    <img
                                      src={ev.fileUrl}
                                      alt="evidence"
                                      className="evidence-thumb"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#555' }}>📄 File {i + 1}</span>
                                  )}
                                  <button
                                    className="evidence-remove-btn"
                                    onClick={() => handleRemoveEvidence(item.id, ev.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*,.pdf"
        onChange={e => handleEvidenceUpload(e, activeEvidenceItem)}
      />

      {/* Bottom Actions */}
      <div className="checklist-actions">
        <div className="checklist-actions-left">
          <button
            className="btn-checklist save-exit"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save & Exit'}
          </button>
        </div>

        <div className="checklist-actions-right">
          {!isFirstSection && (
            <button
              className="btn-checklist prev"
              onClick={handlePrevSection}
              disabled={saving}   
            >
              {saving ? 'Saving...' : '← Prev Section'}
            </button>
          )}

          {!isLastSection ? (
            <button
              className="btn-checklist next"
              onClick={handleNextSection}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Next Section →'}
            </button>
          ) : (
           <button
            className="btn-checklist submit"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Review Findings →'}
          </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OfficerChecklist