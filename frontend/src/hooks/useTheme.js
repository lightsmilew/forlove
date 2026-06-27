import { useEffect, useState } from 'react'

export function useDarkMode() {
  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours()
      const isNight = hour >= 19 || hour < 6
      document.documentElement.setAttribute('data-theme', isNight ? 'dark' : 'light')
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
  }, [])
}

export function useTypewriter(texts, speed = 80, pause = 2500) {
  const [display, setDisplay] = useState('')
  const [index, setIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!texts || texts.length === 0) return
    const current = texts[index % texts.length]

    const timer = setTimeout(() => {
      if (!deleting) {
        if (charIndex < current.length) {
          setDisplay(current.slice(0, charIndex + 1))
          setCharIndex(c => c + 1)
        } else {
          setTimeout(() => setDeleting(true), pause)
        }
      } else {
        if (charIndex > 0) {
          setDisplay(current.slice(0, charIndex - 1))
          setCharIndex(c => c - 1)
        } else {
          setDeleting(false)
          setIndex(i => (i + 1) % texts.length)
        }
      }
    }, deleting ? speed / 2 : speed)

    return () => clearTimeout(timer)
  }, [texts, index, charIndex, deleting, speed, pause])

  return display
}
