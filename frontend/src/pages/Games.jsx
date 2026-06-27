import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import Heart3D from '../components/Heart3D'
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

const QUIZ_QUESTIONS = [
  { q: 'TA 最喜欢的季节是？', options: ['春天 🌸', '夏天 ☀️', '秋天 🍂', '冬天 ❄️'], answer: 0 },
  { q: '约会时 TA 更喜欢的活动？', options: ['看电影', '逛校园', '吃美食', '一起打游戏'], answer: 1 },
  { q: 'TA 的理想周末是？', options: ['宅家休息', '户外探险', '学习充电', '和你在武大看樱花'], answer: 3 },
  { q: 'TA 觉得最浪漫的事是？', options: ['惊喜礼物', '手写情书', '一起做饭', '樱花树下的约定'], answer: 3 },
  { q: 'TA 最爱的饮料？', options: ['奶茶', '咖啡', '果汁', '白开水'], answer: 0 },
]

const MEMORY_EMOJIS = ['💕', '🌸', '💑', '🎀', '💖', '✨', '💕', '🌸', '💑', '🎀', '💖', '✨']

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
      {message && (
        <div className="heart-message-card">{message}</div>
      )}
      <div className="heart-float-layer">
        {floats.map((h) => (
          <span
            key={h.id}
            className="heart-float-score"
            style={{ left: `calc(50% + ${h.x}px)` }}
          >
            +1
          </span>
        ))}
      </div>
    </div>
  )
}

function QuizGame() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState(null)

  const selectAnswer = (idx) => {
    const newAnswers = [...answers, idx]
    setAnswers(newAnswers)
    if (current < QUIZ_QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      let correct = 0
      QUIZ_QUESTIONS.forEach((q, i) => { if (newAnswers[i] === q.answer) correct++ })
      const pct = Math.round((correct / QUIZ_QUESTIONS.length) * 100)
      setFinished(true)
      setResult(pct)
      api.saveGameScore('quiz', pct, JSON.stringify({ match: correct, total: QUIZ_QUESTIONS.length }))
        .catch(() => {})
    }
  }

  if (finished) {
    return (
      <div className="game-area">
        <div className="game-score-display">默契值 {result}%</div>
        <p style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>
          {result >= 80 ? '心有灵犀，天生一对！' : result >= 60 ? '默契不错，继续了解彼此~' : '多玩几局，默契会越来越高！'}
        </p>
        <button className="btn btn-primary" onClick={() => { setCurrent(0); setAnswers([]); setFinished(false) }}>
          再来一次
        </button>
      </div>
    )
  }

  const q = QUIZ_QUESTIONS[current]
  return (
    <div>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        第 {current + 1} / {QUIZ_QUESTIONS.length} 题
      </p>
      <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{q.q}</h3>
      {q.options.map((opt, i) => (
        <button key={i} className="quiz-option" onClick={() => selectAnswer(i)}>{opt}</button>
      ))}
    </div>
  )
}

function MemoryGame() {
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [matched, setMatched] = useState([])
  const [lock, setLock] = useState(false)

  const init = useCallback(() => {
    const emojis = MEMORY_EMOJIS.slice(0, 12)
    const shuffled = [...emojis, ...emojis].sort(() => Math.random() - 0.5)
    setCards(shuffled.map((e, i) => ({ id: i, emoji: e })))
    setFlipped([])
    setMatched([])
  }, [])

  useEffect(() => { init() }, [init])

  const clickCard = (id) => {
    if (lock || flipped.includes(id) || matched.includes(id)) return
    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLock(true)
      const [a, b] = newFlipped
      if (cards[a].emoji === cards[b].emoji) {
        setMatched(m => [...m, a, b])
        setFlipped([])
        setLock(false)
        if (matched.length + 2 === cards.length) {
          api.saveGameScore('memory', cards.length / 2).catch(() => {})
        }
      } else {
        setTimeout(() => { setFlipped([]); setLock(false) }, 800)
      }
    }
  }

  return (
    <div>
      <div className="memory-grid">
        {cards.map(c => (
          <div
            key={c.id}
            className={`memory-card${flipped.includes(c.id) || matched.includes(c.id) ? ' flipped' : ''}${matched.includes(c.id) ? ' matched' : ''}`}
            onClick={() => clickCard(c.id)}
          >
            {flipped.includes(c.id) || matched.includes(c.id) ? c.emoji : '?'}
          </div>
        ))}
      </div>
      {matched.length === cards.length && cards.length > 0 && (
        <p style={{ textAlign: 'center', color: 'var(--accent)', marginTop: '1rem' }}>全部配对成功！</p>
      )}
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={init}>重新开始</button>
      </div>
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
        <button className={`tab-btn${tab === 'memory' ? ' active' : ''}`} onClick={() => setTab('memory')}>翻牌配对</button>
      </div>

      <div className="card">
        {tab === 'heart' && <HeartGame />}
        {tab === 'quiz' && <QuizGame />}
        {tab === 'memory' && <MemoryGame />}
      </div>
    </Layout>
  )
}
