import { useEffect, useRef, useState } from 'react'
import { CursorClick } from '@phosphor-icons/react'
import { m, useMotionValue, useSpring } from 'framer-motion'
import './custom-cursor.css'

const ACTIONABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
].join(',')

const addMediaListener = (query, listener) => {
  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }

  query.addListener(listener)
  return () => query.removeListener(listener)
}

const isActionable = (target) => {
  if (!(target instanceof Element)) return false

  const control = target.closest(ACTIONABLE_SELECTOR)

  return Boolean(
    control
    && !control.matches(':disabled')
    && control.getAttribute('aria-disabled') !== 'true',
  )
}

export default function CustomCursor() {
  const pointerX = useMotionValue(-100)
  const pointerY = useMotionValue(-100)
  const x = useSpring(pointerX, { stiffness: 900, damping: 46, mass: 0.18 })
  const y = useSpring(pointerY, { stiffness: 900, damping: 46, mass: 0.18 })
  const hasPosition = useRef(false)

  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [hoveringControl, setHoveringControl] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncCapability = () => {
      setEnabled(pointerQuery.matches && !motionQuery.matches)
    }

    syncCapability()

    const removePointerListener = addMediaListener(pointerQuery, syncCapability)
    const removeMotionListener = addMediaListener(motionQuery, syncCapability)

    return () => {
      removePointerListener()
      removeMotionListener()
    }
  }, [])

  // Only suppress the native cursor while the replacement is actually on screen.
  // Adding the class up-front hid the real cursor before any pointer position was
  // known, so on load — and after every alt-tab — there was no pointer at all until
  // the user happened to move the mouse.
  useEffect(() => {
    const root = document.documentElement
    const active = enabled && visible
    root.classList.toggle('has-tradeguard-cursor', active)
    return () => root.classList.remove('has-tradeguard-cursor')
  }, [enabled, visible])

  useEffect(() => {
    if (!enabled) {
      setVisible(false)
      setHoveringControl(false)
      setPressed(false)
      hasPosition.current = false
      return undefined
    }

    let hitTestFrame = 0
    let pendingTarget = null

    // isActionable() walks a 7-selector closest() chain plus a :disabled match. Run
    // it at most once per frame; the position updates below stay synchronous so the
    // cursor never lags the pointer.
    const scheduleHitTest = (target) => {
      pendingTarget = target
      if (hitTestFrame) return
      hitTestFrame = requestAnimationFrame(() => {
        hitTestFrame = 0
        setHoveringControl(isActionable(pendingTarget))
      })
    }

    const handlePointerMove = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return

      pointerX.set(event.clientX)
      pointerY.set(event.clientY)

      if (!hasPosition.current) {
        x.jump(event.clientX)
        y.jump(event.clientY)
        hasPosition.current = true
      }

      setVisible(true)
      scheduleHitTest(event.target)
    }

    const handlePointerOver = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      setVisible(true)
      setHoveringControl(isActionable(event.target))
    }

    const handlePointerOut = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse') return

      if (!event.relatedTarget) {
        setVisible(false)
        setHoveringControl(false)
        setPressed(false)
        return
      }

      setHoveringControl(isActionable(event.relatedTarget))
    }

    const handlePointerDown = (event) => {
      if ((!event.pointerType || event.pointerType === 'mouse') && event.button === 0) {
        setPressed(true)
      }
    }

    const releasePointer = () => setPressed(false)
    const hidePointer = () => {
      setVisible(false)
      setHoveringControl(false)
      setPressed(false)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerover', handlePointerOver, { passive: true })
    document.addEventListener('pointerout', handlePointerOut, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    window.addEventListener('pointerup', releasePointer, { passive: true })
    window.addEventListener('pointercancel', releasePointer, { passive: true })
    window.addEventListener('blur', hidePointer)

    return () => {
      if (hitTestFrame) cancelAnimationFrame(hitTestFrame)
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerover', handlePointerOver)
      document.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', releasePointer)
      window.removeEventListener('pointercancel', releasePointer)
      window.removeEventListener('blur', hidePointer)
      hasPosition.current = false
    }
  }, [enabled, pointerX, pointerY, x, y])

  if (!enabled) return null

  return (
    <m.div
      aria-hidden="true"
      className={[
        'tradeguard-cursor',
        hoveringControl && 'tradeguard-cursor--actionable',
        pressed && 'tradeguard-cursor--pressed',
      ].filter(Boolean).join(' ')}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        scale: pressed ? 0.78 : hoveringControl ? 1.18 : 1,
      }}
      transition={{
        opacity: { duration: 0.12 },
        scale: { type: 'spring', stiffness: 620, damping: 32, mass: 0.2 },
      }}
      style={{ x, y }}
    >
      <span className="tradeguard-cursor__visual">
        <CursorClick
          aria-hidden="true"
          className="tradeguard-cursor__icon"
          size={22}
          weight="fill"
        />
      </span>
    </m.div>
  )
}
