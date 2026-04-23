import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../css/ManagerMaintenance.css'

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const daysRemaining = (dueDateStr) => {
  if (!dueDateStr) return null
  const diff = Math.ceil((new Date(dueDateStr) - new Date()) / 86400000)
  return diff
}

const getStatusClass = (status) => {
  switch (status) {
    case 'waiting_for_repairs': return 'badge-scheduled'
    case 'overdue_repairs':     return 'badge-overdue'
    case 'completed_repairs':   return 'badge-completed'
    default:                    return 'badge-draft'
  }
}

const getSeverityClass = (s) => {
  switch (s) {
    case 'critical': return 'badge-critical'
    case 'high':     return 'badge-high'
    case 'medium':   return 'badge-medium'
    case 'low':      return 'badge-low'
    default:         return 'badge-draft'
  }
}

const DaysCell = ({ dueDateStr }) => {
  const days = daysRemaining(dueDateStr)
  if (days === null) return <span>—</span>
  if (days < 0)  return <span className="days-overdue">{Math.abs(days)}d overdue</span>
  if (days <= 3) return <span className="days-urgent">{days}d left</span>
  return <span className="days-ok">{days}d left</span>
}

const UpdateModal = ({ task, onClose, onSaved }) => {
  const { user } = useAuth()
  const [status,  setStatus]  = useState(task?.status || 'waiting_for_repairs')
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0,10) || '')
  const [notes,   setNotes]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = { status, dueDate: dueDate || undefined }
      if (status === 'completed_repairs') payload.completedAt = new Date().toISOString()

      await api.patch(`/manager/maintenance/${task.id}`, payload)

      if (status === 'completed_repairs') {
        await api.patch(`/manager/findings/${task.findingId}`, {
          resolutionStatus: 'resolved',
          resolvedAt: new Date().toISOString(),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Update Maintenance Task</h5>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-info-block">
            <div className="modal-info-row">
              <span className="modal-info-label">Task ID</span>
              <span className="modal-info-value mono">MT-{task?.id}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Office / Facility</span>
              <span className="modal-info-value">
                {task?.finding?.audit?.office?.name} — {task?.finding?.audit?.office?.facility?.name}
              </span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Finding</span>
              <span className="modal-info-value">{task?.finding?.description}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Assigned To</span>
              <span className="modal-info-value">{task?.assignedUser?.name || '—'}</span>
            </div>
            <div className="modal-info-row">
              <span className="modal-info-label">Priority</span>
              <span className={`badge-status ${getSeverityClass(task?.finding?.severity)}`}>
                {task?.finding?.severity || '—'}
              </span>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label">Update Status</label>
            <select className="modal-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="waiting_for_repairs">Waiting for Repairs</option>
              <option value="overdue_repairs">Overdue</option>
              <option value="completed_repairs">Completed</option>
            </select>
          </div>
          <div className="modal-field">
            <label className="modal-label">Revised Due Date</label>
            <input type="date" className="modal-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Progress Notes</label>
            <textarea className="modal-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Describe status, work done, or blockers…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}

const ManagerMaintenance = () => {
  const { user } = useAuth()
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [updateTarget, setUpdateTarget] = useState(null)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSev,    setFilterSev]    = useState('all')
  const [filterOffice, setFilterOffice] = useState('all')

  const fetchTasks = useCallback(() => {
    setLoading(true)
    api.get('/manager/maintenance')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, []) 

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const officeOptions = [...new Map(
    tasks.map(t => [t.finding?.audit?.officeId, t.finding?.audit?.office?.name])
  ).entries()]

  const filtered = tasks.filter(t => {
    const matchSearch = !search ||
      t.finding?.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.finding?.audit?.inspectionCode?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    const matchSev    = filterSev === 'all' || t.finding?.severity === filterSev
    const matchOffice = filterOffice === 'all' || String(t.finding?.audit?.officeId) === filterOffice
    return matchSearch && matchStatus && matchSev && matchOffice
  })

  // Auto-flag overdue (due date passed and not completed)
  const enriched = filtered.map(t => ({
    ...t,
    status: t.status !== 'completed_repairs' && t.dueDate && new Date(t.dueDate) < new Date()
      ? 'overdue_repairs'
      : t.status
  }))

  const waiting  = enriched.filter(t => t.status === 'waiting_for_repairs').length
  const overdue  = enriched.filter(t => t.status === 'overdue_repairs').length
  const completed = tasks.filter(t => t.status === 'completed_repairs').length

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" style={{ color: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="manager-maintenance">
      <div className="page-header">
        <div>
          <h4 className="page-title">Maintenance Tasks</h4>
          <p className="page-subtitle">Track all corrective maintenance assigned to address safety findings</p>
        </div>
      </div>

      {/* Summary */}
      <div className="maint-summary-grid">
        <div className="maint-summary-card blue">
          <div className="msc-value">{waiting}</div>
          <div className="msc-label">Waiting for Repairs</div>
        </div>
        <div className="maint-summary-card red">
          <div className="msc-value">{overdue}</div>
          <div className="msc-label">Overdue</div>
        </div>
        <div className="maint-summary-card green">
          <div className="msc-value">{completed}</div>
          <div className="msc-label">Completed</div>
        </div>
        <div className="maint-summary-card gray">
          <div className="msc-value">{tasks.length}</div>
          <div className="msc-label">Total Tasks</div>
        </div>
      </div>

      {/* Filters */}
      <div className="findings-filters">
        <input
          className="filter-input"
          placeholder="Search ID or finding…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filterOffice} onChange={e => setFilterOffice(e.target.value)}>
          <option value="all">All Offices</option>
          {officeOptions.map(([id, name]) => (
            <option key={id} value={String(id)}>{name}</option>
          ))}
        </select>
        <select className="filter-select" value={filterSev} onChange={e => setFilterSev(e.target.value)}>
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="waiting_for_repairs">Waiting</option>
          <option value="overdue_repairs">Overdue</option>
          <option value="completed_repairs">Completed</option>
        </select>
      </div>

      {/* Table */}
      <div className="findings-table-wrap">
        <table className="findings-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Office / Facility</th>
              <th>Finding</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Days Remaining</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {enriched.length === 0 ? (
              <tr><td colSpan={9} className="empty-cell">No maintenance tasks found</td></tr>
            ) : enriched.map(t => (
              <tr key={t.id}>
                <td className="mono-cell">MT-{t.id}</td>
                <td>
                  <div>{t.finding?.audit?.office?.name || '—'}</div>
                  <div className="sub-text">{t.finding?.audit?.office?.facility?.name || '—'}</div>
                </td>
                <td className="desc-cell">{t.finding?.description || '—'}</td>
                <td>{t.assignedUser?.name || <span className="unassigned">Unassigned</span>}</td>
                <td>{fmtDate(t.dueDate)}</td>
                <td><DaysCell dueDateStr={t.dueDate} /></td>
                <td>
                  <span className={`badge-status ${getSeverityClass(t.finding?.severity)}`}>
                    {t.finding?.severity || '—'}
                  </span>
                </td>
                <td>
                  <span className={`badge-status ${getStatusClass(t.status)}`}>
                    {t.status?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  {t.status !== 'completed_repairs' && (
                    <button className="btn-secondary btn-sm" onClick={() => setUpdateTarget(t)}>
                      Update
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {updateTarget && (
        <UpdateModal
          task={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSaved={fetchTasks}
        />
      )}
    </div>
  )
}

export default ManagerMaintenance