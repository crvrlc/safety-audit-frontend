import { useState, useEffect } from 'react'
import { Modal, Button, Form, Table, Spinner, Alert } from 'react-bootstrap'
import api from '../../services/api'
import './../css/FacilitiesPage.css'
import { FiHome, FiGrid, FiUsers } from 'react-icons/fi'


const emptyForm = {
  name: '',
  unitInCharge: '',
  facilityManagerName: '',
  facilityManagerEmail: '',
}

const FacilitiesPage = () => {
  const [facilities, setFacilities]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [search, setSearch]             = useState('')

  // Form modal
  const [showForm, setShowForm]         = useState(false)
  const [editingFacility, setEditing]   = useState(null)
  const [form, setForm]                 = useState(emptyForm)
  const [offices, setOffices]           = useState([])       // string[]
  const [newOffice, setNewOffice]       = useState('')
  const [formError, setFormError]       = useState(null)
  const [saving, setSaving]             = useState(false)

  // Delete modal
  const [showDelete, setShowDelete]     = useState(false)
  const [deletingFacility, setDeleting] = useState(null)
  const [deleteError, setDeleteError]   = useState(null)
  const [deleting, setIsDeleting]       = useState(false)

  useEffect(() => { fetchFacilities() }, [])

  const fetchFacilities = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/facilities`, { withCredentials: true })
      setFacilities(res.data)
    } catch (err) {
      setError('Failed to load facilities. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers ──────────────────────────────────────────
  const handleFormChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const addOffice = () => {
    const name = newOffice.trim()
    if (!name) return
    if (offices.some(o => o.toLowerCase() === name.toLowerCase())) {
      setFormError('That office name already exists in this building.')
      return
    }
    setOffices(prev => [...prev, name])
    setNewOffice('')
    setFormError(null)
  }

  const removeOffice = (index) => setOffices(prev => prev.filter((_, i) => i !== index))

  // ── Open Add ──────────────────────────────────────────
  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setOffices([])
    setNewOffice('')
    setFormError(null)
    setShowForm(true)
  }

  // ── Open Edit ─────────────────────────────────────────
  const openEdit = (facility) => {
    setEditing(facility)
    setForm({
      name:                 facility.name,
      unitInCharge:         facility.unitInCharge || '',
      facilityManagerName:  facility.facilityManagerName  || '',
      facilityManagerEmail: facility.facilityManagerEmail || '',
    })
    setOffices(facility.offices.map(o => o.name))
    setNewOffice('')
    setFormError(null)
    setShowForm(true)
  }

  // ── Save ──────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(null)
    if (!form.name.trim())         { setFormError('Building name is required.');      return }
    if (!form.unitInCharge.trim()) { setFormError('Unit in charge is required.');     return }

    const payload = { ...form, offices }

    try {
      setSaving(true)
      if (editingFacility) {
        await api.put(`/facilities/${editingFacility.id}`, payload, { withCredentials: true })
      } else {
        await api.post(`/facilities`, payload, { withCredentials: true })
      }
      setShowForm(false)
      fetchFacilities()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────
  const openDelete = (facility) => {
    setDeleting(facility)
    setDeleteError(null)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      await api.delete(`/facilities/${deletingFacility.id}`, { withCredentials: true })
      setShowDelete(false)
      setDeleting(null)
      fetchFacilities()
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Derived ───────────────────────────────────────────
  const filtered = facilities.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.unitInCharge?.toLowerCase().includes(search.toLowerCase()) ||
    f.facilityManagerName?.toLowerCase().includes(search.toLowerCase())
  )

  const totalOffices  = facilities.reduce((s, f) => s + (f.offices?.length || 0), 0)
  const uniqueUnits   = new Set(facilities.map(f => f.unitInCharge).filter(Boolean)).size

  // ── Render ────────────────────────────────────────────
  return (
    <div className="facilities-page">

      {/* Page header */}
      <div className="facilities-header">
        <div>
          <h4 className="facilities-title">Facilities</h4>
          <p className="facilities-subtitle">Manage buildings, offices, and units in charge</p>
        </div>
        <Button className="btn-add-facility" onClick={openAdd}>+ Add Facility</Button>
      </div>

      {/* Stats */}
     <div className="facilities-stats">

      <div
        className="stat-card"
        style={{ borderBottom: '4px solid #1565c0' }}
      >
        <div className="stat-icon" style={{ color: '#1565c0' }}>
          <FiHome size={18} />
        </div>
        <span className="stat-value">{facilities.length}</span>
        <span className="stat-label">Total Facilities</span>
      </div>

      <div
        className="stat-card"
        style={{ borderBottom: '4px solid #2e7d32' }}
      >
        <div className="stat-icon" style={{ color: '#2e7d32' }}>
          <FiGrid size={18} />
        </div>
        <span className="stat-value">{totalOffices}</span>
        <span className="stat-label">Total Offices</span>
      </div>

      <div
        className="stat-card"
        style={{ borderBottom: '4px solid #6a1b9a' }}
      >
        <div className="stat-icon" style={{ color: '#6a1b9a' }}>
          <FiUsers size={18} />
        </div>
        <span className="stat-value">{uniqueUnits}</span>
        <span className="stat-label">Units in Charge</span>
      </div>

    </div>

      {/* Search */}
      <div className="facilities-search">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search by building, unit, or manager..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      {/* Table */}
      <div className="facilities-table-wrap">
        {loading ? (
          <div className="facilities-loading"><Spinner animation="border" size="sm" /> Loading facilities...</div>
        ) : filtered.length === 0 ? (
          <div className="facilities-empty">
            {search ? 'No facilities match your search.' : 'No facilities yet. Click "+ Add Facility" to get started.'}
          </div>
        ) : (
          <Table hover responsive className="facilities-table">
            <thead>
              <tr>
                <th>Building Name</th>
                <th>Unit in Charge</th>
                <th>Facility Manager</th>
                <th>Offices</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(facility => (
                <tr key={facility.id}>
                  <td className="td-name">{facility.name}</td>
                  <td>
                    <span className="tag tag-unit">{facility.unitInCharge}</span>
                  </td>
                  <td>
                    {facility.facilityManagerName ? (
                      <div>
                        <div className="td-manager-name">{facility.facilityManagerName}</div>
                        {facility.facilityManagerEmail && (
                          <div className="td-manager-email">{facility.facilityManagerEmail}</div>
                        )}
                      </div>
                    ) : (
                      <span className="td-muted">—</span>
                    )}
                  </td>
                  <td>
                    <div className="tag-list">
                      {facility.offices?.length > 0
                        ? facility.offices.map(o => (
                            <span key={o.id} className="tag tag-office">{o.name}</span>
                          ))
                        : <span className="td-muted">No offices</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-action edit"   onClick={() => openEdit(facility)}>Edit</button>
                      <button className="btn-action delete" onClick={() => openDelete(facility)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered size="lg"  dialogClassName="facility-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editingFacility ? 'Edit Facility' : 'Add Facility'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          <Form>

            <Form.Group className="mb-3">
              <Form.Label>Building Name <span className="required">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Main Administration Building"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Unit in Charge <span className="required">*</span></Form.Label>
              <Form.Control
                type="text"
                name="unitInCharge"
                value={form.unitInCharge}
                onChange={handleFormChange}
                placeholder="e.g. Office of the Chancellor"
              />
              <Form.Text className="text-muted">
                The unit or department responsible for this facility.
              </Form.Text>
            </Form.Group>

            <div className="form-row-2">
              <Form.Group className="mb-3">
                <Form.Label>Facility Manager Name</Form.Label>
                <Form.Control
                  type="text"
                  name="facilityManagerName"
                  value={form.facilityManagerName}
                  onChange={handleFormChange}
                  placeholder="e.g. Juan dela Cruz"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Facility Manager Email</Form.Label>
                <Form.Control
                  type="email"
                  name="facilityManagerEmail"
                  value={form.facilityManagerEmail}
                  onChange={handleFormChange}
                  placeholder="e.g. jdelacruz@example.com"
                />
              </Form.Group>
            </div>

            <Form.Group className="mb-2">
              <Form.Label>Offices in this Building</Form.Label>
              <Form.Text className="text-muted d-block mb-2">
                All offices belong to the unit in charge above.
              </Form.Text>
              <div className="offices-builder">
                {offices.length === 0 ? (
                  <p className="no-offices">No offices added yet.</p>
                ) : (
                  <div className="offices-list">
                    {offices.map((office, i) => (
                      <div key={i} className="office-row">
                        <span className="office-row-name">{office}</span>
                        <button type="button" className="office-row-remove" onClick={() => removeOffice(i)}>
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="add-office-row">
                  <Form.Control
                    type="text"
                    value={newOffice}
                    onChange={e => setNewOffice(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOffice())}
                    placeholder="Office name, then press Add"
                  />
                  <button type="button" className="btn-add-office" onClick={addOffice}>
                    Add
                  </button>
                </div>
              </div>
            </Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
          <Button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><Spinner animation="border" size="sm" /> Saving...</> : 'Save Facility'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────── */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Delete Facility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="delete-modal-body">
          <div className="delete-icon">🗑️</div>
          <p className="delete-facility-name">{deletingFacility?.name}</p>
          <p className="delete-warning">
            This will permanently remove this facility and all its offices.
            This cannot be undone.
          </p>
          {deleteError && <Alert variant="danger" className="mt-3 text-start">{deleteError}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><Spinner animation="border" size="sm" /> Deleting...</> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
}

export default FacilitiesPage