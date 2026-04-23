import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../css/ManagerSettings.css'


const TABS = [
  { key: 'profile',       label: '👤 Profile Information' },
  { key: 'notifications', label: '🔔 Notification Settings' },
]

const ManagerSettings = () => {
  const { user, setUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading,   setLoading]   = useState(false)
  const [saved,     setSaved]     = useState(false)

  // Profile state
  const [name,     setName]     = useState(user?.name     || '')
  const [email,    setEmail]    = useState(user?.email    || '')
  const [mobile,   setMobile]   = useState(user?.mobile   || '')
  const [department, setDept]   = useState(user?.department || '')

  // Notification state
  const [notifs, setNotifs] = useState({
    webNewReport:     true,
    webCritical:      true,
    webOverdue:       true,
    webTaskUpdate:    false,
    emailWeeklySummary: true,
    emailOverdue:     true,
    emailResolved:    false,
    emailMonthly:     true,
  })

  const toggleNotif = (key) =>
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))

  const handleSaveProfile = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await api.patch('/manager/profile', { name, mobile, department })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifs = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await api.patch('/manager/notifications', { notifs })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="manager-settings">
      <div className="page-header">
        <div>
          <h4 className="page-title">Settings</h4>
          <p className="page-subtitle">Manage your profile and notification preferences</p>
        </div>
      </div>

      {/* Settings overview cards */}
      <div className="settings-cards-grid">
        <div
          className={`settings-overview-card ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="soc-icon">👤</div>
          <div className="soc-title">Profile Information</div>
          <div className="soc-desc">Update your name, email, department, and contact details</div>
        </div>
        <div
          className={`settings-overview-card ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <div className="soc-icon">🔔</div>
          <div className="soc-title">Notification Settings</div>
          <div className="soc-desc">Configure web and email alerts for inspections and findings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="findings-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`findings-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="settings-saved-banner">
          ✅ Changes saved successfully.
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="settings-section">
          <div className="settings-section-header">
            <h6>Profile Information</h6>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="modal-label">Full Name</label>
              <input
                className="modal-input"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="settings-field">
              <label className="modal-label">Email Address</label>
              <input
                className="modal-input"
                value={email}
                readOnly
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <span className="settings-hint">Email is managed via Google SSO and cannot be changed here.</span>
            </div>
            <div className="settings-field">
              <label className="modal-label">Role</label>
              <input
                className="modal-input"
                value="Facility Manager"
                readOnly
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
            <div className="settings-field">
              <label className="modal-label">Department / Unit</label>
              <input
                className="modal-input"
                value={department}
                onChange={e => setDept(e.target.value)}
                placeholder="e.g. Unit 1 — Building 1"
              />
            </div>
            <div className="settings-field">
              <label className="modal-label">Mobile Number</label>
              <input
                className="modal-input"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="settings-section">
          <div className="settings-section-header">
            <h6>Notification Settings</h6>
            <button className="btn-primary" onClick={handleSaveNotifs} disabled={loading}>
              {loading ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>

          <p className="settings-notif-group-label">Web Notifications</p>
          {[
            { key: 'webNewReport',  label: 'New inspection report submitted' },
            { key: 'webCritical',   label: 'Critical finding detected' },
            { key: 'webOverdue',    label: 'Corrective action overdue' },
            { key: 'webTaskUpdate', label: 'Task status updated' },
          ].map(n => (
            <div key={n.key} className="notif-row">
              <span className="notif-label">{n.label}</span>
              <button
                className={`toggle-btn ${notifs[n.key] ? 'on' : ''}`}
                onClick={() => toggleNotif(n.key)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}

          <p className="settings-notif-group-label" style={{ marginTop: 24 }}>Email Notifications</p>
          {[
            { key: 'emailWeeklySummary', label: 'Weekly summary report' },
            { key: 'emailOverdue',       label: 'Overdue task alerts' },
            { key: 'emailResolved',      label: 'Resolved findings digest' },
            { key: 'emailMonthly',       label: 'Monthly compliance report' },
          ].map(n => (
            <div key={n.key} className="notif-row">
              <span className="notif-label">{n.label}</span>
              <button
                className={`toggle-btn ${notifs[n.key] ? 'on' : ''}`}
                onClick={() => toggleNotif(n.key)}
              >
                <span className="toggle-knob" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManagerSettings