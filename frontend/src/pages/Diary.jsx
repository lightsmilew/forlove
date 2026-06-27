import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { api } from '../api'

const MOOD_EMOJIS = ['😢', '😔', '😐', '🙂', '😊', '🥰', '😍', '🤩', '💕', '💖']

export default function Diary() {
  const [diaries, setDiaries] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(7)
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  const load = async () => {
    const [diaryData, statsData, configData] = await Promise.all([
      api.getDiaries(page),
      api.getDiaryStats(),
      api.getConfig(),
    ])
    setDiaries(diaryData.content)
    setTotalPages(diaryData.totalPages)
    setStats(statsData)
    setConfig(configData)
  }

  useEffect(() => { load() }, [page])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    const diary = await api.postDiary(content.trim(), mood)
    if (photoFile) {
      await api.uploadDiaryPhoto(diary.id, photoFile)
    }
    setContent('')
    setMood(7)
    setPhotoFile(null)
    setPage(0)
    load()
  }

  const getDaysUntil = (dateStr) => {
    const target = new Date(dateStr)
    const now = new Date()
    target.setFullYear(now.getFullYear())
    if (target < now) target.setFullYear(now.getFullYear() + 1)
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  }

  const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : ''

  return (
    <Layout>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
        情侣日记本
      </h2>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.daysTogether}</div>
            <div className="stat-label">相处天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">日记条数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.sweetIndex}</div>
            <div className="stat-label">甜蜜指数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{MOOD_EMOJIS[Math.round(stats.avgMood)] || '😊'}</div>
            <div className="stat-label">平均心情</div>
          </div>
        </div>
      )}

      {config?.anniversaries && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '0.8rem' }}>纪念日提醒</h3>
          <ul className="anniversary-list">
            {config.anniversaries.map((a, i) => (
              <li key={i} className="anniversary-item">
                <span>{a.name}</span>
                <span style={{ color: 'var(--accent)' }}>
                  {a.date} · 还有 {getDaysUntil(a.date)} 天
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>今天的心情</label>
            <input
              type="range"
              className="mood-slider"
              min="1"
              max="10"
              value={mood}
              onChange={e => setMood(+e.target.value)}
            />
            <div className="mood-emoji">{MOOD_EMOJIS[mood]}</div>
          </div>
          <div className="form-group">
            <textarea
              className="form-textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="记录今天的故事..."
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>添加照片</label>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
          </div>
          <button className="btn btn-primary" type="submit">保存日记</button>
        </form>
      </div>

      {diaries.map(d => (
        <div key={d.id} className="card">
          <span className="diary-mood">{MOOD_EMOJIS[d.mood] || '😊'} 心情 {d.mood}/10</span>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{d.author}</div>
          <p style={{ lineHeight: 1.8 }}>{d.content}</p>
          {d.photoUrl && <img src={d.photoUrl} alt="日记照片" className="diary-photo" />}
          <div className="whisper-time">{formatTime(d.createdAt)}</div>
        </div>
      ))}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <span style={{ lineHeight: '36px', color: 'var(--text-secondary)' }}>{page + 1} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </Layout>
  )
}
