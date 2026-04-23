// checklist template page
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  DndContext,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import axios from 'axios'
import '../css/AdminChecklists.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const AdminChecklists = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [template, setTemplate] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const headers = { Authorization: `Bearer ${user?.token}` }

  const fetchTemplate = () => {
    setLoading(true)

    axios.get(`${API}/api/checklists/template`, { headers })
      .then(res => {
        if (!res.data) return
        setTemplate(res.data)

        const sorted = res.data.sections
        setSections(sorted || [])
      })
      .catch(err => console.error('Fetch template error:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTemplate()
  }, [])

  // 🔥 DRAG END HANDLER
  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sections.findIndex(s => s.id === active.id)
    const newIndex = sections.findIndex(s => s.id === over.id)

    const newOrder = arrayMove(sections, oldIndex, newIndex)
      .map((s, i) => ({ ...s, order: i + 1 }))

    setSections(newOrder) // optimistic update

    try {
      await axios.put(
        `${API}/api/admin/checklists/reorder`,
        { sections: newOrder.map(s => ({ id: Number(s.id), order: s.order })) },
        { headers }
      )
    } catch (err) {
      console.error('Auto-save order error:', err)
      fetchTemplate() // revert on failure
    }
  }

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? This cannot be undone.')) return
    try {
      await axios.delete(`${API}/api/admin/checklists/sections/${sectionId}`, { headers })
      // Only update UI if delete actually succeeded
      setSections(prev => prev.filter(s => s.id !== sectionId).map((s, i) => ({ ...s, order: i + 1 })))
    } catch (err) {
      if (err.response?.status === 400) {
        alert('This section cannot be deleted because it has been used in past audits. You can edit its contents instead.')
      } else {
        alert('Failed to delete section. Please try again.')
      }
    }
  }
  return (
    <div className="admin-checklists">

      <div className="page-header">
        <h2 className="page-title">Checklist Templates</h2>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/checklists/new-section')}
          >
            + Add New Section
          </button>

        </div>
      </div>

      {!template ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">No template found</div>
          <div className="empty-desc">
            No active checklist template exists yet.
          </div>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="sections-grid">
              {sections.map(section => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onEdit={() =>
                    navigate(`/admin/checklists/edit/${section.id}`)
                  }
                  onDelete={() => handleDelete(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

// 🔹 SORTABLE CARD
const SortableSection = ({ section, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="section-card">

      {/* Drag handle only — listeners go HERE not on the whole card */}
      <div className="drag-handle" {...attributes} {...listeners}>
        ☰
      </div>

      <h4 className="section-title">{section.name}</h4>
      <p className="section-desc">{section.description || 'No description provided.'}</p>

      <div className="section-footer">
        <span className="section-count">{section.items.length} items</span>

        {/* <button
          className="btn-sm btn-deactivate"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          Delete
        </button> */}

        <button
          className="btn-primary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          Edit Template
        </button>
      </div>
    </div>
  )
}

export default AdminChecklists