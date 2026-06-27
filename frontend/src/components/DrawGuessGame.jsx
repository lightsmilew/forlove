import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'

const CANVAS_SIZE = 1000
const DEFAULT_COLOR = '#333333'
const STROKE_WIDTH = 4
const ERASER_WIDTH = 20

const BRUSH_COLORS = [
  { id: 'black', value: '#333333', label: '黑色' },
  { id: 'pink', value: '#e54578', label: '粉色' },
  { id: 'red', value: '#e74c3c', label: '红色' },
  { id: 'orange', value: '#f39c12', label: '橙色' },
  { id: 'green', value: '#27ae60', label: '绿色' },
  { id: 'blue', value: '#3498db', label: '蓝色' },
  { id: 'purple', value: '#9b59b6', label: '紫色' },
]

function adaptGame(game, username) {
  if (!game || !username) return game
  return {
    ...game,
    isDrawer: game.drawer === username,
    isGuesser: game.guesser === username,
  }
}

function isEraserStroke(stroke) {
  if (!stroke) return false
  if (stroke.mode === 'eraser') return true
  if (stroke.eraser === true) return true
  if (stroke.color === 'eraser') return true
  return false
}

function normalizeStrokes(strokes) {
  return (strokes || []).map((stroke) => ({
    ...stroke,
    mode: isEraserStroke(stroke) ? 'eraser' : 'brush',
    eraser: isEraserStroke(stroke),
  }))
}

function strokeWidth(stroke) {
  return stroke.width || (isEraserStroke(stroke) ? ERASER_WIDTH : STROKE_WIDTH)
}

function drawStroke(ctx, stroke, w, h) {
  const points = stroke.points || []
  if (points.length < 2) return
  const eraser = isEraserStroke(stroke)
  ctx.save()
  ctx.lineWidth = strokeWidth(stroke) * (w / CANVAS_SIZE)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (eraser) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color || DEFAULT_COLOR
  }
  ctx.beginPath()
  ctx.moveTo((points[0][0] / CANVAS_SIZE) * w, (points[0][1] / CANVAS_SIZE) * h)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo((points[i][0] / CANVAS_SIZE) * w, (points[i][1] / CANVAS_SIZE) * h)
  }
  ctx.stroke()
  ctx.restore()
}

function drawSegment(ctx, prev, curr, w, h, tool) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = (tool.eraser ? ERASER_WIDTH : STROKE_WIDTH) * (w / CANVAS_SIZE)
  if (tool.eraser) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = tool.color
  }
  ctx.beginPath()
  ctx.moveTo((prev[0] / CANVAS_SIZE) * w, (prev[1] / CANVAS_SIZE) * h)
  ctx.lineTo((curr[0] / CANVAS_SIZE) * w, (curr[1] / CANVAS_SIZE) * h)
  ctx.stroke()
  ctx.restore()
}

function redrawCanvas(canvas, strokes) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  normalizeStrokes(strokes).forEach((s) => drawStroke(ctx, s, w, h))
}

function canvasPoint(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * CANVAS_SIZE
  const y = ((clientY - rect.top) / rect.height) * CANVAS_SIZE
  return [Math.max(0, Math.min(CANVAS_SIZE, x)), Math.max(0, Math.min(CANVAS_SIZE, y))]
}

