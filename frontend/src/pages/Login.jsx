import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Layout from '../components/Layout'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(username, password)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="login-page">
        <div className="card login-card">
          <h1 className="login-title">ForLove</h1>
          <p className="login-subtitle">只属于我们两个人的小世界</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>账号</label>
              <input
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ye / jie"
                required
              />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码"
                required
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? '登录中...' : '进入我们的空间'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
