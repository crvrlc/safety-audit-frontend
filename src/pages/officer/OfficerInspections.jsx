import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { getMyAudits, deleteAudit, startAudit, getAuditById } from '../../services/auditService'
import { generateReport } from '../../utils/generateReport'
import { generateResolutionReport } from '../../utils/generateResolutionReport'
import {
  FiRefreshCw,
  FiCalendar,
  FiEdit,
  FiSearch,
  FiCheckCircle
} from 'react-icons/fi'
import '../css/OfficerInspections.css'

const statusConfig = {
  ongoing: {
    label: 'Ongoing',
    colorClass: 'ongoing',
    icon: FiRefreshCw
  },
  scheduled: {
    label: 'Scheduled',
    colorClass: 'scheduled',
    icon: FiCalendar
  },
  draft: {
    label: 'Draft',
    colorClass: 'draft',
    icon: FiEdit
  },
  pending_review: {
    label: 'Pending Review',
    colorClass: 'pending-review',
    icon: FiSearch
  },
  completed: {
    label: 'Completed',
    colorClass: 'completed',
    icon: FiCheckCircle
  }
}

const getComplianceClass = (rate) => {
  if (!rate) return ''
  if (rate >= 90) return ''
  if (rate >= 70) return 'moderate'
  return 'low'
}

  const getAuditProgress = (audit) => {
    const sections = audit.template?.sections || []
    const totalItems = sections.reduce((sum, s) => sum + (s.items?.length || 0), 0)
    const answeredItems = audit.auditResponses?.length || 0
    const percent = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0

    const answeredItemIds = new Set(audit.auditResponses?.map(r => r.checklistItemId) || [])

    // Find first section with unanswered items
    const currentSection = sections.find(s =>
      s.items?.some(item => !answeredItemIds.has(item.id))
    )

    // If no unanswered section found but progress isn't 100%, 
    // show first section as fallback (responses not loaded yet)
    const sectionName = !currentSection && percent < 100
      ? sections[0]?.name || 'Not Started'
      : currentSection?.name || '-' // ← removed 'Completed' here

    return {
      percent,
      currentSection: sectionName,
    }
  }



  const renderProgress = (audit) => {
    const { percent } = getAuditProgress(audit)
    const safePercent = Math.min(100, Math.max(0, Math.round(percent)))

    return (
      <span className="progress-text">
        {safePercent}% Complete
      </span>
      // <div className="compliance-bar-wrap">
      //   <div className="compliance-bar">
      //     <div
      //       className={`compliance-bar-fill ${getComplianceClass(safePercent)} ${safePercent === 100 ? 'full' : ''}`}
      //       style={{ width: `${safePercent}%` }}
      //     />
      //   </div>
      //   <small>{safePercent}%</small>
      // </div>
    )
  }

