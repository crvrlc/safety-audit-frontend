// create new section for checklist
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import '../css/AdminChecklists.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AddSection = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState([])
  const [newItemText, setNewItemText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${user?.token}` }

  const addItem = () => {
    if (!newItemText.trim()) return
    setItems(prev => [...prev, { text: newItemText.trim(), order: prev.length + 1 }])
    setNewItemText('')
  }

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, order: i + 1 })))
  }

  const handleSave = async () => {
    if (!name.trim()) { setError('Section name is required.'); return }
    setSaving(true); setError('')
    try {
      await axios.post(
        `${API}/api/admin/checklists/sections`,
        {
          name: name.trim(),
          description: description.trim() || null,
          items: items.map((item, idx) => ({
            statement: item.text,
            order: idx + 1,
            isRequired: true,
          })),
        },
        { headers }
      )
      navigate('/admin/checklists')
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-checklists">

      <div className="edit-page-header">
        <button className="back-btn" onClick={() => navigate('/admin/checklists')}>← Back</button>
        <h2 className="page-title">Add New Section</h2>
      </div>

      <div className="edit-card" style={{ maxWidth: '640px' }}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label>Section Name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Fire Safety"
          />
        </div>

        <div className="form-group">
          <label>Description <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of what this section covers..."
          />
        </div>

        <div className="form-group">
          <label>Checklist Items</label>
          <div className="item-list" style={{ marginBottom: '10px' }}>
            {items.length === 0 && <div className="empty-items">No items yet. Add one below.</div>}
            {items.map((item, idx) => (
              <div key={idx} className="item-row">
                <span className="item-num">{idx + 1}</span>
                <span className="item-text">{item.text}</span>
                <div className="item-actions">
                  <button className="btn-sm btn-deactivate" onClick={() => removeItem(idx)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="add-item-row">
            <input
              type="text"
              className="add-item-input"
              placeholder="Add a checklist item..."
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="btn-primary" onClick={addItem}>+ Add</button>
          </div>
        </div>
      </div>

      <div className="edit-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Creating...' : 'Create Section'}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/admin/checklists')}>Cancel</button>
      </div>

    </div>
  )
}

export default AddSection