import { useEffect, useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTypewriter } from '../hooks/useTheme'

function formatWhisperTime(t) {
  if (!t) return ''
  const date = new Date(t)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function WhisperLetter({ whisper, isMine, authorName, index }) {
  return (
    <article
      className={`whisper-letter${isMine ? ' mine' : ' theirs'}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      <div className="whisper-letter-tail" aria-hidden />
      <div className="whisper-letter-paper">
        <div className="whisper-letter-corner" aria-hidden />
        <header className="whisper-letter-head">
          <span className="whisper-letter-icon">{isMine ? '💌' : '🌸'}</span>
          <div className="whisper-letter-meta">
            <span className="whisper-letter-author">{isMine ? '我' : authorName}</span>
            <time className="whisper-letter-time">{formatWhisperTime(whisper.createdAt)}</time>
          </div>
        </header>
        <blockquote className="whisper-letter-quote">
          <span className="whisper-quote-mark open">「</span>
          {whisper.content}
          <span className="whisper-quote-mark close">」</span>
        </blockquote>
      </div>
    </article>
  )
}

export default function TreeHole() {
  const { user } = useAuth()
  const [whispers, setWhispers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [content, setContent] = useState('')
  const [quotes, setQuotes] = useState([])
  const [config, setConfig] = useState(null)
  const [justSent, setJustSent] = useState(false)
  const typeText = useTypewriter(quotes)

  const nicknameMap = useMemo(() => {
    if (!config) return {}
    return {
      [config.username1]: config.nickname1,
      [config.username2]: config.nickname2,
    }
  }, [config])

  const load = async (p = page) => {
    const data = await api.getWhispers(p)
    setWhispers(data.content)
    setTotalPages(data.totalPages)
  }

  useEffect(() => {
    load()
    api.getConfig().then((c) => {
      setConfig(c)
      setQuotes(c.loveQuotes)
    })
  }, [page])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    await api.postWhisper(content.trim())
    setContent('')
    setJustSent(true)
    setTimeout(() => setJustSent(false), 2500)
    setPage(0)
    load(0)
  }

  const getAuthorName = (author) => nicknameMap[author] || author

  return (
    <Layout particleMode="sakura">
      <header className="treehole-header">
        <h2 className="treehole-title">专属树洞</h2>
        <p className="treehole-subtitle">在这里，只对 TA 说悄悄话</p>
        <div className="typewriter treehole-quote">
          {typeText}<span className="typewriter-cursor">|</span>
        </div>
      </header>

      <div className="card treehole-compose">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              className="form-textarea treehole-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下想对 TA 说的悄悄话..."
              rows={3}
            />
          </div>
          <button className="btn btn-primary" type="submit">
            {justSent ? '已寄出 🌸' : '发送悄悄话'}
          </button>
        </form>
      </div>

      <section className="whisper-wall">
        <div className="whisper-wall-title">
          <span className="whisper-wall-line" />
          <span>悄悄话墙</span>
          <span className="whisper-wall-line" />
        </div>

        {whispers.length === 0 ? (
          <div className="whisper-empty">
            <span className="whisper-empty-icon">🌸</span>
            <p>还没有悄悄话</p>
            <p className="whisper-empty-hint">写下第一句，让樱花替你传达心意</p>
          </div>
        ) : (
          <div className="whisper-stream">
            {whispers.map((w, i) => (
              <WhisperLetter
                key={w.id}
                whisper={w}
                isMine={w.author === user?.username}
                authorName={getAuthorName(w.author)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`page-btn${page === i ? ' active' : ''}`}
              onClick={() => setPage(i)}
            >{i + 1}</button>
          ))}
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}
    </Layout>
  )
}
