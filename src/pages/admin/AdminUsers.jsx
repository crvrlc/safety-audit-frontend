// user management
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../css/AdminUsers.css'

import { FiUsers, FiUserCheck, FiUserX, FiUserPlus } from 'react-icons/fi'


const ROLE_LABELS = {
  admin: 'Admin',
  safety_officer: 'Safety Officer',
  facility_manager: 'Facility Manager',
}

const ROLE_META = {
  admin: { label: 'Admin', color: '#1565c0' },
  safety_officer: { label: 'Safety Officer', color: '#e65100' },
  facility_manager: { label: 'Facility Manager', color: '#6a1b9a' },
}

const AVATAR_COLORS = ['#8B0000', '#1565c0', '#2e7d32', '#6a1b9a', '#e65100', '#00695c', '#37474f']

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

const getAvatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length]

const RoleBadge = ({ role }) => {
  const cls = { admin: 'badge-admin', safety_officer: 'badge-officer', facility_manager: 'badge-manager' }
  return <span className={`badge ${cls[role] || ''}`}>{ROLE_LABELS[role] || role}</span>
}

const StatusBadge = ({ isActive }) => (
  <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
    {isActive ? 'Active' : 'Inactive'}
  </span>
)

const EMPTY_FORM = { name: '', email: '', role: 'safety_officer', isActive: true }

const AdminUsers = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Fetch users error:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const now = new Date()
  const thisMonth = users.filter(u => {
    const d = new Date(u.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    const matchStatus = !statusFilter ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive)
    return matchSearch && matchRole && matchStatus
  })

  const openAdd = () => {
    console.log('openAdd called')
    setForm(EMPTY_FORM)
    setError('')
    setShowAddModal(true)
  }

  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, role: u.role, isActive: u.isActive })
    setError('')
    setShowEditModal(true)
  }

  const handleAdd = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/admin/users', form)
      setShowAddModal(false)
      fetchUsers()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user.')
    } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    setSaving(true); setError('')
    try {
      await api.put(`/admin/users/${editingUser.id}`, form)
      setShowEditModal(false)
      fetchUsers()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update user.')
    } finally { setSaving(false) }
  }

  const handleToggleStatus = async (u) => {
    try {
      await api.put(`/admin/users/${u.id}`, { ...u, isActive: !u.isActive })
      fetchUsers()
    } catch (e) {
      console.error('Toggle status error:', e)
    }
  }

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ borderTopColor: '#8B0000' }} /></div>

  return (
    <div className="admin-users">

      <div className="page-header">
        <h4 className="page-title">Manage Users</h4>
      </div>

      {/* Stat cards */}
      <div className="users-stat-grid">

        <div className="users-stat-card" style={{ borderBottom: '4px solid #1565c0' }}>
          <div className="stat-icon" style={{ color: '#1565c0' }}>
            <FiUsers size={18} />
          </div>
          <div className="stat-value" style={{ color: '#1565c0' }}>{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>

        <div className="users-stat-card" style={{ borderBottom: '4px solid #2e7d32' }}>
          <div className="stat-icon" style={{ color: '#2e7d32' }}>
            <FiUserCheck size={18} />
          </div>
          <div className="stat-value" style={{ color: '#2e7d32' }}>
            {users.filter(u => u.isActive).length}
          </div>
          <div className="stat-label">Active Users</div>
        </div>

        <div className="users-stat-card" style={{ borderBottom: '4px solid #c62828' }}>
          <div className="stat-icon" style={{ color: '#c62828' }}>
            <FiUserX size={18} />
          </div>
          <div className="stat-value" style={{ color: '#c62828' }}>
            {users.filter(u => !u.isActive).length}
          </div>
          <div className="stat-label">Inactive Users</div>
        </div>

        <div className="users-stat-card" style={{ borderBottom: '4px solid #6a1b9a' }}>
          <div className="stat-icon" style={{ color: '#6a1b9a' }}>
            <FiUserPlus size={18} />
          </div>
          <div className="stat-value" style={{ color: '#6a1b9a' }}>
            {thisMonth}
          </div>
          <div className="stat-label">New This Month</div>
        </div>

      </div>

      {/* Filters + Add button */}
      <div className="filter-row">
        <input
          type="text"
          className="filter-input"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="safety_officer">Safety Officer</option>
          <option value="facility_manager">Facility Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="empty-row">No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar" style={{ background: getAvatarColor(u.id) }}>
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : getInitials(u.name)
                      }
                    </div>
                    {u.name}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      color: '#333',
                      fontWeight: 600,
                      letterSpacing: '0.2px'
                    }}
                  >
                    {ROLE_META[u.role]?.label || u.role}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: `1px solid ${u.isActive ? '#2e7d32' : '#c62828'}`,
                      color: u.isActive ? '#2e7d32' : '#c62828',
                      background: '#fff'
                    }}
                  >
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-sm btn-edit" onClick={() => openEdit(u)}>Edit</button>
                    {u.isActive
                      ? <button className="btn-sm btn-deactivate" onClick={() => handleToggleStatus(u)}>Deactivate</button>
                      : <button className="btn-sm btn-activate" onClick={() => handleToggleStatus(u)}>Activate</button>
                    }
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="au-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            <h3>Add New User</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@ceat.edu.ph" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="facility_manager">Facility Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <p className="form-note">The user will log in via Google SSO. Name and email will be synced on first login.</p>
            <div className="au-modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Add User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="au-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            <h3>Edit User</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="safety_officer">Safety Officer</option>
                  <option value="facility_manager">Facility Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm({ ...form, isActive: e.target.value === 'active' })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <p className="form-note">Name and email are pre-filled from Google SSO and can be updated here if needed.</p>
            <div className="au-modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminUsers