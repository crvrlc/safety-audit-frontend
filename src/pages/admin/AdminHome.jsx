// dashboard
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import '../css/AdminHome.css'
import { FiUsers, FiCheckSquare, FiFolder, FiBarChart2 } from 'react-icons/fi'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AdminHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const headers = { Authorization: `Bearer ${user?.token}` }
    Promise.all([
      axios.get(`${API}/api/admin/stats`, { headers }),
      axios.get(`${API}/api/admin/metrics`, { headers }),
      axios.get(`${API}/api/admin/activity`, { headers }),
    ])
      .then(([statsRes, metricsRes, activityRes]) => {
        setStats(statsRes.data)
        setMetrics(metricsRes.data)
        setActivity(activityRes.data)
      })
      .catch(err => console.error('Admin home fetch error:', err))
      .finally(() => setLoading(false))
  }, [user])

  const formatDate = (d) =>
    d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatTime = (d) =>
    d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatActivityDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const getGreeting = () => {
    const h = currentTime.getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const quickCards = [
  {
    icon: FiUsers,
    title: 'Manage Users',
    desc: 'Add, edit, deactivate users',
    path: '/admin/users',
    color: '#1565c0'
  },
  {
    icon: FiCheckSquare,
    title: 'Checklist Templates',
    desc: 'Edit audit sections & items',
    path: '/admin/checklists',
    color: '#2e7d32'
  },
  {
    icon: FiFolder,
    title: 'View Audits',
    desc: 'Browse all audit records',
    path: '/admin/records',
    color: '#6a1b9a'
  },
  {
    icon: FiBarChart2,
    title: 'Generate Reports',
    desc: 'Analytics & insights',
    path: '/admin/analytics',
    color: '#e65100'
  }
]

  const getIcon = (action) => {
    if (action.includes('Created')) return '🟢'
    if (action.includes('Deleted')) return '🔴'
    if (action.includes('Updated')) return '🟡'
    return '⚪'
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" style={{ borderTopColor: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="admin-home">

      {/* Greeting */}
      <div className="admin-greeting">
        <h2>{getGreeting()}, {user?.name}! 👋</h2>
        <p>{formatDate(currentTime)} — {formatTime(currentTime)}</p>
      </div>

      {/* Quick action cards */}
      <p className="section-label">Quick Actions</p>
      <div className="quick-cards-grid">
        {/* {quickCards.map((c, i) => (
          <div key={i} className="quick-card" onClick={() => navigate(c.path)}>
            <div className="quick-card-icon">{c.icon}</div>
            <div className="quick-card-title">{c.title}</div>
            <div className="quick-card-desc">{c.desc}</div>
          </div>
        ))} */}
        {quickCards.map((card, i) => {
          const Icon = card.icon

          return (
            <div
              key={i}
              className="quick-card"
              onClick={() => navigate(card.path)}
              style={{ borderBottom: `3px solid ${card.color}` }}
            >
              <div className="quick-card-icon" style={{ color: card.color }}>
                <Icon size={24} />
              </div>
              <div className="quick-card-title">{card.title}</div>
              <div className="quick-card-desc">{card.desc}</div>
            </div>
          )
        })}
      </div>

      {/* System overview stats */}
      <p className="section-label">System Overview</p>
      <div className="overview-stats-grid">
        <div className="overview-stat-card">
          <div className="stat-value">{stats?.totalUsers ?? '—'}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="overview-stat-card">
          <div className="stat-value">{stats?.totalAudits ?? '—'}</div>
          <div className="stat-label">Total Audits</div>
        </div>
        <div className="overview-stat-card">
          <div className="stat-value">{stats?.issuesIdentified ?? '—'}</div>
          <div className="stat-label">Issues Identified</div>
        </div>
        <div className="overview-stat-card">
          <div className="stat-value" style={{ color: '#2e7d32' }}>
            {stats?.completionRate != null ? `${Math.round(stats.completionRate)}%` : '—'}
          </div>
          <div className="stat-label">Audit Completion Rate</div>
        </div>
      </div>

      {/* Metrics + Activity */}
      <div className="bottom-two-col">

        {/* Important metrics */}
        <div className="info-card">
          <h3>Important Metrics</h3>
          {[
            ['Active users',        metrics?.activeUsers],
            ['Inactive users',      metrics?.inactiveUsers],
            ['Most audited area',   metrics?.mostAuditedArea],
            ['Most active role',    metrics?.mostActiveRole],
            ['Most common issue',   metrics?.mostCommonIssue],
            ['Most compliant area', metrics?.mostCompliantArea],
            ['Least compliant area',metrics?.leastCompliantArea],
            ['Most overdue area',   metrics?.mostOverdueArea],
          ].map(([key, val], i) => (
            <div key={i} className="metric-row">
              <span className="metric-key">{key}</span>
              <span className="metric-val">{val ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="info-card">
          <h3>Recent Activity</h3>
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {activity.length === 0 ? (
                  <tr><td colSpan={3} className="empty-row">No recent activity</td></tr>
                ) : activity.slice(0, 4).map((row, i) => (
                  <tr key={i}>
                    <td>{row.userName}</td>
                    <td>{row.action}</td>
                    <td>{formatActivityDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="view-all-row">
            <span
              className="view-all-link"
              onClick={() => navigate('/admin/activity')}
            >
              View All →
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminHome