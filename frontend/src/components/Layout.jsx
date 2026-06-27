import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SakuraCanvas from './SakuraCanvas'
import OnlineStatus from './OnlineStatus'
import { useDarkMode } from '../hooks/useTheme'

export default function Layout({ children, particleMode = 'sakura' }) {
  const { user, logout, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  useDarkMode()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-container">
      <SakuraCanvas mode={particleMode} />
      <div className="page-content">
        {isLoggedIn && (
          <nav className="nav-bar">
            <NavLink to="/" className="nav-logo">ForLove</NavLink>
            <div className="nav-links">
              <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>首页</NavLink>
              <NavLink to="/treehole" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>树洞</NavLink>
              <NavLink to="/diary" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>日记</NavLink>
              <NavLink to="/games" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>互动</NavLink>
              <NavLink to="/distance" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>距离</NavLink>
            </div>
            <div className="nav-user">
              <OnlineStatus />
              {user?.nickname} · <button className="btn-ghost" onClick={handleLogout}>退出</button>
            </div>
          </nav>
        )}
        {children}
      </div>
    </div>
  )
}
