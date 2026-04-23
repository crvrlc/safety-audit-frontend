// edit checklist items
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import '../css/AdminChecklists.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const EditTemplate = () => {
  const { sectionId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [section, setSection] = useState(null)
  const [items, setItems] = useState([])
  const [newItemText, setNewItemText] = useState('')
  const [editingItem, setEditingItem] = useState(null) // { id, text }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [description, setDescription] = useState('')
  const [editingName, setEditingName] = useState(false)


  const headers = { Authorization: `Bearer ${user?.token}` }

  useEffect(() => {
    axios.get(`${API}/api/admin/checklists/sections/${sectionId}`, { headers })       .then(res => {
        setSection(res.data)
        setItems(res.data.items.sort((a, b) => a.order - b.order))
        setDescription(res.data.description || '')
      })
      .catch(err => console.error('Fetch section error:', err))
      .finally(() => setLoading(false))
  }, [sectionId])

  const addItem = () => {
    if (!newItemText.trim()) return
    const tempItem = {
      id: `temp-${Date.now()}`,
      statement: newItemText.trim(),
      order: items.length + 1,
      isRequired: true,
      isNew: true,
    }
    setItems(prev => [...prev, tempItem])
    setNewItemText('')
    setDirty(true)
  }

  const deleteItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id).map((item, idx) => ({ ...item, order: idx + 1 })))
    setDirty(true)
  }

  const startEdit = (item) => setEditingItem({ id: item.id, text: item.statement })

  const saveEditInline = () => {
    if (!editingItem?.text.trim()) return
    setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, statement: editingItem.text.trim() } : i))
    setEditingItem(null)
    setDirty(true)
  }

  const moveItem = (idx, dir) => {
    const newItems = [...items]
    const target = idx + dir
    if (target < 0 || target >= newItems.length) return
    ;[newItems[idx], newItems[target]] = [newItems[target], newItems[idx]]
    setItems(newItems.map((item, i) => ({ ...item, order: i + 1 })))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Save section description (name + description)
      await axios.put(`${API}/api/admin/checklists/sections/${sectionId}`, { name: section.name, description }, { headers })  // save description


      // 2. Save items (unchanged)
      await axios.put(
        `${API}/api/admin/checklists/sections/${sectionId}/items`,
        { items: items.map(({ id, statement, order, isRequired, isNew }) => ({ id: isNew ? null : id, statement, order, isRequired })) },
        { headers }
      )

      setDirty(false)
      navigate('/admin/checklists')
    } catch (e) {
      console.error('Save section error:', e)
      alert('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading"><div className="spinner" style={{ borderTopColor: '#8B0000' }} /></div>

  return (
    <div className="admin-checklists">

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {editingName ? (
        <input
          className="section-name-input"
          value={section?.name || ''}
          onChange={(e) => {
            setSection(prev => ({ ...prev, name: e.target.value }))
            setDirty(true)
          }}
          onBlur={() => setEditingName(false)}
          autoFocus
        />
      ) : (
        <>
          <h2 className="page-title">{section?.name}</h2>
          <button 
            className="icon-btn"
            onClick={() => setEditingName(true)}
          >
            ✏️
          </button>
        </>
      )}
    </div>

      <div className="section-desc-edit">
        <textarea
          className="section-desc-input"
          placeholder="Add section description..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            setDirty(true)
          }}
          rows={2}
        />
      </div>

      <div className="edit-card">
        <div className="edit-card-header">
          <h3>Checklist Items</h3>
          <span className="section-count">{items.length} items</span>
        </div>

        <div className="item-list">
          {items.length === 0 && (
            <div className="empty-items">No items yet. Add one below.</div>
          )}
          {items.map((item, idx) => (
            <div key={item.id} className="item-row">
              <div className="item-reorder">
                <button className="reorder-btn" onClick={() => moveItem(idx, -1)} disabled={idx === 0}>▲</button>
                <button className="reorder-btn" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>▼</button>
              </div>
              <span className="item-num">{idx + 1}</span>
              {editingItem?.id === item.id ? (
                <input
                  className="item-edit-input"
                  value={editingItem.text}
                  onChange={e => setEditingItem({ ...editingItem, text: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && saveEditInline()}
                  autoFocus
                />
              ) : (
                <span className="item-text">{item.statement}</span>
              )}
              <div className="item-actions">
                {editingItem?.id === item.id ? (
                  <>
                    <button className="btn-sm btn-save-inline" onClick={saveEditInline}>Save</button>
                    <button className="btn-sm btn-cancel-inline" onClick={() => setEditingItem(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button className="btn-sm btn-edit" onClick={() => startEdit(item)}>Edit</button>
                    <button className="btn-sm btn-deactivate" onClick={() => deleteItem(item.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new item */}
        <div className="add-item-row">
          <input
            type="text"
            className="add-item-input"
            placeholder="Type a new checklist item..."
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
          />
          <button className="btn-primary" onClick={addItem}>+ Add Item</button>
        </div>
      </div>

      <div className="edit-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button className="btn-secondary" onClick={() => navigate('/admin/checklists')}>Cancel</button>
      </div>

    </div>
  )
}

export default EditTemplate