export default function DrawGuessGame() {
  const { user } = useAuth()
  const { subscribeDrawGuess } = useRealtime() || {}
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const currentPointsRef = useRef([])
  const strokesRef = useRef([])
  const toolRef = useRef({ color: DEFAULT_COLOR, eraser: false })

  const [game, setGame] = useState(null)
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [guess, setGuess] = useState('')
  const [brushColor, setBrushColor] = useState(DEFAULT_COLOR)
  const [eraserMode, setEraserMode] = useState(false)

  useEffect(() => {
    toolRef.current = { color: brushColor, eraser: eraserMode }
  }, [brushColor, eraserMode])

  const syncStrokes = useCallback((strokes) => {
    strokesRef.current = normalizeStrokes(strokes)
    redrawCanvas(canvasRef.current, strokesRef.current)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [currentRes, pending] = await Promise.all([
        api.getCurrentDrawGuess().catch(() => ({ game: null })),
        api.getPendingDrawGuessInvites().catch(() => []),
      ])
      const g = adaptGame(currentRes?.game || null, user?.username)
      setGame(g)
      if (g?.strokes) syncStrokes(g.strokes)
      setPendingInvites(Array.isArray(pending) ? pending : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.username, syncStrokes])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!subscribeDrawGuess) return undefined
    return subscribeDrawGuess((payload) => {
      const nextGame = payload?.game
      if (!nextGame) return

      if (payload.type === 'invite' && nextGame.inviter !== user?.username) {
        setPendingInvites((prev) => {
          const exists = prev.some((g) => g.id === nextGame.id)
          return exists ? prev : [nextGame, ...prev]
        })
        setNotice(`${nextGame.inviterNickname} 邀请你玩你画我猜`)
      } else if (payload.type === 'declined' && nextGame.inviter === user?.username) {
        setNotice('对方拒绝了邀请')
        setGame(null)
        syncStrokes([])
        refresh()
      } else {
        const adapted = adaptGame(nextGame, user?.username)
        setGame(adapted)
        if (payload.type === 'stroke') {
          syncStrokes(adapted.strokes || [])
        } else if (payload.type === 'clear' || payload.type === 'round_start' || payload.type === 'start') {
          syncStrokes(adapted.strokes || [])
          setGuess('')
        } else if (payload.type === 'correct' || payload.type === 'skip' || payload.type === 'wrong') {
          if (adapted.strokes) syncStrokes(adapted.strokes)
          if (payload.type === 'correct') setNotice('猜对了！')
          if (payload.type === 'wrong') setNotice('猜错了，继续~')
        } else if (payload.type === 'finished' || payload.type === 'forfeit') {
          syncStrokes(adapted.strokes || [])
        }
        if (adapted.lastMessage) setNotice(adapted.lastMessage)
        setPendingInvites((prev) => prev.filter((g) => g.id !== nextGame.id))
      }
    })
  }, [subscribeDrawGuess, user?.username, refresh, syncStrokes])

  useEffect(() => {
    if (game?.strokes) syncStrokes(game.strokes)
  }, [game?.id, game?.roundNumber, game?.strokes, syncStrokes])

  const sendStroke = async (points, tool) => {
    if (!game?.id || points.length < 2) return
    const eraser = !!tool.eraser
    try {
      await api.drawGuessStroke(game.id, {
        points,
        color: eraser ? 'eraser' : tool.color,
        width: eraser ? ERASER_WIDTH : STROKE_WIDTH,
        eraser,
        mode: eraser ? 'eraser' : 'brush',
      })
    } catch {
      /* ignore transient errors */
    }
  }

  const onPointerDown = (e) => {
    if (!game?.isDrawer || game?.status !== 'ACTIVE') return
    e.preventDefault()
    drawingRef.current = true
    const [x, y] = canvasPoint(canvasRef.current, e.clientX, e.clientY)
    currentPointsRef.current = [[x, y]]
    canvasRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!drawingRef.current || !canvasRef.current) return
    e.preventDefault()
    const [x, y] = canvasPoint(canvasRef.current, e.clientX, e.clientY)
    const pts = currentPointsRef.current
    pts.push([x, y])
    if (pts.length >= 2) {
      const ctx = canvasRef.current.getContext('2d')
      const w = canvasRef.current.width
      const h = canvasRef.current.height
      drawSegment(ctx, pts[pts.length - 2], pts[pts.length - 1], w, h, toolRef.current)
    }
  }

  const onPointerUp = async (e) => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const points = [...currentPointsRef.current]
    const tool = { ...toolRef.current }
    currentPointsRef.current = []
    if (points.length >= 2) {
      const eraser = !!tool.eraser
      const stroke = {
        points,
        color: eraser ? 'eraser' : tool.color,
        width: eraser ? ERASER_WIDTH : STROKE_WIDTH,
        eraser,
        mode: eraser ? 'eraser' : 'brush',
      }
      strokesRef.current = [...strokesRef.current, stroke]
      await sendStroke(points, tool)
    }
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const selectColor = (color) => {
    setBrushColor(color)
    setEraserMode(false)
  }

  const invite = async () => {
    setActionLoading(true)
    setError('')
    setNotice('')
    try {
      const created = await api.inviteDrawGuess()
      setGame(adaptGame(created, user?.username))
      setNotice('邀请已发送，等待 TA 接受...')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const acceptInvite = async (id) => {
    setActionLoading(true)
    setError('')
    try {
      const started = await api.acceptDrawGuess(id)
      setGame(adaptGame(started, user?.username))
      syncStrokes(started.strokes || [])
      setPendingInvites((prev) => prev.filter((g) => g.id !== id))
      setNotice(started.lastMessage || '游戏开始！')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const declineInvite = async (id) => {
    setActionLoading(true)
    try {
      await api.declineDrawGuess(id)
      setPendingInvites((prev) => prev.filter((g) => g.id !== id))
      setNotice('已拒绝邀请')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const clearCanvas = async () => {
    if (!game?.id) return
    setActionLoading(true)
    try {
      const updated = await api.clearDrawGuessCanvas(game.id)
      setGame(adaptGame(updated, user?.username))
      syncStrokes([])
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const submitGuess = async (e) => {
    e.preventDefault()
    if (!game?.id || !guess.trim()) return
    setActionLoading(true)
    setError('')
    try {
      const updated = await api.guessDrawGuess(game.id, guess.trim())
      setGame(adaptGame(updated, user?.username))
      setGuess('')
      if (updated.lastMessage) setNotice(updated.lastMessage)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const skipWord = async () => {
    if (!game?.id) return
    setActionLoading(true)
    try {
      const updated = await api.skipDrawGuess(game.id)
      setGame(adaptGame(updated, user?.username))
      syncStrokes(updated.strokes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const forfeit = async () => {
    if (!game?.id) return
    setActionLoading(true)
    try {
      const updated = await api.forfeitDrawGuess(game.id)
      setGame(adaptGame(updated, user?.username))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <p className="quiz-hint">加载中...</p>

  const scoreLine = game?.scores && user?.username
    ? `${game.player1Nickname} ${game.scores[game.player1] || 0} : ${game.scores[game.player2] || 0} ${game.player2Nickname}`
    : ''

  return (
    <div className="drawguess-game">
      <p className="quiz-hint">一人画画，另一人实时猜词。内置情侣专属词库，共 {game?.maxRounds || 6} 轮。</p>

      {pendingInvites.length > 0 && (
        <div className="drawguess-invites">
          {pendingInvites.map((inv) => (
            <div key={inv.id} className="drawguess-invite-card">
              <span>{inv.inviterNickname} 邀请你玩你画我猜</span>
              <div className="drawguess-invite-actions">
                <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => acceptInvite(inv.id)}>接受</button>
                <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={() => declineInvite(inv.id)}>拒绝</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!game && pendingInvites.length === 0 && (
        <div className="game-area">
          <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={invite}>
            {actionLoading ? '发送中...' : '邀请 TA 来玩'}
          </button>
        </div>
      )}

      {game?.status === 'PENDING' && game.inviter === user?.username && (
        <p className="quiz-hint">等待 TA 接受邀请...</p>
      )}

      {game?.status === 'ACTIVE' && (
        <>
          <div className="drawguess-status-bar">
            <span>第 {game.roundNumber}/{game.maxRounds} 轮</span>
            <span>{scoreLine}</span>
            <span>{game.isDrawer ? '你在画画' : `${game.drawerNickname} 在画画`}</span>
          </div>

          {game.isDrawer && game.word && (
            <div className="drawguess-word-card">
              请画出：<strong>{game.word}</strong>
            </div>
          )}

          {game.isGuesser && (
            <div className="drawguess-word-card guesser-hint">
              看 TA 的画，猜是什么词~
            </div>
          )}

          {game.isDrawer && (
            <div className="drawguess-toolbar">
              <div className="drawguess-colors" role="group" aria-label="画笔颜色">
                {BRUSH_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`drawguess-color-btn${!eraserMode && brushColor === c.value ? ' active' : ''}`}
                    style={{ '--swatch': c.value }}
                    aria-label={c.label}
                    aria-pressed={!eraserMode && brushColor === c.value}
                    onClick={() => selectColor(c.value)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={`drawguess-eraser-btn${eraserMode ? ' active' : ''}`}
                aria-pressed={eraserMode}
                onClick={() => setEraserMode(true)}
              >
                橡皮擦
              </button>
            </div>
          )}

          <div className="drawguess-canvas-wrap">
            <canvas
              ref={canvasRef}
              className={`drawguess-canvas${game.isDrawer ? (eraserMode ? ' erasing' : ' drawable') : ''}`}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            />
          </div>

          {game.isDrawer && (
            <div className="drawguess-actions">
              <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={clearCanvas}>清空画布</button>
              <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={skipWord}>换词跳过</button>
            </div>
          )}

          {game.isGuesser && (
            <form className="drawguess-guess-form" onSubmit={submitGuess}>
              <input
                className="form-input"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="输入你的答案..."
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary" disabled={actionLoading || !guess.trim()}>
                提交答案
              </button>
            </form>
          )}

          <button type="button" className="btn btn-secondary drawguess-quit" disabled={actionLoading} onClick={forfeit}>
            退出游戏
          </button>
        </>
      )}

      {game?.status === 'FINISHED' && (
        <div className="game-area">
          <div className="game-score-display">游戏结束</div>
          <p style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{scoreLine}</p>
          <p className="quiz-hint">{game.lastMessage}</p>
          <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={invite}>再来一局</button>
        </div>
      )}

      {notice && <p className="drawguess-notice">{notice}</p>}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}
