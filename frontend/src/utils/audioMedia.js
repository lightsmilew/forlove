export function resolveUploadUrl(url) {
  if (!url) return url
  if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return url.startsWith('/') ? url : `/${url}`
}

export function guessAudioMime(url) {
  if (!url) return ''
  const lower = url.toLowerCase()
  if (lower.includes('.m4a') || lower.includes('.mp4')) return 'audio/mp4'
  if (lower.includes('.webm')) return 'audio/webm'
  if (lower.includes('.ogg')) return 'audio/ogg'
  if (lower.includes('.mp3')) return 'audio/mpeg'
  if (lower.includes('.wav')) return 'audio/wav'
  if (lower.includes('.aac')) return 'audio/aac'
  return 'audio/mp4'
}

export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isWebmSource(src) {
  return /\.webm(\?|$)/i.test(src || '')
}
