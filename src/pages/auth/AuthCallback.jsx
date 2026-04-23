import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

const AuthCallback = () => {
  const { login } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const role = params.get('role')

    if (token && role) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        login(token, role, payload.name)

        const roleRoutes = {
          safety_officer:   '/officer/dashboard',
          facility_manager: '/manager/dashboard',
          admin:            '/admin/dashboard'
        }

        window.location.href = roleRoutes[role] || '/login'
      } catch (err) {
        console.error('Error parsing token:', err)
        window.location.href = '/login'
      }
    } else {
      window.location.href = '/login'
    }
  }, [])

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p>Logging you in...</p>
      </div>
    </div>
  )
}

export default AuthCallback