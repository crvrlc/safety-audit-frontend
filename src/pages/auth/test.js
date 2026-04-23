import { useState } from 'react'

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null)

  const handleLogin = (role) => {
    localStorage.setItem('intendedRole', role)
    window.location.href = 'http://localhost:5001/auth/google'
  }

  const roles = [
    {
      role:        'safety_officer',
      label:       'Safety Officer',
      description: 'Conduct inspections and submit audit reports',
      color:       'primary',
      icon:        '🔍'
    },
    {
      role:        'facility_manager',
      label:       'Facility Manager',
      description: 'Review findings and manage corrective actions',
      color:       'success',
      icon:        '🏢'
    },
    {
      role:        'admin',
      label:       'Administrator',
      description: 'Manage users, templates and system settings',
      color:       'danger',
      icon:        '⚙️'
    }
  ]

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card p-5 shadow text-center" style={{ width: '500px' }}>
        <h2 className="mb-1 fw-bold">Safety Audit IS</h2>
        <p className="text-muted mb-4">Select your role to continue</p>

        <div className="d-flex flex-column gap-3 mb-4">
          {roles.map(({ role, label, description, color, icon }) => (
            <div
              key={role}
              className={`card p-3 border-2 cursor-pointer ${selectedRole === role ? `border-${color} bg-${color} bg-opacity-10` : 'border'}`}
              onClick={() => setSelectedRole(role)}
              style={{ cursor: 'pointer' }}
            >
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <div className="text-start">
                  <div className="fw-semibold">{label}</div>
                  <div className="text-muted small">{description}</div>
                </div>
                {selectedRole === role && (
                  <span className={`ms-auto text-${color}`}>✓</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="btn btn-dark w-100 py-2"
          onClick={() => selectedRole && handleLogin(selectedRole)}
          disabled={!selectedRole}
        >
          {selectedRole ? `Continue as ${roles.find(r => r.role === selectedRole)?.label}` : 'Select a role first'}
        </button>

        <p className="text-muted small mt-3">
          You will be verified against your assigned role
        </p>
      </div>
    </div>
  )
}

export default Login