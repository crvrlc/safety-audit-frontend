import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import '../css/ManagerShared.css'
import '../css/ManagerHome.css'
import {
  FiPlus,
  FiFileText,
  FiSearch,
  FiBarChart2,
  FiFolder,
  FiClipboard,
  FiAlertTriangle,
  FiTool,
  FiCheckCircle,
  FiTrendingUp,
  FiClock
} from 'react-icons/fi'


import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import '../css/ManagerHome.css'


const getResolutionBadgeClass = (status) => {
  switch (status) {
    case 'pending':  return 'badge-scheduled'
    case 'ongoing':  return 'badge-ongoing'
    case 'resolved': return 'badge-completed'
    default:         return 'badge-draft'
  }
}

const getMaintenanceBadgeClass = (status) => {
  switch (status) {
    case 'waiting_for_repairs': return 'badge-scheduled'
    case 'overdue_repairs':     return 'badge-overdue'
    case 'completed_repairs':   return 'badge-completed'
    default:                    return 'badge-draft'
  }
}

const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case 'critical': return 'badge-critical'
    case 'high':     return 'badge-high'
    case 'medium':   return 'badge-medium'
    case 'low':      return 'badge-low'
    default:         return 'badge-draft'
  }
}

const getAuditStatusLabel = (s) => {
  if (s === 'submitted')      return 'Awaiting Acknowledgment'
  if (s === 'acknowledged')   return 'Awaiting CA Assignment'
  if (s === 'resolving')      return 'Corrective Actions In Progress'
  if (s === 'pending_review') return 'Awaiting Officer Sign-Off'
  if (s === 'completed')      return 'Completed'
  return s
}

const ManagerHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [stats, setStats]     = useState(null)
  const [trendData, setTrendData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])


  useEffect(() => {
    if (!user?.token) return

    Promise.all([
      api.get('/manager/stats'),
      api.get('/manager/trend'),
      api.get('/manager/activity'),
    ])
      .then(([statsRes, trendRes, activityRes]) => {
        setStats(statsRes.data)
        setTrendData(trendRes.data)
        setRecentActivity(activityRes.data)
      })
      .catch(err => console.error('Manager home fetch error:', err))
      .finally(() => setLoading(false))
  }, [user])

  const formatDate = (d) =>
    d.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatTime = (d) =>
    d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

const quickActions = [
  { icon: FiPlus, label: 'Assign Maintenance Task', desc: 'Create corrective action', path: '/manager/findings?action=assign', color: '#6a1b9a' },
  { icon: FiFileText, label: 'Review Inspection Reports', desc: 'Acknowledge submitted reports', path: '/manager/findings?tab=reports', color: '#e65100' },
  { icon: FiSearch, label: 'View Audit Findings', desc: 'Open findings needing action', path: '/manager/findings', color: '#1565c0' },
  { icon: FiBarChart2, label: 'Condition Tracker', desc: 'Facility safety status', path: '/manager/compliance', color: '#2e7d32' },
]

const metricCards = [
  { icon: FiFolder, label: 'Open Audit Findings',    value: stats?.openFindings,        color: '#1565c0', },
  { icon: FiClipboard, label: 'Reports for Review',  value: stats?.pendingReports,      color: '#e65100', },
  { icon: FiAlertTriangle, label: 'Critical Issues', value: stats?.criticalIssues,      color: '#b71c1c',  },
  { icon: FiTool, label: 'Repairs In Progress',      value: stats?.repairsInProgress,   color: '#6a1b9a',  },
  { icon: FiCheckCircle, label: 'Resolved This Month', value: stats?.resolvedThisMonth, color: '#2e7d32',  },
]

const bottomMetrics = [
  { icon: FiAlertTriangle, label: 'Total Issues Reported',     value: stats?.totalIssues },
  { icon: FiCheckCircle, label: 'Repairs Completed (Month)',   value: stats?.repairsCompletedMonth },
  { icon: FiClock, label: 'Avg Resolution Days', value: stats?.avgResolutionDays != null ? `${stats.avgResolutionDays} days` : '—' },
  { icon: FiTrendingUp, label: 'Overdue Maintenance Tasks', value: stats?.overdueCount, highlight: 'red' },
]

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="manager-home">

      {/* Greeting */}
      <div className="home-greeting">
        <h4>Welcome, {user?.name}! 👋</h4>
        <p>{formatDate(currentTime)} — {formatTime(currentTime)}</p>
      </div>

      {/* Quick Actions */}
      <p className="section-label">Quick Actions</p>

     <div className="manager-quick-grid">
        {quickActions.map((qa, i) => {
          const Icon = qa.icon

          return (
            <div
              key={i}
              className="manager-quick-card"
              onClick={() => navigate(qa.path)}
              style={{ borderBottom: `4px solid ${qa.color}` }}
            >
              <div
                className="manager-quick-icon"
                style={{ color: qa.color }}
              >
                <Icon size={18} />
              </div>

              <div className="manager-quick-label">{qa.label}</div>
              <div className="manager-quick-desc">{qa.desc}</div>
            </div>
          )
        })}
      </div>
      
      {/* Status Cards */}
      <p className="section-label">Overview</p>
      <div className="manager-status-grid">
        {metricCards.map((card, i) => {
          const Icon = card.icon

          return (
            <div
              key={i}
              className="manager-status-card"
              onClick={card.onClick}
              style={{ borderBottom: `4px solid ${card.color}` }}
            >
              <div className="manager-status-icon" style={{ color: card.color }}>
                <Icon size={18} />
              </div>

              <div className="manager-status-value" style={{ color: card.color }}>
                {card.value ?? '—'}
              </div>

              <div className="manager-status-label">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Bottom Metrics Row */}
      <div className="manager-metrics-row">
        {bottomMetrics.map((m, i) => (
          <div key={i} className="manager-metric-box">
            <div
              className="manager-metric-value"
              style={{ color: m.highlight === 'red' ? '#b71c1c' : '#333' }}
            >
              {m.value ?? '—'}
            </div>
            <div className="manager-metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <p className="section-label">Activity</p>
      <div className="manager-bottom-grid">

        {/* Resolution Trend Chart */}
        <div className="chart-card">
          <h6>Corrective Action Resolution Trend</h6>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="resolved" name="Resolved" fill="#2e7d32" radius={[3,3,0,0]} />
              <Bar dataKey="opened"   name="Opened"   fill="#1565c0" radius={[3,3,0,0]} />
              <Bar dataKey="overdue"  name="Overdue"  fill="#b71c1c" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <h6>Recent Maintenance Activity</h6>
          {recentActivity.length === 0 ? (
              <p style={{ fontSize: '0.825rem', color: '#aaa', textAlign: 'center', padding: '16px 0' }}>
                No recent activity
              </p>
            ) : recentActivity.slice(0, 2).map((audit, i) => (
              <div
                key={i}
                className="activity-item"
                onClick={() => navigate(`/manager/inspections/${audit.id}/review`)}
              >
                <div className={`activity-dot ${
                  audit.status === 'completed'      ? 'green'  :
                  audit.status === 'pending_review' ? 'blue'   :
                  audit.status === 'resolving'      ? 'yellow' :
                  audit.status === 'submitted'      ? 'red'    : 'gray'
                }`} />
                <div style={{ flex: 1 }}>
                  <div className="activity-text">
                    {audit.office?.name || '—'} — {audit.office?.facility?.name || '—'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="activity-time mono">{audit.inspectionCode}</div>
                    <span className="badge-status" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {getAuditStatusLabel(audit.status)}
                    </span>
                  </div>
                  <div className="activity-time">
                    {audit.auditResponses?.length || 0} findings
                  </div>
                </div>
              </div>
            ))}
          <div className="view-all-row">
            <span className="view-all-link" onClick={() => navigate('/manager/maintenance')}>
              View All →
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ManagerHome