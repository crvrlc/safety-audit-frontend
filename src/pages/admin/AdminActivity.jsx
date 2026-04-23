import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import '../css/AdminHome.css' // reuse your dashboard styles

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AdminActivity = () => {
  const { user } = useAuth()

  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const uniqueUsers = [...new Set(activity.map(a => a.userName))]

  const ITEMS_PER_PAGE = 20

  const getIcon = (action) => {
    if (action.includes('Created')) return '🟢'
    if (action.includes('Deleted')) return '🔴'
    if (action.includes('Updated')) return '🟡'
    return '⚪'
  }

  

  useEffect(() => {
    if (!user?.token) return

    const headers = { Authorization: `Bearer ${user.token}` }

    axios.get(`${API}/api/admin/activity`, { headers })
      .then(res => setActivity(res.data))
      .catch(err => console.error('Activity fetch error:', err))
      .finally(() => setLoading(false))
  }, [user])

  const formatActivityDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 🔢 Pagination logic 
  const filteredActivity = activity.filter(a => {
    const matchesSearch =
      a.userName.toLowerCase().includes(search.toLowerCase()) ||
      a.action.toLowerCase().includes(search.toLowerCase())

    const matchesUser =
      selectedUser ? a.userName === selectedUser : true

    const matchesDate =
      dateFilter
        ? new Date(a.createdAt).toDateString() === new Date(dateFilter).toDateString()
        : true

    return matchesSearch && matchesUser && matchesDate
  })

  const totalPages = Math.ceil(filteredActivity.length / ITEMS_PER_PAGE)

  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const currentItems = filteredActivity.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" style={{ borderTopColor: '#8B0000' }} />
      </div>
    )
  }

  return (
    <div className="admin-home">

      <div className="page-header">
        <h2 className="page-title">All Activity</h2>
      </div>

      <div className="activity-filters">

      {/* 🔍 Search */}
      <input
        type="text"
        placeholder="Search user or action..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        className="filter-input"
      />

      {/* 👤 User dropdown */}
      <select
        value={selectedUser}
        onChange={(e) => {
          setSelectedUser(e.target.value)
          setPage(1)
        }}
        className="filter-select"
      >
        <option value="">All Users</option>
        {uniqueUsers.map((u, i) => (
          <option key={i} value={u}>{u}</option>
        ))}
      </select>

      {/* 📅 Date filter */}
      <input
        type="date"
        value={dateFilter}
        onChange={(e) => {
          setDateFilter(e.target.value)
          setPage(1)
        }}
        className="filter-input"
      />

      {/* ❌ Clear filters */}
      <button
        className="btn-secondary"
        onClick={() => {
          setSearch('')
          setSelectedUser('')
          setDateFilter('')
          setPage(1)
        }}
      >
        Clear
      </button>

    </div>

      <div className="info-card">
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
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-row">
                    No activity found
                  </td>
                </tr>
              ) : currentItems.map((row, i) => (
                <tr key={i}>
                  <td>{row.userName}</td>
                  <td>{row.action}</td>
                  {/* <td>{getIcon(row.action)} {row.action}</td> */}
                  <td>{formatActivityDate(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔢 Pagination controls */}
        <div className="pagination">
          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>

          <span className="page-info">
            Page {page} of {totalPages || 1}
          </span>

          <button
            className="btn-secondary"
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next →
          </button>
        </div>

      </div>
    </div>
  )
}

export default AdminActivity