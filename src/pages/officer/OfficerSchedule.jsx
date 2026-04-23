import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAuditById, createAudit, updateAudit, startAudit } from '../../services/auditService'
import api from '../../services/api'
import '../css/OfficerSchedule.css'

const OfficerSchedule = () => {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()

  const isEditing = !!id

  const [facilities, setFacilities] = useState([])
  const [offices, setOffices] = useState([])       // offices for selected facility
  const [officers, setOfficers] = useState([])
  const [templates, setTemplates] = useState([])
  const [defaultTemplateId, setDefaultTemplateId] = useState(null)

  // Full office object for the currently selected office — gives us its unit
  const [selectedOffice, setSelectedOffice] = useState(null)


  const [form, setForm] = useState({
    facilityId:     '',
    officeId:       '',
    inspectorId:    user?.id || '',
    inspectionDate: '',
    inspectionTime: '',
    inspectionType: 'routine',
    notes:          '',
    templateId:     ''
  })

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [successModal, setSuccessModal] = useState(null) // { auditId }

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/facilities').then(res => setFacilities(res.data))
    api.get('/users')
      .then(res => setOfficers(res.data.filter(u => u.role === 'safety_officer')))
      .catch(() => setOfficers([{ id: user?.id, name: user?.name }]))
      api.get('/checklists/template')
        .then(res => {
          if (res.data?.id) setDefaultTemplateId(res.data.id)
        })
        .catch(() => setDefaultTemplateId(null))
  }, [])

  // ── When facility changes: load offices for that building ──────────────────
  useEffect(() => {
    if (!form.facilityId) {
      setOffices([])
      setSelectedOffice(null)
      setForm(f => ({ ...f, officeId: '' }))
      return
    }
    api.get(`/offices/facility/${form.facilityId}`).then(res => setOffices(res.data))
    setSelectedOffice(null)
      if (!isEditing) {
      setForm(f => ({ ...f, officeId: '' }))
    }
  }, [form.facilityId])

  // ── When office changes: auto-resolve unit from the office object ──────────
  useEffect(() => {
    if (!form.officeId) { setSelectedOffice(null); return }
    const office = offices.find(o => o.id === parseInt(form.officeId))
    setSelectedOffice(office || null)
  }, [form.officeId, offices])

  // ── Load existing audit when editing ───────────────────────────────────────
  useEffect(() => {
    if (!isEditing) return
    getAuditById(id).then(res => {
      const a = res.data
      const date = a.scheduledAt ? new Date(a.scheduledAt) : null
      setForm({
        facilityId:     a.office?.facilityId || '',
        officeId:       a.officeId           || '',
        inspectorId:    a.inspectorId        || user?.id,
        inspectionDate: date ? date.toISOString().split('T')[0] : '',
        inspectionTime: date ? date.toTimeString().slice(0, 5)  : '',
        inspectionType: a.inspectionType     || 'routine',
        notes:          a.notes              || '',
        templateId:     a.templateId         || ''
      })
      // Pre-set the selected office so the unit label shows immediately
      if (a.office) setSelectedOffice(a.office)
    })
  }, [id])

  // ── Helpers ────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const buildPayload = (status) => {
    const scheduledAt = form.inspectionDate
      ? new Date(`${form.inspectionDate}T${form.inspectionTime || '08:00'}`)
      : null
    return {
      officeId:       parseInt(form.officeId),
      templateId:     defaultTemplateId, 
      inspectionType: form.inspectionType,
      notes:          form.notes,
      scheduledAt:    scheduledAt ? scheduledAt.toISOString() : null,
      status
    }
  }

  const validate = () => {
    if (!form.facilityId) return 'Please select a facility'
    // if (!form.unitId)     return 'Please select a unit'
    if (!form.officeId)   return 'Please select an office'
    if (!defaultTemplateId) return 'No active checklist template found. Please contact the administrator.'
    return null
  }

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    const error = validate()
    if (error) { setAlert({ type: 'error', message: error }); return }

    setLoading(true)
    try {
      if (isEditing) {
        await updateAudit(id, buildPayload('draft'))
      } else {
        await createAudit(buildPayload('draft'))
      }
      setAlert({ type: 'success', message: 'Draft saved successfully!' })
      setTimeout(() => navigate('/officer/inspections?tab=draft'), 1500)
    } catch {
      setAlert({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    const error = validate()
    if (error) { setAlert({ type: 'error', message: error }); return }
    if (!form.inspectionDate) {
      setAlert({ type: 'error', message: 'Please select an inspection date' })
      return
    }

    setLoading(true)
    try {
      let result
      if (isEditing) {
        result = await updateAudit(id, buildPayload('scheduled'))
      } else {
        result = await createAudit(buildPayload('scheduled'))
      }
      const auditId = result?.data?.id || id
      setSuccessModal({ auditId })
    } catch {
      setAlert({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleStartNow = async (auditId) => {
  try {
    await startAudit(auditId)  // sets status → ongoing
    navigate(`/officer/inspections/${auditId}/checklist`)
  } catch {
    setAlert({ type: 'error', message: 'Failed to start inspection.' })
  }
}

  // ── Success Modal ──────────────────────────────────────────────────────────
  const SuccessModal = ({ auditId }) => (
  <div className="modal-overlay">
    <div className="modal-card">
      <div className="modal-icon">✅</div>
      <h5>Inspection Scheduled!</h5>
      <p>The inspection has been successfully scheduled.</p>
      <div className="modal-actions">
        <button
          className="btn-modal primary"
          onClick={() => handleStartNow(auditId)}  // ← changed
        >
          Start Inspection Now
        </button>
        <button
          className="btn-modal secondary"
          onClick={() => navigate('/officer/inspections')}
        >
          View Scheduled Inspections
        </button>
        <button
          className="btn-modal ghost"
          onClick={() => navigate('/officer/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
)

    const selectedFacility = facilities.find(f => f.id === parseInt(form.facilityId))


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="officer-schedule">

      {successModal && <SuccessModal auditId={successModal.auditId} />}

      {/* Header */}
      <div className="schedule-header">
        <h4>{isEditing ? 'Edit Inspection' : 'Schedule New Inspection'}</h4>
        <p>Fill out the form below to schedule a safety inspection</p>
      </div>

      <div className="schedule-body">

        <div className="schedule-form-card">
          <h6>Inspection Details</h6>

          {alert && (
            <div className={`form-alert ${alert.type}`}>
              {alert.message}
            </div>
          )}

          {/* Building / Facility */}
          <div className="form-group">
            <label>Building / Facility <span>*</span></label>
            <select
              name="facilityId"
              className="form-control-custom"
              value={form.facilityId}
              onChange={handleChange}
            >
              <option value="">Select building...</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Office — based on building */}
          <div className="form-group">
            <label>Office / Room <span>*</span></label>
            <select
              name="officeId"
              className="form-control-custom"
              value={form.officeId}
              onChange={handleChange}
              disabled={!form.facilityId}
            >
              <option value="">
                {form.facilityId ? 'Select office...' : 'Select building first'}
              </option>
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

           {/* Unit in Charge and Facility Manager — auto-filled from selected office */}
          <div className="form-row">
          <div className="form-group">
            <label>Unit-in-Charge <span></span></label>
            <div className="form-control-custom unit-display">
              {selectedFacility?.unitInCharge || '—'}
            </div>
          </div>
            <div className="form-group">
              <label>Facility Manager <span></span></label>
              <div className="form-control-custom unit-display">
                {selectedFacility?.facilityManagerName || '—'}
              </div>
            </div>
          </div>


          {/* Inspector */}
          <div className="form-row">
          <div className="form-group">
            <label>Inspector <span>*</span></label>
            <select
              name="inspectorId"
              className="form-control-custom"
              value={form.inspectorId}
              onChange={handleChange}
            >
              <option value={user?.id}>{user?.name} (You)</option>
              {officers
                .filter(o => o.id !== user?.id)
                .map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
            </select>
          </div>
            <div className="form-group">
              <label>Inspection Purpose <span>*</span></label>
              <select
                name="inspectionType"
                className="form-control-custom"
                value={form.inspectionType}
                onChange={handleChange}
              >
                <option value="routine">Routine</option>
                <option value="follow_up">Follow-up</option>
              </select>
            </div>
          </div>

          {/* Date + Time */}
          <div className="form-row">
            <div className="form-group">
              <label>Inspection Date</label>
              <input
                type="date"
                name="inspectionDate"
                className="form-control-custom"
                value={form.inspectionDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>Inspection Time</label>
              <input
                type="time"
                name="inspectionTime"
                className="form-control-custom"
                value={form.inspectionTime}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              className="form-control-custom"
              placeholder="Additional notes or instructions..."
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              className="btn-form cancel"
              onClick={() => navigate('/officer/inspections')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="btn-form draft"
              onClick={handleSaveDraft}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              className="btn-form save"
              onClick={handleSaveSchedule}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>

        {/* Quick Links
        <div className="quick-links-card">
          <h6>Quick Links</h6>
          <button className="quick-link-btn" onClick={() => navigate('/officer/inspections')}>
            <span className="quick-link-icon">▶️</span>
            Start Inspection Now
          </button>
          <button className="quick-link-btn" onClick={() => navigate('/officer/inspection?tab=scheduled')}>
            <span className="quick-link-icon">📋</span>
            View Scheduled Inspections
          </button>
          <button className="quick-link-btn" onClick={() => navigate('/officer/dashboard')}>
            <span className="quick-link-icon">🏠</span>
            Return to Dashboard
          </button>
        </div> */}

      </div>
    </div>
  )
}

export default OfficerSchedule