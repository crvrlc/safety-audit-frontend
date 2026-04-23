import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { createAudit } from '../../services/auditService'
import api from '../../services/api'
import './OfficerSchedule.css'

const OfficerSchedule = ({ setActivePage }) => {
  const { user } = useAuth()

  const [facilities, setFacilities] = useState([])
  const [units, setUnits] = useState([])
  const [offices, setOffices] = useState([])
  const [officers, setOfficers] = useState([])
  const [templates, setTemplates] = useState([])

  const [form, setForm] = useState({
    facilityId:     '',
    unitId:         '',
    officeId:       '',
    inspectorId:    user?.id || '',
    inspectionDate: '',
    inspectionTime: '',
    inspectionType: 'routine',
    purpose:        '',
    notes:          '',
    templateId:     ''
  })

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(null)

  // Load initial data
  useEffect(() => {
    api.get('/facilities').then(res => setFacilities(res.data))
    api.get('/users').then(res => {
      setOfficers(res.data.filter(u => u.role === 'safety_officer'))
    }).catch(() => {
      // If not admin, just show current user
      setOfficers([{ id: user?.id, name: user?.name }])
    })
    api.get('/checklists').then(res => {
      setTemplates(res.data.filter(t => t.isActive))
    })
  }, [])

  // Load units when facility changes
  useEffect(() => {
    if (!form.facilityId) { setUnits([]); setOffices([]); return }
    api.get(`/units/facility/${form.facilityId}`).then(res => {
      setUnits(res.data)
      setForm(f => ({ ...f, unitId: '', officeId: '' }))
      setOffices([])
    })
  }, [form.facilityId])

  // Load offices when unit changes
  useEffect(() => {
    if (!form.unitId) { setOffices([]); return }
    api.get(`/offices/unit/${form.unitId}`).then(res => {
      setOffices(res.data)
      setForm(f => ({ ...f, officeId: '' }))
    })
  }, [form.unitId])

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const buildPayload = (status) => {
    const scheduledAt = form.inspectionDate
      ? new Date(`${form.inspectionDate}T${form.inspectionTime || '08:00'}`)
      : null

    return {
      officeId:       parseInt(form.officeId),
      templateId:     parseInt(form.templateId),
      inspectorId:    parseInt(form.inspectorId),
      inspectionType: form.inspectionType,
      purpose:        form.purpose,
      notes:          form.notes,
      scheduledAt:    scheduledAt ? scheduledAt.toISOString() : null,
      status
    }
  }

  const validate = () => {
    if (!form.facilityId) return 'Please select a facility'
    if (!form.unitId)     return 'Please select a unit'
    if (!form.officeId)   return 'Please select an office'
    if (!form.templateId) return 'Please select a checklist template'
    return null
  }

  const handleSaveDraft = async () => {
    const error = validate()
    if (error) { setAlert({ type: 'error', message: error }); return }

    setLoading(true)
    try {
      await createAudit(buildPayload('draft'))
      setAlert({ type: 'success', message: 'Draft saved successfully!' })
      setTimeout(() => setActivePage('inspections'), 1500)
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to save draft. Please try again.' })
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
      await createAudit(buildPayload('scheduled'))
      setAlert({ type: 'success', message: 'Inspection scheduled successfully!' })
      setTimeout(() => setActivePage('inspections'), 1500)
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to schedule inspection. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="officer-schedule">

      {/* Header */}
      <div className="schedule-header">
        <h4>Schedule New Inspection</h4>
        <p>Fill out the form below to schedule a safety inspection</p>
      </div>

      <div className="schedule-body">

        {/* Form */}
        <div className="schedule-form-card">
          <h6>Inspection Details</h6>

          {alert && (
            <div className={`form-alert ${alert.type}`}>
              {alert.message}
            </div>
          )}

          {/* Facility */}
          <div className="form-group">
            <label>Building / Facility <span>*</span></label>
            <select
              name="facilityId"
              className="form-control-custom"
              value={form.facilityId}
              onChange={handleChange}
            >
              <option value="">Select facility...</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div className="form-group">
            <label>Unit in Charge <span>*</span></label>
            <select
              name="unitId"
              className="form-control-custom"
              value={form.unitId}
              onChange={handleChange}
              disabled={!form.facilityId}
            >
              <option value="">
                {form.facilityId ? 'Select unit...' : 'Select facility first'}
              </option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Office */}
          <div className="form-group">
            <label>Office / Room <span>*</span></label>
            <select
              name="officeId"
              className="form-control-custom"
              value={form.officeId}
              onChange={handleChange}
              disabled={!form.unitId}
            >
              <option value="">
                {form.unitId ? 'Select office...' : 'Select unit first'}
              </option>
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Inspector */}
          <div className="form-group">
            <label>Inspector <span>*</span></label>
            <select
              name="inspectorId"
              className="form-control-custom"
              value={form.inspectorId}
              onChange={handleChange}
            >
              {/* Always show current user as default */}
              <option value={user?.id}>{user?.name} (You)</option>
              {officers
                .filter(o => o.id !== user?.id)
                .map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))
              }
            </select>
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

          {/* Type + Template */}
          <div className="form-row">
            <div className="form-group">
              <label>Inspection Type <span>*</span></label>
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
            <div className="form-group">
              <label>Checklist Template <span>*</span></label>
              <select
                name="templateId"
                className="form-control-custom"
                value={form.templateId}
                onChange={handleChange}
              >
                <option value="">Select template...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label>Inspection Purpose</label>
            <input
              type="text"
              name="purpose"
              className="form-control-custom"
              placeholder="e.g. Quarterly safety inspection"
              value={form.purpose}
              onChange={handleChange}
            />
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
              onClick={() => setActivePage('inspections')}
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

        {/* Quick Links */}
        <div className="quick-links-card">
          <h6>Quick Links</h6>

          <button
            className="quick-link-btn"
            onClick={() => setActivePage('conduct')}
          >
            <span className="quick-link-icon">▶️</span>
            Start Inspection Now
          </button>

          <button
            className="quick-link-btn"
            onClick={() => setActivePage('inspections')}
          >
            <span className="quick-link-icon">📋</span>
            View Scheduled Inspections
          </button>

          <button
            className="quick-link-btn"
            onClick={() => setActivePage('dashboard')}
          >
            <span className="quick-link-icon">🏠</span>
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}

export default OfficerSchedule