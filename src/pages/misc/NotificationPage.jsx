// NotificationPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../css/SettingsPage.css'

const NOTIFICATION_ITEMS = [
  {
    key: 'inspectionUpdates',
    label: 'Inspection Updates',
    description: 'Email when your inspection is submitted to the manager.'
  },
  {
    key: 'statusChanges',
    label: 'Status Changes',
    description: 'Email when the manager acknowledges, assigns corrective actions, or marks the inspection as complete.'
  },
  {
    key: 'correctiveActions',
    label: 'Corrective Action Updates',
    description: 'Email when corrective actions are assigned, updated, or become overdue.'
  },
  {
    key: 'complianceAlerts',
    label: 'Compliance Alerts',
    description: 'Email when a facility falls below the 70% compliance threshold or high-risk findings are detected.'
  },
  {
    key: 'systemAnnouncements',
    label: 'System Announcements',
    description: 'Occasional emails for system updates and announcements.'
  }
]

const DEFAULT_PREFS = {
  inspectionUpdates:   true,
  statusChanges:       true,
  correctiveActions:   false,
  complianceAlerts:    false,
  systemAnnouncements: true
}

const NotificationPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Start with defaults so UI never crashes even if API fails
  const [prefs,   setPrefs]   = useState(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.get('/notifications/preferences')
      .then(res => setPrefs(res.data))
      .catch(err => {
        console.error(err)
        setError('Could not load saved preferences. Showing defaults.')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch('/notifications/preferences', prefs)
      setPrefs(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="settings-page">
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    </div>
  )

  return (
    <div className="settings-page">

      <div className="settings-back" onClick={() => navigate(-1)}>
        ‹ Back to Settings
      </div>

      <h4 className="settings-title">Notification Settings</h4>
      <p className="settings-page-sub">
        Configure how you received alerts and updates from the system.
      </p>

      {error && (
        <div style={{
          background: '#fef3c7', color: '#b45309',
          padding: '0.6rem 1rem', borderRadius: '8px',
          fontSize: '0.825rem'
        }}>
          {error}
        </div>
      )}

      <div className="notif-list-card">
        {NOTIFICATION_ITEMS.map((item, i) => (
          <div
            key={item.key}
            className={`notif-row ${i < NOTIFICATION_ITEMS.length - 1 ? 'notif-row--border' : ''}`}
          >
            <div className="notif-row-body">
              <div className="notif-row-label">{item.label}</div>
              <div className="notif-row-desc">{item.description}</div>
            </div>
            <button
              className={`notif-toggle ${prefs[item.key] ? 'notif-toggle--on' : ''}`}
              onClick={() => handleToggle(item.key)}
              aria-label={`Toggle ${item.label}`}
            >
              <span className="notif-toggle-knob" />
            </button>
          </div>
        ))}
      </div>

      <div className="settings-save-row">
        {saved && <span className="settings-saved-msg">Preferences saved!</span>}
        <button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

    </div>
  )
}

export default NotificationPage