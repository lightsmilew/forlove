import { useRealtime } from '../context/RealtimeContext'
import { useAuth } from '../context/AuthContext'

export default function OnlineStatus() {
  const { presence } = useRealtime() || {}
  const { user } = useAuth()

  if (!presence?.length) return null

  return (
    <div className="online-status">
      {presence.map((item) => (
        <span
          key={item.username}
          className={`online-status-item${item.online ? ' online' : ''}${item.username === user?.username ? ' me' : ''}`}
        >
          <span className="online-dot" aria-hidden />
          {item.nickname}
          {item.username === user?.username ? '（我）' : ''}
        </span>
      ))}
    </div>
  )
}
