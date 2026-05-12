import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')
    const email     = localStorage.getItem('email')
  const avatarUrl = localStorage.getItem('avatarUrl')
    return token ? { token, role, name, email, avatarUrl } : null
  })

  const login = (token, role, name, email, avatarUrl) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('name', name)
    localStorage.setItem('email', email)
    localStorage.setItem('avatarUrl', avatarUrl)
    setUser({ token, role, name, email, avatarUrl })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    localStorage.removeItem('avatarUrl')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)