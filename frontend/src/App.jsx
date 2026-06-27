import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import TreeHole from './pages/TreeHole'
import Diary from './pages/Diary'
import Games from './pages/Games'
import Distance from './pages/Distance'

function PrivateRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/treehole" element={<PrivateRoute><TreeHole /></PrivateRoute>} />
      <Route path="/diary" element={<PrivateRoute><Diary /></PrivateRoute>} />
      <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
      <Route path="/distance" element={<PrivateRoute><Distance /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