const renderCompliance = (audit) => {
  const percent = 85 // TODO: real value
  return (
    <div className="compliance-bar-wrap">
      <div className="compliance-bar">
        <div
          className={`compliance-bar-fill ${getComplianceClass(percent)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <small>{percent}%</small>
    </div>
  )
}



const OfficerInspections = () => {
  const location = useLocation()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'ongoing'
  )


  useEffect(() => {
    fetchAudits()
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const formatInspectionType = (type) => {
    if (!type) return ''

    return type
      .replace('_', '-')                // follow_up → follow-up
      .replace(/\b\w/g, c => c.toUpperCase()) // capitalize words
  }

  const formatDateTime = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  const tableColumns = {
      ongoing: [
        { label: 'Inspection ID', render: a => a.inspectionCode },
        {
          label: 'Office',
          render: a => (
            <div>
              <div>{a.office?.name || '—'}</div>
              <div className="sub-text">{a.office?.facility?.name}</div>
            </div>
          )
        },
        { label: 'Started At', render: a => formatDateTime(a.startedAt || a.createdAt) },
        { label: 'Checklist Progress', render: a => renderProgress(a) },
        { label: 'Last Edited Section', render: a => getAuditProgress(a).currentSection },        { label: 'Status', render: a => renderStatusBadge(a) },
        { label: 'Actions', render: a => renderActions(a) }
      ],

      scheduled: [
        { label: 'Inspection ID', render: a => a.inspectionCode },
        {
          label: 'Office',
          render: a => (
            <div>
              <div>{a.office?.name || '—'}</div>
              <div className="sub-text">{a.office?.facility?.name}</div>
            </div>
          )
        },
        // { label: 'Building', render: a => a.office?.facility?.name || '—' },
       { 
          label: 'Scheduled Date', 
          render: a => formatDateTime(a.scheduledAt)
        },
        { 
          label: 'Inspection Type', 
          render: a => formatInspectionType(a.inspectionType) || '—' 
        },        
        { label: 'Status', render: a => renderStatusBadge(a) },
        { label: 'Actions', render: a => renderActions(a) }
      ],

      draft: [
        { label: 'Inspection ID', render: a => a.inspectionCode },
         {
          label: 'Office',
          render: a => (
            <div>
              <div>{a.office?.name || '—'}</div>
              <div className="sub-text">{a.office?.facility?.name}</div>
            </div>
          )
        },
        { 
          label: 'Scheduled Date', 
          render: a => formatDateTime(a.scheduledAt)
        },
        { label: 'Status', render: a => renderStatusBadge(a) },
        { label: 'Actions', render: a => renderActions(a) }
      ],

      completed: [
        { label: 'Inspection ID', render: a => a.inspectionCode },
         {
          label: 'Office',
          render: a => (
            <div>
              <div>{a.office?.name || '—'}</div>
              <div className="sub-text">{a.office?.facility?.name}</div>
            </div>
          )
        },
        { label: 'Completed Date', render: a => formatDateTime(a.completedAt || a.updatedAt) },
        { 
          label: 'No. of Findings', 
          render: a => a.auditReport?.findingsCount ?? '—'
        },
        { 
          label: 'Compliance Rate', 
          render: a => {
            const rate = a.auditReport?.complianceRate
            if (rate == null) return '—'
            const color = rate >= 90 ? '#2e7d32' : rate >= 70 ? '#f57c00' : '#c62828'
            const bg    = rate >= 90 ? '#e8f5e9' : rate >= 70 ? '#fff3e0' : '#ffebee'
            const level = rate >= 90 ? 'High' : rate >= 70 ? 'Moderate' : 'Low'
            return (
              <div>
                <span style={{ color, fontWeight: 700 }}>{rate}%</span>
                <span style={{ 
                  color, background: bg, fontWeight: 600, marginLeft: 6,
                  padding: '2px 8px', borderRadius: 20, fontSize: 11
                }}>
                  {level}
                </span>
              </div>
            )
          }
        },
        { label: 'Actions', render: a => renderActions(a) }
      ],

      pending_review: [
        { label: 'Inspection ID',   render: a => a.inspectionCode },
         {
          label: 'Office',
          render: a => (
            <div>
              <div>{a.office?.name || '—'}</div>
              <div className="sub-text">{a.office?.facility?.name}</div>
            </div>
          )
        },
        { label: 'Submitted Date',  render: a => formatDateTime(a.submittedAt) },
        { label: 'Status',          render: a => renderStatusBadge(a) },
        { label: 'Actions',         render: a => renderActions(a) },
      ],
    }

  const fetchAudits = () => {
    setLoading(true)
    getMyAudits()
      .then(res => setAudits(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const counts = {
    ongoing:        audits.filter(a => ['ongoing', 'submitted', 'acknowledged', 'resolving'].includes(a.status)).length,
    scheduled:      audits.filter(a => a.status === 'scheduled').length,
    draft:          audits.filter(a => a.status === 'draft').length,
    pending_review: audits.filter(a => a.status === 'pending_review').length,
    completed:      audits.filter(a => a.status === 'completed').length,
  }

  const filteredAudits = audits.filter(a => {
    const matchesTab =
      activeTab === 'ongoing'
        ? ['ongoing', 'submitted', 'acknowledged', 'resolving'].includes(a.status)
        : activeTab === 'completed'
        ? a.status === 'completed'
        : a.status === activeTab

    const matchesSearch =
      a.inspectionCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.office?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.office?.facility?.name?.toLowerCase().includes(search.toLowerCase())

    return matchesTab && matchesSearch
  })

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this inspection?')) return
    try {
      await deleteAudit(id)
      fetchAudits()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStart = async (audit) => {
    try {
      console.log('FULL AUDIT:', audit)
      console.log('AUDIT ID:', audit?.id)   

      await startAudit(audit.id)
      navigate(`/officer/inspections/${audit.id}/start`)
      // fetchAudits()
    } catch (err) {
      console.error(err)
    }
  }

  const handleResume = (audit) => {
  navigate(`/officer/inspections/${audit.id}/start`)
}

  const getScheduleStatus = (audit) => {
    if (!audit.scheduledAt) return 'upcoming'
    return new Date(audit.scheduledAt) < new Date() ? 'overdue' : 'upcoming'
  }

  const getDraftStatus = (audit) => {
    return audit.auditResponses?.length > 0 ? 'in-progress' : 'pending-submission'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const renderActions = (audit) => {
  if (activeTab === 'ongoing') {
    if (audit.status === 'ongoing') {
      return (
        <div className="action-btns">
          <button
            className="btn-action resume"
            onClick={() => navigate(`/officer/inspections/${audit.id}/checklist`)}
          >
            Resume
          </button>
        </div>
      )
    }

    if (['submitted', 'acknowledged', 'resolving'].includes(audit.status)) {
      return (
        <div className="action-btns">
          <button
            className="btn-action view"
            onClick={async () => {
              const res = await getAuditById(audit.id)
              generateReport(res.data)
            }}
          >
            View Report
          </button>
        </div>
      )
    }
  }

    if (activeTab === 'scheduled') return (
      <div className="action-btns">
        <button className="btn-action start" onClick={() => handleStart(audit)}>
          Start
        </button>
        <button className="btn-action delete" onClick={() => handleDelete(audit.id)}>
          Delete
        </button>
      </div>
    )

    if (activeTab === 'draft') return (
      <div className="action-btns">
        <button className="btn-action resume" onClick={() => handleResume(audit)}>
          Resume
        </button>
        <button className="btn-action delete" onClick={() => handleDelete(audit.id)}>
          Delete
        </button>
      </div>
    )

    if (activeTab === 'pending_review') return (
      <div className="action-btns">
        <button
          className="btn-action review"
          onClick={() => navigate(`/officer/inspections/${audit.id}/pending-review`)}
        >
          Review & Sign Off
        </button>
      </div>
    )

    if (activeTab === 'completed') return (
      <div className="action-btns">
        <button className="btn-action view"
        onClick={() => generateResolutionReport(audit)}>
          View Report
        </button>
      </div>
    )
  }

  const renderStatusBadge = (audit) => {
  if (activeTab === 'scheduled') {
    const s = getScheduleStatus(audit)
    return <span className={`badge-status badge-${s}`}>{s}</span>
  }
  if (activeTab === 'draft') {
    const s = getDraftStatus(audit)
    return <span className={`badge-status badge-${s}`}>{s.replace('-', ' ')}</span>
  }

  
  const statusLabels = {
    ongoing:        'Ongoing',
    submitted:      'Awaiting Acknowledgment',
    acknowledged:   'Awaiting CA Assignment',
    resolving:      'CAs In Progress',
    pending_review: 'Awaiting Your Sign-Off',
    completed:      'Completed',
  }
  return (
    <span className={`badge-status badge-${audit.status}`}>
      {statusLabels[audit.status] || audit.status}
    </span>
  )
}

  return (
    <div className="officer-inspections">

      {/* Header */}
      <div className="inspections-header">
      <div>
        <h4>Inspections</h4>
        <p className="page-subtext">
          Manage and track all your inspections, from scheduled to completed.
        </p>
      </div>

      <button
        className="btn-schedule"
        onClick={() => navigate('/officer/schedule')}
      >
        + Schedule New Inspection
      </button>
    </div>

      {/* Status Cards */}
      <div className="status-cards">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon

          return (
            <div
              key={key}
              className={`status-card ${key} ${activeTab === key ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: key })}
            >
              <div className={`status-card-count ${key}`}>
                {counts[key]}
              </div>

              <div className="status-card-label">
                <Icon size={14} /> {config.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div className="inspections-table-section">
        <div className="table-section-header">
          <h6 className="table-section-title">
            {statusConfig[activeTab]?.label} Inspections
          </h6>
          <input
            type="text"
            className="table-search"
            placeholder="Search by ID or office..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="inspections-table">
            <thead>
              <tr>
                {tableColumns[activeTab].map((col, i) => (
                  <th key={i}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColumns[activeTab].length} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" />
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns[activeTab].length}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <p>No {activeTab} inspections found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAudits.map(audit => (
                  <tr key={audit.id}>
                    {tableColumns[activeTab].map((col, i) => (
                      <td key={i}>{col.render(audit)}</td>
                    ))}
                  </tr>
                ))
              )}
</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OfficerInspections