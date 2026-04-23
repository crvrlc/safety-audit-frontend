import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import '../css/ManagerCompliance.css'
import '../css/ManagerShared.css'
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiTool,
  FiBarChart2
} from 'react-icons/fi'



const ManagerCompliance = () => {
  const { user }    = useAuth()
  const [data,      setData]    = useState(null)
  const [loading,   setLoading] = useState(true)

  useEffect(() => {
  if (!user?.token) return
  
  api.get('/manager/compliance')
    .then(res => setData(res.data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false))
}, [user])

  const getConditionClass = (rate) => {
    if (rate >= 85) return 'good'
    if (rate >= 65) return 'minor'
    return 'critical'
  }

  const getConditionLabel = (rate) => {
    if (rate >= 85) return '🟢 Good'
    if (rate >= 65) return '🟡 Minor Issues'
    return '🔴 Critical'
  }

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  const offices       = data?.officeCompliance  || []
  const trendData     = data?.trendData         || []
  const perfData      = data?.performanceData   || []
  const recurringIssues = data?.recurringIssues || []

  const goodCount     = offices.filter(o => o.complianceRate >= 85).length
  const minorCount    = offices.filter(o => o.complianceRate >= 65 && o.complianceRate < 85).length
  const criticalCount = offices.filter(o => o.complianceRate < 65).length
  const ongoingCount  = data?.ongoingCorrectiveActions ?? 0

  // console.log('Compliance Data:', data)

  return (
    <div className="manager-compliance">
      <div className="page-header">
        <div>
          <h4 className="page-title">Facility Condition Tracker - {offices[0]?.facilityName}</h4>
          <p className="page-subtitle">
            Monitor the current safety condition of facilities based on inspection results and corrective actions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="compliance-summary-grid">

  <div className="compliance-summary-card" style={{ borderBottom: '4px solid #2e7d32' }}>
    <div className="csc-icon" style={{ color: '#2e7d32' }}>
      <FiCheckCircle size={18} />
    </div>
    <div className="csc-value">{goodCount}</div>
    <div className="csc-label">Facility in Good Condition</div>
  </div>

  <div className="compliance-summary-card" style={{ borderBottom: '4px solid #f9a825' }}>
    <div className="csc-icon" style={{ color: '#f9a825' }}>
      <FiAlertTriangle size={18} />
    </div>
    <div className="csc-value">{minorCount}</div>
    <div className="csc-label">Facility with Minor Issues</div>
  </div>

  <div className="compliance-summary-card" style={{ borderBottom: '4px solid #c62828' }}>
    <div className="csc-icon" style={{ color: '#c62828' }}>
      <FiXCircle size={18} />
    </div>
    <div className="csc-value">{criticalCount}</div>
    <div className="csc-label">Facility with Critical Issues</div>
  </div>

  <div className="compliance-summary-card" style={{ borderBottom: '4px solid #6a1b9a' }}>
    <div className="csc-icon" style={{ color: '#6a1b9a' }}>
      <FiTool size={18} />
    </div>
    <div className="csc-value">{ongoingCount}</div>
    <div className="csc-label">Ongoing Corrective Actions</div>
  </div>

  <div className="compliance-summary-card" style={{ borderBottom: '4px solid #1565c0' }}>
    <div className="csc-icon" style={{ color: '#1565c0' }}>
      <FiBarChart2 size={18} />
    </div>
    <div className="csc-value">
      {offices.length > 0
        ? `${Math.round(offices.reduce((s, o) => s + o.complianceRate, 0) / offices.length)}%`
        : '—'}
    </div>
    <div className="csc-label">Facility Average Compliance</div>
  </div>

</div>

      {/* Office / Area Cards */}
      <p className="section-label">Office / Area Status</p>
      <div className="office-cards-grid">
        {offices.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: '0.875rem', gridColumn: '1/-1' }}>
              No inspection data available yet.
            </p>
          ) : offices.map((o, i) => (
          <div key={i} className={`office-card ${getConditionClass(o.complianceRate)}`}>
            <div className="oc-top">
              <div>
                <div className="oc-name">{o.officeName}</div>
                <div className="oc-facility">{o.facilityName}</div>
              </div>
              <span className={`condition-badge condition-${getConditionClass(o.complianceRate)}`}>
                {getConditionLabel(o.complianceRate)}
              </span>
            </div>
            <div className="compliance-bar-wrap">
              <div
                className="compliance-bar-fill"
                style={{ width: `${o.complianceRate}%` }}
              />
            </div>
            <div className="oc-rate">{o.complianceRate}% compliant</div>
            <div className="oc-stats">
              <div className="oc-stat">
                <div className="oc-stat-val">{o.openFindings}</div>
                <div className="oc-stat-lbl">Non-compliant Items</div>
              </div>
              {/* <div className="oc-stat">
                <div className="oc-stat-val">{o.openFindings}</div>
                <div className="oc-stat-lbl">Non-compliant Items</div>
              </div> */}
              <div className="oc-stat">
                <div className="oc-stat-val">{o.activeTasks}</div>
                <div className="oc-stat-lbl">Active Repairs</div>
              </div>
              <div className="oc-stat">
                <div className="oc-stat-val">{o.totalAudits}</div>
                <div className="oc-stat-lbl">Total Audits</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="compliance-charts-row">

        {/* Trend */}
        <div className="chart-card">
          <h6>Corrective Action Resolution Trend</h6>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
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

        {/* Performance */}
        <div className="chart-card">
          <h6>Corrective Action Performance</h6>
          <div className="perf-metrics">
            {[
              { label: 'Avg Resolution Time',  value: data?.avgResolutionDays ? `${data.avgResolutionDays} days` : '—', color: '#1565c0' },
              { label: 'Closure Rate (Month)', value: data?.closureRate ? `${data.closureRate}%` : '—',             color: '#2e7d32' },
              { label: 'Overdue Rate',          value: data?.overdueRate  ? `${data.overdueRate}%` : '—',            color: '#b71c1c' },
              { label: 'On-Time Completion',    value: data?.onTimeRate   ? `${data.onTimeRate}%` : '—',             color: '#2e7d32' },
            ].map((m, i) => (
              <div key={i} className="perf-row">
                <span className="perf-label">{m.label}</span>
                <span className="perf-value" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <BarChart width={280} height={120} data={perfData} barSize={18}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill="#8B0000" radius={[3,3,0,0]} />
            </BarChart>
          </div>
        </div>

      </div>

      {/* Recurring Issues */}
      <div className="chart-card" style={{ marginTop: 20 }}>
        <h6>Top Recurring Issues</h6>
        {recurringIssues.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '0.875rem', padding: '8px 0' }}>No data available.</p>
        ) : (
          <div className="recurring-list">
            {recurringIssues.map((issue, i) => (
              <div key={i} className="recurring-row">
                <div className="recurring-rank">#{i + 1}</div>
                <div className="recurring-body">
                  <div className="recurring-label" title={issue.issue}>
                    {issue.issue}
                  </div>
                  {issue.section && issue.section !== '—' && (
                    <div className="recurring-section">{issue.section}</div>
                  )}
                </div>
                <span className="recurring-count">{issue.count}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default ManagerCompliance