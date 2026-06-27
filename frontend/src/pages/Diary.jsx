import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { api } from '../api'
import { getMoodLabel, MoodPicker } from '../utils/mood'

const MAX_PHOTOS = 9

function createPhotoItem(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    preview: URL.createObjectURL(file),
  }
}

export default function Diary() {
  const [diaries, setDiaries] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(7)
  const [stats, setStats] = useState(null)
  const [config, setConfig] = useState(null)
  const [photos, setPhotos] = useState([])
  const photoInputRef = useRef(null)
  const photosRef = useRef(photos)
  photosRef.current = photos

  const revokePhotos = (items) => {
    items.forEach((p) => URL.revokeObjectURL(p.preview))
  }

  const clearPhotos = () => {
    revokePhotos(photos)
    setPhotos([])
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPhotos((prev) => {
      const remaining = MAX_PHOTOS - prev.length
      const added = files.slice(0, remaining).map(createPhotoItem)
      return [...prev, ...added]
    })
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  useEffect(() => () => revokePhotos(photosRef.current), [])

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
    if (photos.length > 0) {
      await api.uploadDiaryPhotos(diary.id, photos.map((p) => p.file))
    }
    setContent('')
    setMood(7)
    clearPhotos()
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

  const formatTime = (t) => (t ? new Date(t).toLocaleString('zh-CN') : '')

  const getDiaryPhotos = (d) => {
    if (d.photoUrls?.length) return d.photoUrls
    if (d.photoUrl) return [d.photoUrl]
    return []
  }

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
            <div className="stat-value stat-value-text">{getMoodLabel(stats.avgMood)}</div>
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
            <MoodPicker value={mood} onChange={setMood} />
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
            <label>添加照片 {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="file-upload-input"
              onChange={handlePhotoChange}
            />
            <div className="photo-upload-grid">
              {photos.map((photo) => (
                <div key={photo.id} className="photo-upload-box has-photo">
                  <img src={photo.preview} alt="照片预览" className="photo-upload-preview" />
                  <button
                    type="button"
                    className="photo-upload-remove"
                    aria-label="移除照片"
                    onClick={() => removePhoto(photo.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <div
                  className="photo-upload-box"
                  onClick={() => photoInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && photoInputRef.current?.click()}
                >
                  <span className="photo-upload-plus">+</span>
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>保存日记</button>
        </form>
      </div>

      {diaries.map(d => (
        <div key={d.id} className="card">
          <span className="diary-mood">{getMoodLabel(d.mood)} · {d.mood}/10</span>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{d.author}</div>
          <p style={{ lineHeight: 1.8 }}>{d.content}</p>
          {getDiaryPhotos(d).length > 0 && (
            <div className="diary-photo-grid">
              {getDiaryPhotos(d).map((url, i) => (
                <img key={i} src={url} alt={`日记照片 ${i + 1}`} className="diary-photo" />
              ))}
            </div>
          )}
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
