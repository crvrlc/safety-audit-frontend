import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  FiClipboard, FiCheckCircle, FiAlertTriangle,
  FiXCircle, FiUsers, FiMapPin, FiTool,
  FiTrendingUp, FiAlertOctagon, FiShield
} from 'react-icons/fi'
import '../css/AdminAnalytics.css'

const AdminAnalytics = () => {
  const { user }  = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [tab,     setTab]     = useState('audit')

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user])

  const getRateColor = (rate) => {
    if (rate >= 85) return '#166534'
    if (rate >= 70) return '#b45309'
    return '#b91c1c'
  }

  const getFacilityStatusStyle = (status) => {
    if (status === 'Compliant')        return { background: '#dcfce7', color: '#166534' }
    if (status === 'Needs Monitoring') return { background: '#fef9c3', color: '#b45309' }
    return                                    { background: '#fee2e2', color: '#b91c1c' }
  }

  if (loading) return (
    <div className="aa-loading">
      <div className="aa-spinner" />
    </div>
  )

  if (error) return (
    <div className="aa-loading">
      <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>Failed to load analytics: {error}</p>
    </div>
  )

  const {
    // Tab 1
    totalAudits, overallComplianceRate, auditCoverage, activeOfficers,
    complianceTrend, complianceDistribution, sectionCompliance, auditsByStatus,
    // Tab 2
    facilitiesGood, facilitiesMinor, facilitiesCritical,
    facilityCompliance, facilitySafetyOverview, correctionTrend, maintenanceStatus,
    // Tab 3
    totalFindings, pendingFindings, overdueFindings, resolvedFindings,
    avgResolutionDays, closureRate, onTimeRate,
    topIssues, facilitiesWithMostIssues, officerPerformance,
  } = data

  const TABS = [
    { key: 'audit',    label: 'Audit Summary' },
    { key: 'facility', label: 'Facility Overview' },
    { key: 'findings', label: 'Findings & Corrective Actions' },
  ]

  // ── Status label formatter ──
  const formatStatus = (s) => s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="aa-page">

      {/* Header */}
      <div className="aa-header">
        <div>
          <h4 className="page-title">Analytics</h4>
          <p className="aa-subtitle">System-wide compliance and audit insights</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="aa-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`aa-tab ${tab === t.key ? 'aa-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          TAB 1 — AUDIT SUMMARY
          ════════════════════════════════════ */}
      {tab === 'audit' && (
        <div className="aa-content">

          {/* Summary cards */}
          <div className="aa-cards-grid">
            <div className="aa-card" style={{ borderBottom: '3px solid #8B0000' }}>
              <div className="aa-card-icon" style={{ color: '#8B0000', background: '#fdf2f2' }}>
                <FiClipboard size={18} />
              </div>
              <div className="aa-card-value">{totalAudits}</div>
              <div className="aa-card-label">Total Audits</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #1565c0' }}>
              <div className="aa-card-icon" style={{ color: '#1565c0', background: '#e8f0fe' }}>
                <FiTrendingUp size={18} />
              </div>
              <div className="aa-card-value" style={{ color: getRateColor(overallComplianceRate) }}>
                {overallComplianceRate}%
              </div>
              <div className="aa-card-label">Overall Compliance Rate</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #2e7d32' }}>
              <div className="aa-card-icon" style={{ color: '#2e7d32', background: '#e8f5e9' }}>
                <FiMapPin size={18} />
              </div>
              <div className="aa-card-value">
                {auditCoverage.audited}
                <span className="aa-card-value-sub"> / {auditCoverage.total}</span>
              </div>
              <div className="aa-card-label">Facilities Audited ({auditCoverage.percentage}%)</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #6a1b9a' }}>
              <div className="aa-card-icon" style={{ color: '#6a1b9a', background: '#f3e8fd' }}>
                <FiUsers size={18} />
              </div>
              <div className="aa-card-value">{activeOfficers}</div>
              <div className="aa-card-label">Active Officers</div>
            </div>
          </div>

          {/* Compliance trend + Distribution */}
          <div className="aa-row-2">
            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Average Compliance Rate per Month</h6>
                <span className="aa-chart-sub">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={complianceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Line
                    type="monotone" dataKey="rate" name="Compliance Rate"
                    stroke="#8B0000" strokeWidth={2} dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Compliance Distribution</h6>
                <span className="aa-chart-sub">Facilities by tier</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={complianceDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {complianceDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Section compliance + Audits by status */}
          <div className="aa-row-2">
            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Compliance by Safety Domain</h6>
                <span className="aa-chart-sub">Per checklist section</span>
              </div>
              {sectionCompliance.length === 0 ? (
                <p className="aa-empty">No section data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sectionCompliance} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <YAxis
                      type="category" dataKey="name"
                      tick={{ fontSize: 11 }} width={150}
                      tickFormatter={(value) =>
                        value.length > 25 ? value.slice(0, 25) + '…' : value
                      }
                    />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="rate" name="Compliance Rate" radius={[0, 4, 4, 0]}>
                      {sectionCompliance.map((entry, i) => (
                        <Cell key={i} fill={getRateColor(entry.rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Audits by Status</h6>
                <span className="aa-chart-sub">All time</span>
              </div>
              {auditsByStatus.length === 0 ? (
                <p className="aa-empty">No audit data yet.</p>
              ) : (
                <div className="aa-status-list">
                  {auditsByStatus
                    .sort((a, b) => b.count - a.count)
                    .map((s, i) => (
                    <div key={i} className="aa-status-row">
                      <span className="aa-status-label">{formatStatus(s.status)}</span>
                      <div className="aa-status-bar-wrap">
                        <div
                          className="aa-status-bar"
                          style={{
                            width: `${Math.round((s.count / totalAudits) * 100)}%`,
                            background: s.status === 'completed' ? '#166534'
                              : s.status === 'submitted' ? '#1565c0'
                              : s.status === 'ongoing'   ? '#b45309'
                              : s.status === 'draft'     ? '#aaa'
                              : '#6a1b9a'
                          }}
                        />
                      </div>
                      <span className="aa-status-count">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════
          TAB 2 — FACILITY OVERVIEW
          ════════════════════════════════════ */}
      {tab === 'facility' && (
        <div className="aa-content">

          {/* Summary cards */}
          <div className="aa-cards-grid aa-cards-grid--3">
            <div className="aa-card" style={{ borderBottom: '3px solid #2e7d32' }}>
              <div className="aa-card-icon" style={{ color: '#2e7d32', background: '#e8f5e9' }}>
                <FiCheckCircle size={18} />
              </div>
              <div className="aa-card-value">{facilitiesGood}</div>
              <div className="aa-card-label">Facilities in Good Condition</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #f9a825' }}>
              <div className="aa-card-icon" style={{ color: '#f9a825', background: '#fffde7' }}>
                <FiAlertTriangle size={18} />
              </div>
              <div className="aa-card-value">{facilitiesMinor}</div>
              <div className="aa-card-label">Facilities with Minor Issues</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #c62828' }}>
              <div className="aa-card-icon" style={{ color: '#c62828', background: '#ffebee' }}>
                <FiXCircle size={18} />
              </div>
              <div className="aa-card-value">{facilitiesCritical}</div>
              <div className="aa-card-label">Facilities with Critical Issues</div>
            </div>
          </div>

          {/* Corrective action trend + Safety overview donut */}
          <div className="aa-row-2">
            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Corrective Action Resolution Trend</h6>
                <span className="aa-chart-sub">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={correctionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="opened"   name="Opened"   stroke="#1565c0" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="overdue"  name="Overdue"  stroke="#b71c1c" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Facility Safety Overview</h6>
                <span className="aa-chart-sub">By condition tier</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={facilitySafetyOverview}
                    dataKey="value"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                  >
                    {facilitySafetyOverview.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance task status
          <div className="aa-chart-card">
            <div className="aa-chart-header">
              <h6>Maintenance Task Status</h6>
              <span className="aa-chart-sub">All time</span>
            </div>
            <div className="aa-maintenance-grid">
              {[
                { label: 'Completed Repairs',      value: maintenanceStatus.completed, color: '#166534', bg: '#dcfce7' },
                { label: 'Waiting for Repairs',    value: maintenanceStatus.waiting,   color: '#b45309', bg: '#fef9c3' },
                { label: 'Overdue Repairs',         value: maintenanceStatus.overdue,   color: '#b91c1c', bg: '#fee2e2' },
              ].map((m, i) => (
                <div key={i} className="aa-maintenance-card" style={{ borderLeft: `4px solid ${m.color}` }}>
                  <div className="aa-maintenance-value" style={{ color: m.color }}>{m.value}</div>
                  <div className="aa-maintenance-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Facility compliance ranking */}
          <div className="aa-chart-card">
            <div className="aa-chart-header">
              <h6>Facility Compliance Ranking</h6>
              <span className="aa-chart-sub">Best to worst</span>
            </div>
            {facilityCompliance.length === 0 ? (
              <p className="aa-empty">No facility data yet.</p>
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
                        {f.auditsCount > 0 && (
                          <span
                            className="facility-rank-status"
                            style={getFacilityStatusStyle(f.status)}
                          >
                            {f.status}
                          </span>
                        )}
                      </div>
                      <div className="facility-rank-meta">
                        {f.auditsCount === 0 ? 'No audits yet' : `${f.auditsCount} audit${f.auditsCount !== 1 ? 's' : ''}`}
                      </div>
                      <div className="facility-rank-bar-wrapper">
                        <div
                          className="facility-rank-bar"
                          style={{ width: `${f.rate}%`, background: getRateColor(f.rate) }}
                        />
                      </div>
                    </div>
                    <div className="facility-rank-rate" style={{ color: getRateColor(f.rate) }}>
                      {f.rate}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ════════════════════════════════════
          TAB 3 — FINDINGS & CORRECTIVE ACTIONS
          ════════════════════════════════════ */}
      {tab === 'findings' && (
        <div className="aa-content">

          {/* Summary cards */}
          <div className="aa-cards-grid">
            <div className="aa-card" style={{ borderBottom: '3px solid #1565c0' }}>
              <div className="aa-card-icon" style={{ color: '#1565c0', background: '#e8f0fe' }}>
                <FiShield size={18} />
              </div>
              <div className="aa-card-value">{totalFindings}</div>
              <div className="aa-card-label">Total Findings</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #f9a825' }}>
              <div className="aa-card-icon" style={{ color: '#f9a825', background: '#fffde7' }}>
                <FiAlertTriangle size={18} />
              </div>
              <div className="aa-card-value">{pendingFindings}</div>
              <div className="aa-card-label">Pending Actions</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #c62828' }}>
              <div className="aa-card-icon" style={{ color: '#c62828', background: '#ffebee' }}>
                <FiAlertOctagon size={18} />
              </div>
              <div className="aa-card-value">{overdueFindings}</div>
              <div className="aa-card-label">Overdue Actions</div>
            </div>

            <div className="aa-card" style={{ borderBottom: '3px solid #2e7d32' }}>
              <div className="aa-card-icon" style={{ color: '#2e7d32', background: '#e8f5e9' }}>
                <FiCheckCircle size={18} />
              </div>
              <div className="aa-card-value">{resolvedFindings}</div>
              <div className="aa-card-label">Resolved Findings</div>
            </div>
          </div>

          {/* CA Performance */}
          <div className="aa-chart-card">
            <div className="aa-chart-header">
              <h6>Corrective Action Performance</h6>
            </div>
            <div className="aa-perf-grid">
              {[
                { label: 'Avg Resolution Time', value: avgResolutionDays ? `${avgResolutionDays} days` : '—', color: '#1565c0' },
                { label: 'Closure Rate',        value: closureRate ? `${closureRate}%` : '—',               color: '#2e7d32' },
                { label: 'On-Time Completion',  value: onTimeRate  ? `${onTimeRate}%`  : '—',               color: '#2e7d32' },
                { label: 'Overdue Rate',        value: totalFindings > 0
                    ? `${Math.round((overdueFindings / totalFindings) * 100)}%`
                    : '—',                                                                                    color: '#b71c1c' },
              ].map((m, i) => (
                <div key={i} className="aa-perf-card">
                  <div className="aa-perf-value" style={{ color: m.color }}>{m.value}</div>
                  <div className="aa-perf-label">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top issues + Facilities with most issues */}
          <div className="aa-row-2">
            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Top Recurring Issues</h6>
                <span className="aa-chart-sub">Most frequent non-compliant items</span>
              </div>
              {topIssues.length === 0 ? (
                <p className="aa-empty">No issues recorded yet.</p>
              ) : (
                <div className="aa-issues-list">
                  {topIssues.map((issue, i) => (
                    <div key={i} className="aa-issue-row">
                      <div className="aa-issue-rank">#{i + 1}</div>
                      <div className="aa-issue-body">
                        <div className="aa-issue-text" title={issue.issue}>{issue.issue}</div>
                        {issue.section && issue.section !== '—' && (
                          <div className="aa-issue-section">{issue.section}</div>
                        )}
                      </div>
                      <span className="aa-issue-count">{issue.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="aa-chart-card">
              <div className="aa-chart-header">
                <h6>Facilities with Most Unresolved Findings</h6>
                <span className="aa-chart-sub">Top 5</span>
              </div>
              {facilitiesWithMostIssues.length === 0 ? (
                <p className="aa-empty">No unresolved findings.</p>
              ) : (
                <div className="aa-facility-issues-list">
                  {facilitiesWithMostIssues.map((f, i) => (
                    <div key={i} className="aa-facility-issue-row">
                      <div className="aa-facility-issue-rank" style={{ color: i === 0 ? '#b91c1c' : '#aaa' }}>
                        #{i + 1}
                      </div>
                      <div className="aa-facility-issue-name">{f.name}</div>
                      <span className="aa-issue-count">{f.count} open</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Officer performance */}
          <div className="aa-chart-card">
            <div className="aa-chart-header">
              <h6>Officer Performance Ranking</h6>
              <span className="aa-chart-sub">By audit count and average compliance rate</span>
            </div>
            {officerPerformance.length === 0 ? (
              <p className="aa-empty">No officer data yet.</p>
            ) : (
              <div className="aa-officer-table-wrap">
                <table className="aa-officer-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Officer</th>
                      <th>Audits Conducted</th>
                      <th>Avg Compliance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officerPerformance.map((o, i) => (
                      <tr key={i}>
                        <td className="aa-officer-rank" style={{ color: i === 0 ? '#b45309' : '#aaa' }}>
                          #{i + 1}
                        </td>
                        <td className="aa-officer-name">{o.name}</td>
                        <td>{o.audits}</td>
                        <td>
                          <span style={{ color: getRateColor(o.avgRate), fontWeight: 600 }}>
                            {o.avgRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}

export default AdminAnalytics