// SettingsPage.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import '../css/SettingsPage.css'
import { FiBell } from 'react-icons/fi'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const notifPath = user?.role === 'facility_manager'
    ? '/manager/settings/notifications'
    : '/officer/settings/notifications'

  return (
    <div className="settings-page">
      <h4 className="settings-title">Settings</h4>

      {/* User info strip */}
      <div className="settings-user-card">
        <img
          src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=8B0000&color=fff`}
          alt="avatar"
          className="settings-avatar"
        />
        <div>
          <div className="settings-user-name">{user?.name}</div>
          <div className="settings-user-email">{user?.email}</div>
          <div className="settings-user-role">{user?.role?.replace('_', ' ')}</div>
        </div>
      </div>

      <div className="settings-list">
        <div className="settings-item" onClick={() => navigate(notifPath)}>
          <div className="settings-left">
            <span className="settings-icon">
              <FiBell size={18} style={{ color: '#660000' }} /> 
            </span>
            <div>
              <div className="settings-label">Notification Settings</div>
              <div className="settings-subtext">Choose when to receive email notifications</div>
            </div>
          </div>
          <div className="settings-arrow">›</div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage