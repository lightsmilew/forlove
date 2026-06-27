import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Heart3D from '../components/Heart3D'
import GomokuGame from '../components/GomokuGame'
import { api } from '../api'

const LOVE_MESSAGES = [
  '你是我心中永远盛开的那朵樱花',
  '每一颗爱心都是我对你的思念',
  '愿陪你从珞珈山走到世界的尽头',
  '你的笑容比樱花还要灿烂',
  '爱你，是我做过最对的事',
  '想和你一起看遍四季的樱花',
  '心跳的每一拍都在说爱你',
  '有你的日子，连空气都是甜的',
  '武大樱花季，只想和你牵手走过',
  '你是我的今天，也是所有的明天',
]

function HeartGame() {
  const [score, setScore] = useState(0)
  const [message, setMessage] = useState('')
  const [floats, setFloats] = useState([])

  const clickHeart = () => {
    const newScore = score + 1
    setScore(newScore)
    const msgIndex = Math.floor(newScore / 5) % LOVE_MESSAGES.length
    if (newScore % 5 === 0) {
      setMessage(LOVE_MESSAGES[msgIndex])
      api.saveGameScore('heart', newScore).catch(() => {})
    }
    const id = Date.now()
    setFloats((h) => [...h.slice(-4), { id, x: Math.random() * 50 - 25 }])
    setTimeout(() => setFloats((h) => h.filter((f) => f.id !== id)), 1000)
  }

  return (
    <div className="game-area">
      <div className="game-score-display">爱心 {score}</div>
      <Heart3D onClick={clickHeart} />
      <p className="heart-game-hint">点击爱心，每 5 分解锁一句情话</p>
      {message && <div className="heart-message-card">{message}</div>}
      <div className="heart-float-layer">
        {floats.map((h) => (
          <span key={h.id} className="heart-float-score" style={{ left: `calc(50% + ${h.x}px)` }}>
            +1
          </span>
        ))}
      </div>
    </div>
  )
}

function QuizCreateForm({ onCreated }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const updateOption = (idx, val) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmed = options.map((o) => o.trim())
    const filledItems = trimmed.map((o, i) => ({ o, i })).filter((x) => x.o)
    const filled = filledItems.map((x) => x.o)
    if (!question.trim()) {
      setError('请输入题目')
      return
    }
    if (filled.length < 2) {
      setError('至少填写 2 个选项')
      return
    }
    const correctInFilled = filledItems.findIndex((x) => x.i === correctIndex)
    if (correctInFilled < 0) {
      setError('请为标记的正确答案填写选项内容')
      return
    }
    setLoading(true)
    try {
      const res = await api.createQuiz(question.trim(), filled, correctInFilled)
      setSuccess(res.message || '题目已发送')
      setQuestion('')
      setOptions(['', '', '', ''])
      setCorrectIndex(0)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="quiz-create-form" onSubmit={handleSubmit}>
      <p className="quiz-hint">出一道选择题发给 TA，正确答案由你设定，看 TA 能否猜中~</p>
      <div className="form-group">
        <label>题目</label>
        <input
          className="form-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="例如：我最喜欢的季节是？"
        />
      </div>
      {options.map((opt, i) => (
        <div key={i} className="form-group quiz-option-row">
          <label>
            <input
              type="radio"
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
            />
            选项 {String.fromCharCode(65 + i)}
          </label>
          <input
            className="form-input"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`选项 ${String.fromCharCode(65 + i)}`}
          />
        </div>
      ))}
      <p className="quiz-hint">选中 radio 标记正确答案（TA 需要猜中）</p>
      {error && <p className="error-msg">{error}</p>}
      {success && <p className="quiz-success">{success}</p>}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? '发送中...' : '发给 TA'}
      </button>
    </form>
  )
}

function QuizAnswerPanel() {
  const [pending, setPending] = useState([])
  const [current, setCurrent] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const list = await api.getPendingQuiz()
      setPending(list)
      setCurrent(0)
      setFeedback(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const selectAnswer = async (idx) => {
    const q = pending[current]
    try {
      const res = await api.answerQuiz(q.id, idx)
      setFeedback(res)
      setTimeout(async () => {
        const next = current + 1
        if (next >= pending.length) {
          await load()
        } else {
          setCurrent(next)
          setFeedback(null)
        }
      }, 1500)
    } catch (err) {
      setFeedback({ message: err.message, matched: false })
    }
  }

  if (loading) return <p className="quiz-hint">加载中...</p>
  if (pending.length === 0) {
    return <p className="quiz-hint">暂无待答题目，等 TA 给你出题吧~</p>
  }

  if (feedback) {
    return (
      <div className="game-area">
        <div className={`quiz-feedback${feedback.matched ? ' match' : ''}`}>
          {feedback.message}
        </div>
      </div>
    )
  }

  const q = pending[current]
  return (
    <div>
      <p className="quiz-hint">
        {q.authorNickname} 出的题 · 第 {current + 1} / {pending.length} 题
      </p>
      <h3 className="quiz-question-title">{q.question}</h3>
      {q.options.map((opt, i) => (
        <button key={i} type="button" className="quiz-option" onClick={() => selectAnswer(i)}>
          {String.fromCharCode(65 + i)}. {opt}
        </button>
      ))}
    </div>
  )
}

function QuizReportPanel() {
  const [report, setReport] = useState(null)

  useEffect(() => {
    api.getQuizReport().then(setReport).catch(console.error)
  }, [])

  if (!report) return <p className="quiz-hint">加载中...</p>

  return (
    <div className="game-area">
      <div className="game-score-display">默契值 {report.compatibility}%</div>
      <p style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{report.message}</p>
      <p className="quiz-hint">已完成 {report.matched} / {report.total} 题答对</p>
      {report.details?.length > 0 && (
        <ul className="quiz-report-list">
          {report.details.map((d) => (
            <li key={d.id} className={`quiz-report-item${d.matched ? ' matched' : ''}`}>
              <strong>{d.authorNickname}：</strong>{d.question}
              <span>{d.matched ? ' ✓ 默契' : ' ✗ 未中'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function QuizGame() {
  const [mode, setMode] = useState('create')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div>
      <div className="tab-bar quiz-sub-tabs">
        <button type="button" className={`tab-btn${mode === 'create' ? ' active' : ''}`} onClick={() => setMode('create')}>
          给 TA 出题
        </button>
        <button type="button" className={`tab-btn${mode === 'answer' ? ' active' : ''}`} onClick={() => setMode('answer')}>
          回答 TA 的题
        </button>
        <button type="button" className={`tab-btn${mode === 'report' ? ' active' : ''}`} onClick={() => setMode('report')}>
          默契报告
        </button>
      </div>
      {mode === 'create' && (
        <QuizCreateForm onCreated={() => setRefreshKey((k) => k + 1)} key={refreshKey} />
      )}
      {mode === 'answer' && <QuizAnswerPanel key={`answer-${refreshKey}`} />}
      {mode === 'report' && <QuizReportPanel key={`report-${refreshKey}`} />}
    </div>
  )
}

export default function Games() {
  const [tab, setTab] = useState('heart')

  return (
    <Layout>
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
        恋爱互动小游戏
      </h2>

      <div className="tab-bar" style={{ justifyContent: 'center' }}>
        <button className={`tab-btn${tab === 'heart' ? ' active' : ''}`} onClick={() => setTab('heart')}>爱心点击</button>
        <button className={`tab-btn${tab === 'quiz' ? ' active' : ''}`} onClick={() => setTab('quiz')}>默契问答</button>
        <button className={`tab-btn${tab === 'gomoku' ? ' active' : ''}`} onClick={() => setTab('gomoku')}>五子棋对决</button>
      </div>

      <div className="card">
        {tab === 'heart' && <HeartGame />}
        {tab === 'quiz' && <QuizGame />}
        {tab === 'gomoku' && <GomokuGame />}
      </div>
    </Layout>
  )
}
