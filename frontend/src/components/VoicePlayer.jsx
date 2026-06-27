import { useRef, useState, useEffect, useCallback } from 'react'
import { formatDuration } from '../hooks/useVoiceRecorder'
import {
  resolveUploadUrl,
  isIOSDevice,
  isWebmSource,
} from '../utils/audioMedia'

function isAtEnd(audio) {
  if (!audio) return false
  if (audio.ended) return true
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    return audio.currentTime >= audio.duration - 0.15
  }
  return false
}

/** 在用户点击回调内同步发起 play（iOS 必须在手势里调用 play） */
function playFromGesture(audio) {
  audio.pause()
  if (isAtEnd(audio)) {
    const url = audio.currentSrc || audio.src
    audio.src = url
    audio.load()
  }
  audio.currentTime = 0
  return audio.play()
}

export default function VoicePlayer({ src, duration: initialDuration = 0, className = '' }) {
  const audioRef = useRef(null)
  const resolvedSrc = resolveUploadUrl(src)

  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(initialDuration)
  const [playError, setPlayError] = useState('')

  const iosWebmBlocked = isIOSDevice() && isWebmSource(resolvedSrc)

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(initialDuration || 0)
    setPlayError('')
  }, [src, initialDuration, resolvedSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || iosWebmBlocked) return undefined

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration))
      }
    }

    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
    }

    const onPlay = () => {
      setPlayError('')
      setPlaying(true)
    }

    const onPause = () => {
      setPlaying(false)
    }

    const onError = () => {
      setPlaying(false)
      setPlayError(
        isIOSDevice()
          ? '无法播放该语音（iPhone 不支持 webm，请让对方重新发送）'
          : '无法播放该语音'
      )
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
    }
  }, [resolvedSrc, iosWebmBlocked])

  // 手机端 timeupdate 不可靠，播放中用定时器刷新进度
  useEffect(() => {
    if (!playing) return undefined
    const tick = () => {
      const audio = audioRef.current
      if (!audio || audio.paused) return
      if (audio.ended) {
        setPlaying(false)
        setCurrent(0)
        return
      }
      setCurrent(Math.floor(audio.currentTime))
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [playing])

  const toggle = useCallback(() => {
    if (iosWebmBlocked) return
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
      return
    }

    setPlayError('')

    const atEnd = isAtEnd(audio)
    if (atEnd) {
      setCurrent(0)
    }

    const playPromise = atEnd ? playFromGesture(audio) : audio.play()

    playPromise.catch(() => {
      setPlayError(
        isIOSDevice()
          ? '播放失败，请再点一次'
          : '无法播放该语音'
      )
      setPlaying(false)
      setCurrent(0)
    })
  }, [iosWebmBlocked])

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !audio.duration || iosWebmBlocked) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
    setCurrent(Math.floor(audio.currentTime))
  }

  const total = duration || 0
  const displayCurrent = !playing && isAtEnd(audioRef.current) ? 0 : current
  const progress = total > 0 ? Math.min(100, (displayCurrent / total) * 100) : 0

  if (iosWebmBlocked) {
    return (
      <div className={`voice-player voice-player-blocked${className ? ` ${className}` : ''}`}>
        <span className="voice-player-error">
          该语音为 Android 录制格式，iPhone 无法播放，请让对方用 iPhone 重新发送
        </span>
      </div>
    )
  }

  return (
    <div className={`voice-player${className ? ` ${className}` : ''}`}>
      <audio ref={audioRef} preload="auto" playsInline src={resolvedSrc} />
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
