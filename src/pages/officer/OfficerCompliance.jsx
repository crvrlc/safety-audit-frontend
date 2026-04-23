import { useState, useEffect } from 'react'
import api from '../../services/api'
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import {
  FiBarChart2,
  FiTool,
  FiClock,
  FiAlertTriangle
} from 'react-icons/fi'
import '../css/OfficerCompliance.css'

// ─── Constants ────────────────────────────────────────

const COLORS = {
  high:    '#166534',
  moderate:'#b45309',
  low:     '#b91c1c',
  primary: '#8B0000',
  muted:   '#6b7280'
}

// ─── Helpers ──────────────────────────────────────────

const getRateColor = (rate) => {
  if (rate >= 85) return COLORS.high
  if (rate >= 70) return COLORS.moderate
  return COLORS.low
}

const getRateLabel = (rate) => {
  if (rate >= 85) return 'High'
  if (rate >= 70) return 'Moderate'
  return 'Low'
}

const getRateBg = (rate) => {
  if (rate >= 85) return { background: '#dcfce7', color: '#166534' }
  if (rate >= 70) return { background: '#fef3c7', color: '#b45309' }
  return { background: '#fde8e8', color: '#b91c1c' }
}

const getFacilityStatusStyle = (status) => {
  if (status === 'Compliant')        return { background: '#dcfce7', color: '#166534' }
  if (status === 'Needs Monitoring') return { background: '#fef3c7', color: '#b45309' }
  return { background: '#fde8e8', color: '#b91c1c' }
}

// Truncate long section names for Y-axis
const truncate = (str, max = 22) =>
  str.length > max ? str.slice(0, max) + '…' : str

// ─── Sub-components ───────────────────────────────────

const ComplianceGauge = ({ rate }) => {
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (rate / 100) * circumference
  const color = getRateColor(rate)
  return (
    <div className="gauge-wrapper">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#f0f0f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
          {rate}%
        </text>
        <text x="60" y="72" textAnchor="middle" fontSize="10" fill="#999">
          compliance
        </text>
      </svg>
    </div>
  )
}

// Custom Y-axis tick that truncates and tooltips long names
const SectionYAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <title>{payload.value}</title>
    <text
      x={0} y={0}
      dy={4}
      textAnchor="end"
      fontSize={11}
      fill="#374151"
    >
      {truncate(payload.value)}
    </text>
  </g>
)

// Custom tooltip for the bar chart
const SectionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: '#111' }}>{label}</div>
      <div style={{ color: getRateColor(payload[0].value) }}>
        {payload[0].value}% compliance
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────

