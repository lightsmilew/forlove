import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuth } from './AuthContext'
import { api } from '../api'

const RealtimeContext = createContext(null)

function buildWsUrl(token) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`
}

export function RealtimeProvider({ children }) {
  const { user, isLoggedIn } = useAuth()
  const [presence, setPresence] = useState([])
  const clientRef = useRef(null)
  const gomokuListenersRef = useRef(new Set())

  const notifyGomoku = useCallback((payload) => {
    gomokuListenersRef.current.forEach((fn) => fn(payload))
  }, [])

  const subscribeGomoku = useCallback((listener) => {
    gomokuListenersRef.current.add(listener)
    return () => gomokuListenersRef.current.delete(listener)
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !user?.token) {
      setPresence([])
      return undefined
    }

    let heartbeatTimer
    let disposed = false

    const refreshPresence = () => {
      api.presenceHeartbeat()
        .then((data) => { if (!disposed) setPresence(data.users || []) })
        .catch(() => {
          api.getPresence()
            .then((data) => { if (!disposed) setPresence(data.users || []) })
            .catch(() => {})
        })
    }

    refreshPresence()
    heartbeatTimer = setInterval(refreshPresence, 20000)

    const client = new Client({
      brokerURL: buildWsUrl(user.token),
      reconnectDelay: 4000,
      onConnect: () => {
        refreshPresence()
        client.subscribe('/topic/presence', (msg) => {
          try {
            const data = JSON.parse(msg.body)
            setPresence(data.users || [])
          } catch {
            /* ignore */
          }
        })
        client.subscribe('/user/queue/gomoku', (msg) => {
          try {
            notifyGomoku(JSON.parse(msg.body))
          } catch {
            /* ignore */
          }
        })
      },
    })

    clientRef.current = client
    client.activate()

    return () => {
      disposed = true
      clearInterval(heartbeatTimer)
      client.deactivate()
      clientRef.current = null
    }
  }, [isLoggedIn, user?.token, notifyGomoku])

  return (
    <RealtimeContext.Provider value={{ presence, subscribeGomoku }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  return useContext(RealtimeContext)
}
