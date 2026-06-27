import { useRef, useState, useCallback, useId } from 'react'

function HeartSvg({ className, prefix }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`${prefix}-grad`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffb3c6" />
          <stop offset="35%" stopColor="#ff4d7a" />
          <stop offset="75%" stopColor="#e8195a" />
          <stop offset="100%" stopColor="#9b0a32" />
        </radialGradient>
        <linearGradient id={`${prefix}-shine`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${prefix}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M50 88 C20 62 2 42 2 26 C2 12 14 2 28 2 C38 2 46 8 50 16 C54 8 62 2 72 2 C86 2 98 12 98 26 C98 42 80 62 50 88Z"
        fill={`url(#${prefix}-grad)`}
        filter={`url(#${prefix}-glow)`}
      />
      <ellipse cx="32" cy="28" rx="14" ry="10" fill={`url(#${prefix}-shine)`} opacity="0.55" />
    </svg>
  )
}

export default function Heart3D({ onClick }) {
  const uid = useId().replace(/:/g, '')
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [punch, setPunch] = useState(false)
  const [particles, setParticles] = useState([])
  const wrapRef = useRef(null)

  const handleMove = useCallback((e) => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -18, y: px * 18 })
  }, [])

  const handleLeave = useCallback(() => setTilt({ x: 0, y: 0 }), [])

  const handleClick = useCallback(() => {
    setPunch(true)
    setTimeout(() => setPunch(false), 320)

    const burst = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / 8) * i + Math.random() * 20,
      dist: 50 + Math.random() * 40,
      scale: 0.4 + Math.random() * 0.5,
    }))
    setParticles((prev) => [...prev.slice(-16), ...burst])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !burst.find((b) => b.id === p.id)))
    }, 900)

    onClick?.()
  }, [onClick])

  return (
    <div className="heart-3d-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`heart-3d-btn${punch ? ' punch' : ''}`}
        onClick={handleClick}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        aria-label="点击爱心"
      >
        <div
          className="heart-3d-tilt"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="heart-3d-scene">
            <div className="heart-3d-shadow" />
            <div className="heart-3d-layer heart-3d-back">
              <HeartSvg prefix={`${uid}-back`} />
            </div>
            <div className="heart-3d-layer heart-3d-mid">
              <HeartSvg prefix={`${uid}-mid`} />
            </div>
            <div className="heart-3d-layer heart-3d-front">
              <HeartSvg prefix={`${uid}-front`} />
            </div>
            <div className="heart-3d-aura" />
          </div>
        </div>
      </button>

      <div className="heart-3d-particles" aria-hidden>
        {particles.map((p) => (
          <span
            key={p.id}
            className="heart-3d-particle"
            style={{
              '--angle': `${p.angle}deg`,
              '--dist': `${p.dist}px`,
              '--scale': p.scale,
            }}
          >
            ♥
          </span>
        ))}
      </div>
    </div>
  )
}