const OfficerCompliance = () => {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.get('/compliance/officer-summary')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="compliance-loading">
      <div className="spinner-border" style={{ color: '#8B0000' }} />
    </div>
  )

  if (error) return (
    <div className="compliance-error">
      Failed to load compliance data. Please try again.
    </div>
  )

  const {
    overallRate, totalAudits, pendingActions,
    overdueActions, facilitiesBelowThreshold,
    trend, sectionCompliance, facilityCompliance,
    distribution, topIssues
  } = data

  const totalFacilities = distribution.reduce((s, d) => s + d.value, 0)

  const metricCards = [
    {
      label: 'Overall Compliance Rate',
      value: `${overallRate}%`,
      icon: FiBarChart2,
      color: getRateColor(overallRate),
      bg: getRateBg(overallRate).background,
      sub: `${totalAudits} audit${totalAudits !== 1 ? 's' : ''} analyzed`
    },
    {
      label: 'Pending Corrective Actions',
      value: pendingActions,
      icon: FiTool,
      color: '#b45309',
      bg: '#fef3c7',
      sub: 'Awaiting resolution'
    },
    {
      label: 'Overdue Actions',
      value: overdueActions,
      icon: FiClock,
      color: '#b91c1c',
      bg: '#fde8e8',
      sub: 'Past due date'
    },
    {
      label: 'Facilities Below 70%',
      value: facilitiesBelowThreshold,
      icon: FiAlertTriangle,
      color: '#b91c1c',
      bg: '#fde8e8',
      sub: 'Below threshold'
    }
  ]

  // Dynamic height for section bar chart based on number of sections
  const sectionChartHeight = Math.max(220, sectionCompliance.length * 36)

  return (
    <div className="compliance-page">

      {/* ── Header ── */}
      <div className="compliance-header">
        <div>
          <h4>Compliance Tracker</h4>
          <p className="page-subtext">Safety inspection compliance overview across all facilities.</p>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="compliance-metric-grid">
        {metricCards.map((c, i) => (
          <div key={i} className="compliance-metric-card" style={{ borderBottom: `3px solid ${c.color}` }}>
            <div className="cmc-icon" style={{ background: c.bg, color: c.color }}><c.icon size={20} /></div>
            <div className="cmc-value" style={{ color: c.color }}>{c.value}</div>
            <div className="cmc-label">{c.label}</div>
            <div className="cmc-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Trend + Gauge ── */}
      <div className="compliance-row-2">

        {/* Compliance Trend */}
        <div className="compliance-card compliance-card--wide">
          <div className="card-header">
            <h6>Compliance Trend</h6>
            <span className="card-sub">Last 6 months</span>
          </div>
          {trend.every(t => t.rate === 0 && t.audits === 0) ? (
            <div className="compliance-empty">No trend data available yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v, name) => [`${v}%`, 'Compliance Rate']}
                  labelFormatter={(label) => {
                    const entry = trend.find(t => t.month === label)
                    return `${label}${entry ? ` · ${entry.audits} audit${entry.audits !== 1 ? 's' : ''}` : ''}`
                  }}
                />
                <Line
                  type="monotone" dataKey="rate"
                  stroke={COLORS.primary} strokeWidth={2.5}
                  dot={{ fill: COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Overall Rate Gauge */}
        <div className="compliance-card compliance-card--center">
          <div className="card-header">
            <h6>Overall Rate</h6>
          </div>
          {totalAudits === 0 ? (
            <div className="compliance-empty">No audits completed yet</div>
          ) : (
            <>
              <ComplianceGauge rate={overallRate} />
              <div className="gauge-label" style={getRateBg(overallRate)}>
                {getRateLabel(overallRate)} Compliance
              </div>
              <div className="gauge-stats">
                <div><span>{totalAudits}</span><p>Audits</p></div>
                <div><span>{pendingActions}</span><p>Pending</p></div>
                <div><span>{overdueActions}</span><p>Overdue</p></div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Row 2: Section Compliance + Distribution ── */}
      <div className="compliance-row-2">

        {/* By Safety Domain */}
        <div className="compliance-card compliance-card--wide">
          <div className="card-header">
            <h6>Compliance by Safety Domain</h6>
            <span className="card-sub">By checklist section · worst first</span>
          </div>
          {sectionCompliance.length === 0 ? (
            <div className="compliance-empty">No section data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={sectionChartHeight}>
              <BarChart
                data={sectionCompliance}
                layout="vertical"
                barSize={14}
                margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={140}
                  axisLine={false}
                  tickLine={false}
                  tick={<SectionYAxisTick />}
                />
                <Tooltip content={<SectionTooltip />} />
                <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                  {sectionCompliance.map((entry, i) => (
                    <Cell key={i} fill={getRateColor(entry.rate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Distribution */}
        <div className="compliance-card">
          <div className="card-header">
            <h6>Compliance Distribution</h6>
            <span className="card-sub">
              By facility · {totalFacilities} total
            </span>
          </div>
          {totalFacilities === 0 ? (
            <div className="compliance-empty">No facility data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {distribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [
                      `${v} facilit${v !== 1 ? 'ies' : 'y'} (${totalFacilities > 0 ? Math.round((v / totalFacilities) * 100) : 0}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {distribution.map((d, i) => (
                  <div key={i} className="pie-legend-item">
                    <span className="pie-dot" style={{ background: d.color }} />
                    <span className="pie-legend-label">{d.label}</span>
                    <span className="pie-legend-value">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ── Row 3: Top Issues + Facility Ranking ── */}
      <div className="compliance-row-2">

        {/* Top Issues */}
        <div className="compliance-card">
          <div className="card-header">
            <h6>Top Issues</h6>
            <span className="card-sub">Most recurring findings</span>
          </div>
          {topIssues.length === 0 ? (
            <div className="compliance-empty">No findings recorded</div>
          ) : (
            <div className="top-issues-list">
              {topIssues.map((item, i) => (
                <div key={i} className="top-issue-item">
                  <div className="top-issue-rank">#{i + 1}</div>
                  <div className="top-issue-body">
                    <div className="top-issue-text" title={item.issue}>{item.issue}</div>
                    <div className="top-issue-section">{item.section}</div>
                  </div>
                  <div className="top-issue-count">{item.count}x</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facility Ranking */}
        <div className="compliance-card">
          <div className="card-header">
            <h6>Facility Compliance Ranking</h6>
            <span className="card-sub">Best to worst</span>
          </div>
          {facilityCompliance.length === 0 ? (
            <div className="compliance-empty">No facility data yet</div>
          ) : (
            <div className="facility-ranking-list">
              {facilityCompliance.map((f, i) => (
                <div key={i} className="facility-rank-item">
                  <div
                    className="facility-rank-number"
                    style={{ color: i === 0 ? '#b45309' : '#aaa' }}
                  >
                    #{i + 1}
                  </div>
                  <div className="facility-rank-body">
                    <div className="facility-rank-name-row">
                      <span className="facility-rank-name">{f.name}</span>
                      {/* Status badge from backend */}
                      <span
                        className="facility-rank-status"
                        style={getFacilityStatusStyle(f.status)}
                      >
                        {f.status}
                      </span>
                    </div>
                    <div className="facility-rank-meta">
                      {f.auditsCount} audit{f.auditsCount !== 1 ? 's' : ''}
                    </div>
                    <div className="facility-rank-bar-wrapper">
                      <div
                        className="facility-rank-bar"
                        style={{
                          width: `${f.rate}%`,
                          background: getRateColor(f.rate)
                        }}
                      />
                    </div>
                  </div>
                  <div
                    className="facility-rank-rate"
                    style={{ color: getRateColor(f.rate) }}
                  >
                    {f.rate}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default OfficerCompliance