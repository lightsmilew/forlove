import { useEffect, useState, useMemo } from 'react'
import Layout from '../components/Layout'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useTypewriter } from '../hooks/useTheme'
import { useVoiceRecorder, formatDuration } from '../hooks/useVoiceRecorder'
import VoicePlayer from '../components/VoicePlayer'

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

function WhisperVoicePlayer({ url, duration }) {
  return (
    <div className="whisper-voice">
      <VoicePlayer src={url} duration={duration} />
    </div>
  )
}

function WhisperLetter({ whisper, isMine, authorName, index }) {
  const hasText = Boolean(whisper.content?.trim())
  const hasVoice = Boolean(whisper.voiceUrl)

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
        {hasVoice && (
          <WhisperVoicePlayer
            url={whisper.voiceUrl}
            duration={whisper.voiceDuration}
          />
        )}
        {hasText && (
          <blockquote className="whisper-letter-quote">
            <span className="whisper-quote-mark open">「</span>
            {whisper.content}
            <span className="whisper-quote-mark close">」</span>
          </blockquote>
        )}
        {!hasText && !hasVoice && (
          <p className="whisper-letter-empty">（空消息）</p>
        )}
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
  const [submitting, setSubmitting] = useState(false)
  const typeText = useTypewriter(quotes)

  const voice = useVoiceRecorder()

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
    const text = content.trim()
    const voiceFile = voice.getFile()
    if (!text && !voiceFile) return

    setSubmitting(true)
    try {
      const whisper = await api.postWhisper(text)
      if (voiceFile) {
        await api.uploadWhisperVoice(whisper.id, voiceFile, voice.duration)
      }
      setContent('')
      voice.clearRecording()
      setJustSent(true)
      setTimeout(() => setJustSent(false), 2500)
      setPage(0)
      load(0)
    } catch (err) {
      alert(err.message || '发送失败')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRecording = () => {
    if (voice.recording) {
      voice.stopRecording()
    } else {
      voice.startRecording()
    }
  }

  const canSend = (content.trim() || voice.blob) && !voice.recording && !submitting

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

          <div className="treehole-voice-bar">
            <div className="treehole-actions">
              <button
                type="button"
                className={`btn btn-secondary treehole-record-btn${voice.recording ? ' recording' : ''}${voice.blob ? ' has-preview' : ''}`}
                onClick={toggleRecording}
                disabled={submitting || Boolean(voice.blob)}
                aria-label={voice.recording ? '停止录音' : '开始录音'}
              >
                {voice.recording
                  ? <>⏹ 录音中 {formatDuration(voice.duration)}</>
                  : voice.blob
                    ? '已录制'
                    : '点击录音'}
              </button>
              <button className="btn btn-primary treehole-send-btn" type="submit" disabled={!canSend}>
                {justSent ? '已寄出 🌸' : submitting ? '发送中...' : '发送悄悄话'}
              </button>
            </div>

            {voice.previewUrl && !voice.recording && (
              <div className="treehole-voice-preview">
                <VoicePlayer src={voice.previewUrl} duration={voice.duration} />
                <button
                  type="button"
                  className="btn-ghost treehole-voice-clear"
                  onClick={voice.clearRecording}
                >
                  删除
                </button>
              </div>
            )}

            {voice.error && <p className="treehole-voice-error">{voice.error}</p>}
          </div>
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
            <p className="whisper-empty-hint">写下文字或录一段语音，让樱花替你传达心意</p>
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
