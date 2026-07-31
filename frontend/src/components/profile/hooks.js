// ============================================
// Small reusable hooks for the Profile page
// ============================================
import { useState, useEffect, useRef } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Animate a number from 0 → target (a simple "count up" effect for the cards).
export function useCountUp(target = 0, duration = 1000) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    const end = Number(target) || 0
    if (prefersReducedMotion()) { setValue(end); return }

    let startTs = null
    const step = (ts) => {
      if (startTs === null) startTs = ts
      const p = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setValue(end * eased)
      if (p < 1) raf.current = requestAnimationFrame(step)
      else setValue(end)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return value
}

// A useState that also saves to localStorage (used for the editable fields).
export function useLocalStorageState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initial
    } catch {
      return initial
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
  }, [key, value])
  return [value, setValue]
}
