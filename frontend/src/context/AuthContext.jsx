import { createContext, useContext, useState, useEffect } from 'react'
import { authStorage } from '../utils/authStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = authStorage.get('token')
    const nickname = authStorage.get('nickname')
    const username = authStorage.get('username')
    return token ? { token, nickname, username } : null
  })

  useEffect(() => {
    authStorage.clearLegacy()
  }, [])

  const login = (data) => {
    authStorage.set('token', data.token)
    authStorage.set('nickname', data.nickname)
    authStorage.set('username', data.username)
    setUser(data)
  }

  const logout = () => {
    authStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
