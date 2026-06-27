import { useEffect, useCallback } from 'react'

function fileNameFromUrl(url, fallback = 'photo.jpg') {
  try {
    const name = url.split('/').pop()?.split('?')[0]
    return name && name.includes('.') ? name : fallback
  } catch {
    return fallback
  }
}

async function downloadImage(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('download failed')
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export default function PhotoLightbox({ src, alt, downloadName, onClose }) {
  const handleDownload = useCallback(async () => {
    const name = downloadName || fileNameFromUrl(src)
    try {
      await downloadImage(src, name)
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer')
    }
  }, [src, downloadName])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      className="photo-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="查看大图"
      onClick={onClose}
    >
      <div className="photo-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="photo-lightbox-btn" onClick={handleDownload}>
          下载
        </button>
        <button type="button" className="photo-lightbox-btn photo-lightbox-close" onClick={onClose}>
          关闭
        </button>
      </div>
      <img
        src={src}
        alt={alt}
        className="photo-lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
