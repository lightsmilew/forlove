import { useEffect, useRef } from 'react'

export default function SakuraCanvas({ mode = 'sakura' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() {
        this.reset()
        this.y = Math.random() * canvas.height
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = -10
        this.size = Math.random() * 6 + 4
        this.speedY = Math.random() * 1.5 + 0.5
        this.speedX = Math.random() * 1 - 0.5
        this.rotation = Math.random() * 360
        this.rotationSpeed = Math.random() * 2 - 1
        this.opacity = Math.random() * 0.5 + 0.3
      }
      update() {
        this.y += this.speedY
        this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5
        this.rotation += this.rotationSpeed
        if (this.y > canvas.height + 10) this.reset()
      }
      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate((this.rotation * Math.PI) / 180)
        ctx.globalAlpha = this.opacity

        if (mode === 'snow') {
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = '#ffb7c5'
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const angle = (i * 72 * Math.PI) / 180
            const x = Math.cos(angle) * this.size
            const y = Math.sin(angle) * this.size
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
        }
        ctx.restore()
      }
    }

    const count = mode === 'snow' ? 80 : 50
    particles = Array.from({ length: count }, () => new Particle())

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [mode])

  return <canvas ref={canvasRef} className="particle-canvas" />
}
