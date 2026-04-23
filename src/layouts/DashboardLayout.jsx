import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ceatLogo from '../assets/ceat-logo.png'
import { useState, useRef, useEffect } from 'react'
import {
  FiHome,
  FiClipboard,
  FiFolder,
  FiBarChart2,
  FiBook,
  FiSettings,
  FiUsers,
  FiCheckSquare,
  FiMonitor,
  FiLogOut
} from 'react-icons/fi'
import './DashboardLayout.css'

const navItems = {
  safety_officer: [
    { path: '/officer/dashboard',   icon: FiHome,        label: 'Dashboard' },
    { path: '/officer/inspections', icon: FiClipboard,   label: 'Inspections' },
    { path: '/officer/records',     icon: FiFolder,      label: 'Records' },
    { path: '/officer/compliance',  icon: FiBarChart2,   label: 'Condition Tracker' },
    { path: '/officer/resources',   icon: FiBook,        label: 'Resources' },
    { path: '/officer/settings',    icon: FiSettings,    label: 'Settings' }
  ],

  facility_manager: [
    { path: '/manager/dashboard', icon: FiHome,      label: 'Dashboard' },
    { path: '/manager/findings',  icon: FiClipboard, label: 'Findings' },
    { path: '/manager/records',   icon: FiFolder,    label: 'Records' },
    { path: '/manager/compliance',icon: FiBarChart2, label: 'Compliance Tracker' },
    { path: '/manager/settings',  icon: FiSettings,  label: 'Settings' }
  ],

  admin: [
    { path: '/admin/dashboard',  icon: FiHome,        label: 'Dashboard' },
    { path: '/admin/users',      icon: FiUsers,       label: 'Manage Users' },
    { path: '/admin/facilities', icon: FiMonitor,     label: 'Manage Facilities' },
    { path: '/admin/checklists', icon: FiCheckSquare, label: 'Checklist Templates' },
    { path: '/admin/records',    icon: FiFolder,      label: 'Audit Records' },
    { path: '/admin/analytics',  icon: FiBarChart2,   label: 'Analytics' },
    // { path: '/admin/monitoring', icon: FiMonitor,     label: 'System Monitoring' },
  ]
}

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const items = navItems[user?.role] || navItems.safety_officer

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }, [])

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const formatRole = (role) => {
    if (!role) return ''
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const isActive = (path) => location.pathname.startsWith(path)

  const getSettingsPath = () => {
    if (user?.role === 'safety_officer') return '/officer/settings'
    if (user?.role === 'facility_manager') return '/manager/settings'
    return '/admin/settings'
  }

  return (
    <div className="dashboard-wrapper">

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="header-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <img src={ceatLogo} alt="CEAT Logo" className="header-logo" />
          <h1 className="header-title">Safety Audit Assessment System</h1>
        </div>

        <div className="header-right" ref={dropdownRef}>
          {/* <button className="header-bell">
            🔔
            <span className="header-bell-badge">3</span>
          </button> */}

          <button
            className="header-user"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="header-avatar" />
            ) : (
              <div className="header-avatar-placeholder">
                {getInitials(user?.name)}
              </div>
            )}
            <span className="header-username">{user?.name}</span>
            <span className="header-dropdown-arrow">▼</span>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="user-dropdown-header">
                <div className="user-dropdown-name">{user?.name}</div>
                <div className="user-dropdown-role">{formatRole(user?.role)}</div>
              </div>
              <button
                className="user-dropdown-item"
                onClick={() => { navigate(getSettingsPath()); setDropdownOpen(false) }}
              >
                <FiSettings size={16} />
                Settings
              </button>
              <button
                className="user-dropdown-item danger"
                onClick={logout}
              >
                <FiLogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="dashboard-body">

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <nav className="sidebar-nav">
            {items.map(item => {
              const Icon = item.icon

              return (
                <button
                  key={item.path}
                  className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path)
                    if (window.innerWidth <= 768) setSidebarOpen(false)
                  }}
                >
                  <span className="sidebar-nav-icon">
                    <Icon size={18} />
                  </span>
                  {item.label}
                </button>
              )
            })}
          </nav>

          <hr className="sidebar-divider" />

          <div className="sidebar-logout">
            <button className="btn-logout" onClick={logout}>
              <FiLogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout