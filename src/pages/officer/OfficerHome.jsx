import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { getMyAudits } from '../../services/auditService'
import { getAllFindings } from '../../services/findingService'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FiClipboard,
  FiClock,
  FiTool,
  FiAlertTriangle
} from 'react-icons/fi'
import '../css/OfficerHome.css'

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'ongoing':   return 'badge-ongoing'
    case 'scheduled': return 'badge-scheduled'
    case 'submitted': return 'badge-submitted'
    case 'completed': return 'badge-completed'
    case 'draft':     return 'badge-draft'
    default:          return 'badge-draft'
  }
}

// Build last 6 months of inspection counts from real audit data
const buildMonthlyChartData = (audits) => {
  const now = new Date()
  const months = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: date.toLocaleDateString('en-PH', { month: 'short' }),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      count: 0
    })
  }

  audits.forEach(a => {
    const d = new Date(a.createdAt)
    const match = months.find(
      m => m.monthIndex === d.getMonth() && m.year === d.getFullYear()
    )
    if (match) match.count++
  })

  return months.map(({ month, count }) => ({ month, count }))
}

// Calculate avg duration from createdAt → submittedAt (in minutes)
const calcAvgDuration = (audits) => {
  const completed = audits.filter(a => a.submittedAt && a.createdAt)
  if (completed.length === 0) return null

  const totalMins = completed.reduce((sum, a) => {
    const diff = new Date(a.submittedAt) - new Date(a.createdAt)
    return sum + diff / 60000
  }, 0)

  const avg = Math.round(totalMins / completed.length)

  if (avg < 60) return `${avg} min`
  const hrs = Math.floor(avg / 60)
  const mins = avg % 60
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

const OfficerHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [audits, setAudits] = useState([])
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Promise.all([getMyAudits(), getAllFindings()])
      .then(([auditsRes, findingsRes]) => {
        setAudits(auditsRes.data)

       
        const myAuditIds = new Set(auditsRes.data.map(a => a.id))
        const myFindings = findingsRes.data.filter(f => myAuditIds.has(f.audit?.id))

        console.log("myAuditIds:", [...myAuditIds])
        console.log("myFindings:", myFindings)
        console.log("allFindings:", findingsRes.data.length)

        setFindings(myFindings)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const recentAudits = [...audits]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3)

  // =========================
  // 🔹 OVERVIEW
  // =========================

  const ongoingAudits = audits.filter(a => a.status === 'ongoing')

  const upcomingAudits = audits
    .filter(a => a.status === 'scheduled' && a.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))

  const nextInspection = upcomingAudits[0]
  const moreUpcomingCount = upcomingAudits.length - 1

  // =========================
  // 🔹 METRICS
  // =========================

  const thisMonthAudits = audits.filter(a => {
    const d = new Date(a.createdAt)
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear()
  })

  // Uses createdAt → submittedAt (no startedAt field in model)
  const avgDurationLabel = calcAvgDuration(audits)

  const pendingCorrectiveActions = findings.filter(
    f => f.resolutionStatus === 'pending' || f.resolutionStatus === 'ongoing'
  ).length

  const highRiskFacilities = (() => {
    const facilityNames = new Set()
    findings
      .filter(f =>
        ['high', 'critical'].includes(f.severity) &&
        f.resolutionStatus !== 'resolved'
      )
      .forEach(f => {
        const name = f.audit?.office?.facility?.name
        if (name) facilityNames.add(name)
      })
    return facilityNames.size
  })()

  // =========================
  // 🔹 CHART DATA (real)
  // =========================

  const chartData = buildMonthlyChartData(audits)

  // =========================
  // 🔹 HELPERS
  // =========================

  const formatDate = (date) => date.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const formatTime = (date) => date.toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })

  const formatScheduled = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  // =========================
  // 🔹 METRIC CARDS
  // =========================

  const metricCards = [
  {
    label: 'Inspections This Month',
    value: thisMonthAudits.length,
    icon: FiClipboard,
    color: '#8B0000'
  },
  {
    label: 'Avg Inspection Duration',
    value: avgDurationLabel ?? 'N/A',
    icon: FiClock,
    color: '#2196f3',
    hint: 'From creation to submission'
  },
  {
    label: 'Pending Actions',
    value: pendingCorrectiveActions,
    icon: FiTool,
    color: '#ff9800'
  },
  {
    label: 'High Risk Facilities',
    value: highRiskFacilities,
    icon: FiAlertTriangle,
    color: '#f44336'
  }
]

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="officer-home">

      {/* Greeting */}
      <div className="home-greeting">
        <h4>Welcome, {user?.name}! 👋</h4>
        <p>{formatDate(currentTime)} — {formatTime(currentTime)}</p>
      </div>

      {/* =========================
          🔴 TOP OVERVIEW CARDS
      ========================= */}
      <div>
        <p className="section-label">Overview</p>

        <div className="top-overview-grid">

          {/* Schedule New */}
          <div
            className="overview-card primary"
            onClick={() => navigate('/officer/schedule')}
          >
            <h6>Schedule New Inspection</h6>
            <p>Create and schedule a new inspection</p>
          </div>

          {/* Continue */}
          <div
            className={`overview-card ${ongoingAudits.length === 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (ongoingAudits.length === 1) {
                navigate(`/officer/inspections/${ongoingAudits[0].id}/start`)
              } else if (ongoingAudits.length > 1) {
                navigate('/officer/inspections?tab=ongoing')
              }
            }}
          >
            <h6>Continue Inspection</h6>
            <p>
              {ongoingAudits.length === 0 && 'No ongoing inspections'}
              {ongoingAudits.length === 1 && ongoingAudits[0].inspectionCode}
              {ongoingAudits.length > 1 && `${ongoingAudits.length} ongoing inspections`}
            </p>
          </div>

          {/* Upcoming */}
          <div
            className={`overview-card ${upcomingAudits.length === 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (upcomingAudits.length > 0) {
                navigate('/officer/inspections?tab=scheduled')
              }
            }}
          >
            <h6>Upcoming Inspection</h6>
            <p>
              {upcomingAudits.length === 0 && 'No upcoming inspections'}

              {upcomingAudits.length === 1 &&
                `${nextInspection.office?.name} — ${formatScheduled(nextInspection.scheduledAt)}`
              }

              {upcomingAudits.length > 1 && (
                <>
                  {nextInspection.office?.name} — {formatScheduled(nextInspection.scheduledAt)}
                  <br />
                  <span className="subtext">+{moreUpcomingCount} more scheduled</span>
                </>
              )}
            </p>
          </div>

        </div>
      </div>

      {/* =========================
          🟡 METRICS
      ========================= */}
      <div>
        <p className="section-label">Metrics</p>

        <div className="metric-cards-grid">
         {metricCards.map((card, i) => {
          const Icon = card.icon

          return (
            <div
              key={i}
              className="metric-card-item"
              title={card.hint ?? ''}
              style={{ borderBottom: `4px solid ${card.color}` }} // 👈 add this
            >
              <div className="metric-card-icon" style={{ color: card.color }}>
                <Icon size={24} /> 
              </div>

              <div className="metric-card-value" style={{ color: card.color }}>
                {card.value}
              </div>

              <div className="metric-card-label">{card.label}</div>

              {card.hint && (
                <div className="metric-card-hint">{card.hint}</div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* =========================
          🔵 BOTTOM
      ========================= */}
      <div>
        <p className="section-label">Activity</p>

        <div className="bottom-grid">

          {/* Inspections Per Month Chart */}
          <div className="chart-card">
            <h6>Inspections per Month</h6>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val) => [val, 'Inspections']}
                  cursor={{ fill: 'rgba(139,0,0,0.05)' }}
                />
                <Bar dataKey="count" fill="#8B0000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Inspections */}
          <div className="activity-card">
            <h6>Recent Inspections</h6>

            {recentAudits.length === 0 ? (
              <p style={{
                fontSize: '0.825rem',
                color: '#aaa',
                textAlign: 'center',
                padding: '16px 0'
              }}>
                No inspections yet
              </p>
            ) : recentAudits.map(audit => (
              <div
                key={audit.id}
                className="activity-item"
                onClick={() => navigate(`/officer/inspections/${audit.id}/start`)}
              >
                <div className={`activity-dot ${
                  audit.status === 'submitted' || audit.status === 'completed' ? 'green' :
                  audit.status === 'ongoing'   ? 'yellow' :
                  audit.status === 'scheduled' ? 'blue'   : 'gray'
                }`} />

                <div style={{ flex: 1 }}>
                  <div className="activity-text">
                    {audit.office?.name || '—'} — {audit.office?.facility?.name || '—'}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div className="activity-time">
                      {audit.inspectionCode}
                    </div>

                    <span
                      className={`badge-status ${getStatusBadgeClass(audit.status)}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      {audit.status}
                    </span>
                  </div>

                  <div className="activity-time">
                    {new Date(audit.createdAt).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

export default OfficerHome