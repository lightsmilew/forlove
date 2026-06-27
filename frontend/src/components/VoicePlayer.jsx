import { useRef, useState, useEffect, useCallback } from 'react'
import { formatDuration } from '../hooks/useVoiceRecorder'

function isAtEnd(audio) {
  if (!audio) return false
  if (audio.ended) return true
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.currentTime >= audio.duration - 0.05
  }
  return false
}

export default function VoicePlayer({ src, duration: initialDuration = 0, className = '' }) {
  const audioRef = useRef(null)
  const resettingRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(initialDuration)
  const [playError, setPlayError] = useState('')

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(initialDuration || 0)
    setPlayError('')
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }, [src, initialDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const syncCurrent = () => {
      if (resettingRef.current) return
      if (audio.ended) {
        setCurrent(0)
        return
      }
      setCurrent(Math.floor(audio.currentTime))
    }

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration))
      }
    }

    const onEnded = () => {
      setPlaying(false)
      resettingRef.current = true
      audio.currentTime = 0
      setCurrent(0)
      window.setTimeout(() => {
        resettingRef.current = false
      }, 50)
    }

    const onPlay = () => {
      setPlayError('')
      setPlaying(true)
    }

    const onPause = () => {
      setPlaying(false)
      if (isAtEnd(audio)) {
        audio.currentTime = 0
        setCurrent(0)
      }
    }

    const onError = () => {
      setPlaying(false)
      setPlayError('无法播放该语音（可能为不兼容格式）')
    }

    audio.addEventListener('timeupdate', syncCurrent)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', syncCurrent)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
    }
  }, [src])

  const resetToStart = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    resettingRef.current = true
    audio.pause()
    audio.currentTime = 0
    setCurrent(0)
    setPlaying(false)
    window.setTimeout(() => {
      resettingRef.current = false
    }, 50)
  }, [])

  const toggle = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      return
    }

    if (isAtEnd(audio)) {
      audio.currentTime = 0
      setCurrent(0)
    }

    try {
      await audio.play()
    } catch {
      try {
        audio.load()
        audio.currentTime = 0
        setCurrent(0)
        await audio.play()
      } catch {
        setPlayError('无法播放该语音')
        resetToStart()
      }
    }
  }, [playing, resetToStart])

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setCurrent(Math.floor(audio.currentTime))
  }

  const total = duration || 0
  const displayCurrent = isAtEnd(audioRef.current) && !playing ? 0 : current
  const progress = total > 0 ? Math.min(100, (displayCurrent / total) * 100) : 0

  return (
    <div className={`voice-player${className ? ` ${className}` : ''}`}>
      <audio ref={audioRef} src={src} preload="metadata" playsInline />
      <button
        type="button"
        className={`voice-player-btn${playing ? ' playing' : ''}`}
        onClick={toggle}
        aria-label={playing ? '暂停' : '播放'}
      >
        {playing ? <span className="voice-player-pause" /> : <span className="voice-player-play" />}
      </button>
      <div
        className="voice-player-track"
        onClick={seek}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={displayCurrent}
        aria-label="播放进度"
      >
        <div className="voice-player-fill" style={{ width: `${progress}%` }} />
      </div>
      <span className="voice-player-time">
        {formatDuration(displayCurrent)}{total > 0 ? ` / ${formatDuration(total)}` : ''}
      </span>
      {playError && <span className="voice-player-error">{playError}</span>}
    </div>
  )
}
