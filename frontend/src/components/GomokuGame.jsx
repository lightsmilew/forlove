import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useRealtime } from '../context/RealtimeContext'

const BOARD_SIZE = 15

function stoneClass(cell) {
  if (cell === 1) return 'black'
  if (cell === 2) return 'white'
  return ''
}

function adaptGame(game, username) {
  if (!game || !username) return game
  return {
    ...game,
    isMyTurn: game.status === 'ACTIVE' && game.currentTurn === username,
    myColor: game.blackPlayer === username ? 'black'
      : game.whitePlayer === username ? 'white' : game.myColor,
  }
}

export default function GomokuGame() {
  const { user } = useAuth()
  const { subscribeGomoku } = useRealtime() || {}
  const [game, setGame] = useState(null)
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [currentRes, pending] = await Promise.all([
        api.getCurrentGomoku().catch(() => ({ game: null })),
        api.getPendingGomokuInvites().catch(() => []),
      ])
      setGame(adaptGame(currentRes?.game || null, user?.username))
      setPendingInvites(Array.isArray(pending) ? pending : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.username])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!subscribeGomoku) return undefined
    return subscribeGomoku((payload) => {
      const nextGame = payload?.game
      if (!nextGame) return

      if (payload.type === 'invite' && nextGame.inviter !== user?.username) {
        setPendingInvites((prev) => {
          const exists = prev.some((g) => g.id === nextGame.id)
          return exists ? prev : [nextGame, ...prev]
        })
        setNotice(`${nextGame.inviterNickname} 邀请你进行五子棋对决`)
      } else if (payload.type === 'declined' && nextGame.inviter === user?.username) {
        setNotice(`${nextGame.whiteNickname === user?.nickname ? nextGame.blackNickname : nextGame.whiteNickname} 拒绝了对决邀请`)
        setGame(null)
        refresh()
      } else {
        setGame(adaptGame(nextGame, user?.username))
        if (payload.type === 'start') {
          setNotice('对局开始，黑棋先行')
        } else if (payload.type === 'move' && nextGame.status === 'FINISHED') {
          setNotice(`${nextGame.winnerNickname} 获胜！`)
        } else if (payload.type === 'resign') {
          setNotice(`${nextGame.winnerNickname} 获胜（对方认输）`)
        }
        setPendingInvites((prev) => prev.filter((g) => g.id !== nextGame.id))
      }
    })
  }, [subscribeGomoku, user?.username, user?.nickname, refresh])

  const invite = async () => {
    setActionLoading(true)
    setError('')
    setNotice('')
    try {
      const created = await api.inviteGomoku()
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
      const started = await api.acceptGomoku(id)
      setGame(adaptGame(started, user?.username))
      setPendingInvites((prev) => prev.filter((g) => g.id !== id))
      setNotice('对局开始，黑棋先行')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const declineInvite = async (id) => {
    setActionLoading(true)
    setError('')
    try {
      await api.declineGomoku(id)
      setPendingInvites((prev) => prev.filter((g) => g.id !== id))
      setNotice('已拒绝对决邀请')
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const placeStone = async (x, y) => {
    if (!game || game.status !== 'ACTIVE' || !game.isMyTurn) return
    setActionLoading(true)
    setError('')
    try {
      const updated = await api.moveGomoku(game.id, x, y)
      setGame(adaptGame(updated, user?.username))
      if (updated.status === 'FINISHED') {
        setNotice(`${updated.winnerNickname} 获胜！`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const resign = async () => {
    if (!game || game.status !== 'ACTIVE') return
    if (!window.confirm('确定要认输吗？')) return
    setActionLoading(true)
    setError('')
    try {
      const updated = await api.resignGomoku(game.id)
      setGame(adaptGame(updated, user?.username))
      setNotice(`${updated.winnerNickname} 获胜（对方认输）`)
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <p className="quiz-hint">加载中...</p>
  }

  const showBoard = game && (game.status === 'ACTIVE' || game.status === 'FINISHED')
  const waitingAccept = game?.status === 'PENDING' && game.inviter === user?.username

  return (
    <div className="gomoku-wrap">
      {pendingInvites.length > 0 && (
        <div className="gomoku-invite-banner">
          {pendingInvites.map((inviteItem) => (
            <div key={inviteItem.id} className="gomoku-invite-card">
              <p>{inviteItem.inviterNickname} 邀请你进行五子棋对决</p>
              <div className="gomoku-invite-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  onClick={() => acceptInvite(inviteItem.id)}
                >
                  接受
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={actionLoading}
                  onClick={() => declineInvite(inviteItem.id)}
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!game && pendingInvites.length === 0 && (
        <div className="gomoku-idle">
          <p className="quiz-hint">与 TA 实时对战五子棋，先连成五子的一方获胜。</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={actionLoading}
            onClick={invite}
          >
            {actionLoading ? '发送中...' : '邀请 TA 对决'}
          </button>
        </div>
      )}

      {waitingAccept && (
        <div className="gomoku-waiting">
          <p className="quiz-hint">已邀请 TA，等待对方接受对决...</p>
        </div>
      )}

      {showBoard && (
        <>
          <div className="gomoku-meta">
            <span className="gomoku-player black">● {game.blackNickname}</span>
            <span className="gomoku-vs">VS</span>
            <span className="gomoku-player white">○ {game.whiteNickname}</span>
          </div>
          <p className="gomoku-turn">
            {game.status === 'FINISHED'
              ? `${game.winnerNickname} 获胜`
              : game.isMyTurn
                ? '轮到你下棋'
                : `等待 ${game.currentTurnNickname} 下棋`}
          </p>
          <div className="gomoku-board-wrap">
            <div className="gomoku-board">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
                const x = Math.floor(idx / BOARD_SIZE)
                const y = idx % BOARD_SIZE
                const cell = game.board?.[x]?.[y] ?? 0
                const canPlay = game.status === 'ACTIVE' && game.isMyTurn && cell === 0
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`gomoku-cell${canPlay ? ' playable' : ''}`}
                    disabled={!canPlay || actionLoading}
                    onClick={() => placeStone(x, y)}
                    aria-label={`${x + 1}行${y + 1}列`}
                  >
                    {cell !== 0 && <span className={`gomoku-stone ${stoneClass(cell)}`} />}
                  </button>
                )
              })}
            </div>
          </div>
          {game.status === 'ACTIVE' && (
            <div className="gomoku-actions">
              <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={resign}>
                认输
              </button>
            </div>
          )}
          {game.status === 'FINISHED' && (
            <div className="gomoku-actions">
              <button type="button" className="btn btn-primary" onClick={() => { setGame(null); setNotice(''); refresh() }}>
                再来一局
              </button>
            </div>
          )}
        </>
      )}

      {notice && <p className="gomoku-notice">{notice}</p>}
      {error && <p className="error-msg">{error}</p>}
    </div>
  )
}
