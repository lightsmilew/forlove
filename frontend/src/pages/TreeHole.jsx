import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../api'
import { useTypewriter } from '../hooks/useTheme'

export default function TreeHole() {
  const [whispers, setWhispers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [content, setContent] = useState('')
  const [quotes, setQuotes] = useState([])
  const typeText = useTypewriter(quotes)

  const load = async (p = page) => {
    const data = await api.getWhispers(p)
    setWhispers(data.content)
    setTotalPages(data.totalPages)
  }

  useEffect(() => {
    load()
    api.getConfig().then(c => setQuotes(c.loveQuotes))
  }, [page])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    await api.postWhisper(content.trim())
    setContent('')
    setPage(0)
    load(0)
  }

  const formatTime = (t) => {
    if (!t) return ''
    return new Date(t).toLocaleString('zh-CN')
  }

  return (
    <Layout particleMode="sakura">
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
        专属树洞
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        在这里，只对 TA 说悄悄话
      </p>

      <div className="typewriter">
        {typeText}<span className="typewriter-cursor">|</span>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="写下想对 TA 说的悄悄话..."
              rows={3}
            />
          </div>
          <button className="btn btn-primary" type="submit">发送悄悄话</button>
        </form>
      </div>

      {whispers.map(w => (
        <div key={w.id} className="card whisper-item">
          <div className="whisper-author">{w.author}</div>
          <div className="whisper-content">{w.content}</div>
          <div className="whisper-time">{formatTime(w.createdAt)}</div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn${page === i ? ' active' : ''}`}
              onClick={() => setPage(i)}
            >{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </Layout>
  )
}
