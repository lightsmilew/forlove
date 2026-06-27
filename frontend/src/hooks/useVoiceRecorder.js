import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 60

function isSecureRecordingContext() {
  return typeof window !== 'undefined' && window.isSecureContext
}

/** 兼容旧版 iOS Safari 的 mediaDevices / getUserMedia */
function ensureMediaDevices() {
  if (typeof navigator === 'undefined') return false
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {}
  }
  if (!navigator.mediaDevices.getUserMedia) {
    const legacy = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    if (!legacy) return false
    navigator.mediaDevices.getUserMedia = (constraints) =>
      new Promise((resolve, reject) => {
        legacy.call(navigator, constraints, resolve, reject)
      })
  }
  return true
}

function isMimeSupported(mime) {
  if (typeof MediaRecorder === 'undefined') return false
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    return MediaRecorder.isTypeSupported(mime)
  }
  return mime.startsWith('audio/mp4') || mime.startsWith('video/mp4')
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  const types = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ]
  for (const t of types) {
    if (isMimeSupported(t)) return t
  }
  return 'DEFAULT'
}

function createMediaRecorder(stream, mime) {
  if (mime && mime !== 'DEFAULT') {
    try {
      return new MediaRecorder(stream, { mimeType: mime })
    } catch {
      // fall through
    }
  }
  return new MediaRecorder(stream)
}

function extFromMime(mime) {
  if (!mime) return 'webm'
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('m4a')) return '.m4a'
  if (mime.includes('ogg')) return '.ogg'
  if (mime.includes('mpeg') || mime.includes('mp3')) return '.mp3'
  return '.webm'
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export { formatDuration, ensureMediaDevices, isSecureRecordingContext }

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [blob, setBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState('')
  const [mimeType, setMimeType] = useState('')

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(0)
  const mimeRef = useRef('')

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const clearRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stopStream()
    setRecording(false)
    setDuration(0)
    setBlob(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setError('')
    mimeRef.current = ''
  }, [stopStream])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = useCallback(async () => {
    setError('')
    clearRecording()

    if (!isSecureRecordingContext()) {
      setError('录音需要在 HTTPS 安全连接下使用，请用手机浏览器通过 https 地址访问')
      return
    }

    if (!ensureMediaDevices()) {
      setError('当前浏览器不支持录音，请使用 Safari 或 Chrome 最新版')
      return
    }

    const mime = pickMimeType()
    if (mime === null) {
      setError('当前浏览器不支持语音录制')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = createMediaRecorder(stream, mime)
      mediaRecorderRef.current = recorder
      const actualMime = recorder.mimeType || (mime === 'DEFAULT' ? 'audio/mp4' : mime)
      mimeRef.current = actualMime
      setMimeType(actualMime)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        stopStream()
        setRecording(false)

        const type = mimeRef.current || actualMime
        const recorded = new Blob(chunksRef.current, { type })
        if (recorded.size === 0) {
          setError('未录到声音，请重试')
          return
        }
        const url = URL.createObjectURL(recorded)
        setBlob(recorded)
        setPreviewUrl(url)
        const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        setDuration(elapsed)
      }

      recorder.onerror = () => {
        setError('录音失败，请重试')
        clearRecording()
      }

      startTimeRef.current = Date.now()
      recorder.start(200)
      setRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setDuration(sec)
        if (sec >= MAX_SECONDS) {
          stopRecording()
        }
      }, 250)
    } catch (err) {
      stopStream()
      const name = err?.name || ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError('麦克风权限被拒绝，请在浏览器设置中允许访问')
      } else if (name === 'NotFoundError') {
        setError('未检测到麦克风设备')
      } else {
        setError('无法访问麦克风，请检查权限')
      }
    }
  }, [clearRecording, stopRecording, stopStream])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    stopStream()
  }, [stopStream])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const getFile = useCallback(() => {
    if (!blob) return null
    const ext = extFromMime(mimeType || blob.type)
    return new File([blob], `voice${ext}`, { type: mimeType || blob.type })
  }, [blob, mimeType])

  return {
    recording,
    duration,
    blob,
    previewUrl,
    error,
    mimeType,
    maxSeconds: MAX_SECONDS,
    startRecording,
    stopRecording,
    clearRecording,
    getFile,
  }
}
