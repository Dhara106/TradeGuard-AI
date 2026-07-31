import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Lightning,
  MapPin,
  Package,
  Tray,
  Truck,
  Warning,
} from '@phosphor-icons/react'

const BOARD_STOPS = [
  { city: 'Mumbai', PendingIcon: MapPin },
  { city: 'Surat', PendingIcon: MapPin },
  { city: 'Jaipur', PendingIcon: MapPin },
  { city: 'Delhi', PendingIcon: Package },
]

const BOARD_RISK_STATES = [
  { score: 18, label: 'Low exposure' },
  { score: 31, label: 'Weather watch' },
  { score: 14, label: 'Route stable' },
]

export function BrandMark({ compact = false }) {
  return (
    <span className={`brand-lockup${compact ? ' brand-lockup--compact' : ''}`}>
      <span className="brand-tile" aria-hidden="true">
        <img src="/tradeguard-mark.png" alt="" width="51" height="51" decoding="async" />
      </span>
      {!compact && (
        <span className="brand-name">
          TradeGuard<span>AI</span>
        </span>
      )}
    </span>
  )
}

export function PageIntro({ eyebrow, title, description, action, children }) {
  return (
    <header className="page-intro">
      <div className="page-intro__copy">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-intro__action">{action}</div>}
      {children}
    </header>
  )
}

export function SectionHeading({ eyebrow, title, description, align = 'left', action }) {
  return (
    <div className={`section-heading section-heading--${align}`}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function RiskBadge({ prediction, score, label }) {
  const delayed = prediction === 'Delayed' || Number(score) >= 70
  const medium = !delayed && Number(score) >= 35
  const tone = delayed ? 'danger' : medium ? 'warning' : 'success'
  const text = label || (prediction ? prediction : delayed ? 'High risk' : medium ? 'Watch' : 'Low risk')

  return (
    <span className={`status-badge status-badge--${tone}`}>
      {delayed ? <Warning weight="bold" /> : <Check weight="bold" />}
      {text}
    </span>
  )
}

export function MetricCard({ label, value, detail, tone = 'plain', icon }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        {icon && <span className="metric-card__icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      {detail && <p>{detail}</p>}
    </article>
  )
}

// Re-exported so existing `import { LoadingState } from './ui.jsx'` call sites keep
// working. The implementation lives in its own module — see LoadingState.jsx.
export { LoadingState } from './LoadingState.jsx'

export function EmptyState({
  icon = <Tray />,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}) {
  const action = actionTo ? (
    <Link to={actionTo} className="button button--primary">
      {actionLabel}<ArrowRight />
    </Link>
  ) : onAction ? (
    <button type="button" onClick={onAction} className="button button--primary">
      {actionLabel}<ArrowRight />
    </button>
  ) : null

  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon}</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function InlineNotice({ type = 'info', children }) {
  const Icon = type === 'error' || type === 'warning' ? Warning : type === 'success' ? Check : Lightning
  return (
    <div className={`inline-notice inline-notice--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon />
      <span>{children}</span>
    </div>
  )
}

export function ProductBoard({ compact = false }) {
  const reducedMotion = useReducedMotion()
  const boardId = useId()
  const boardRef = useRef(null)
  const [activeStop, setActiveStop] = useState(1)
  // Bumped each time the run restarts. Used to re-key the truck and the progress
  // fill so a new leg starts fresh instead of animating backwards to the origin.
  const [cycle, setCycle] = useState(0)
  const [inView, setInView] = useState(true)
  // True during the short window where the run restarts: the truck and the progress
  // fill fade out at the destination, reposition while invisible, then fade back in
  // at the origin. Without it the reset is a hard cut across the whole track.
  const [resetting, setResetting] = useState(false)
  const stopRef = useRef(1)

  // Everything below loops forever. Off-screen that is pure main-thread burn, and
  // on a long landing page it competes with scrolling. Only run while visible.
  useEffect(() => {
    const node = boardRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const animating = !reducedMotion && inView

  useEffect(() => {
    if (!animating) return undefined

    let resetTimer = 0
    let fadeInTimer = 0

    const advance = () => {
      if (stopRef.current >= BOARD_STOPS.length - 1) {
        setResetting(true)
        resetTimer = window.setTimeout(() => {
          // Reposition while still invisible. `resetting` stays true so the newly
          // mounted truck's animate target is opacity 0 — clearing it on the next
          // tick then animates 0 -> 1, which a mount-time `initial` does not do
          // reliably once the element carries a layoutId.
          stopRef.current = 1
          setActiveStop(1)
          setCycle((value) => value + 1)
          fadeInTimer = window.setTimeout(() => setResetting(false), 60)
        }, 280)
        return
      }
      stopRef.current += 1
      setActiveStop(stopRef.current)
    }

    const timer = window.setInterval(advance, 3600)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(resetTimer)
      window.clearTimeout(fadeInTimer)
    }
  }, [animating])

  const riskState = BOARD_RISK_STATES[activeStop - 1] || BOARD_RISK_STATES[0]

  // Memoised so the 3.6s tick — which re-renders this whole subtree — hands framer
  // the same prop objects instead of fresh ones every cycle.
  const noteMotion = useMemo(() => (delay) => (
    !animating
      ? { initial: false, animate: { opacity: 1, y: 0, scale: 1 } }
      : {
          initial: { opacity: 0, y: 18, scale: 0.97 },
          animate: { opacity: 1, y: [0, -3, 0], scale: 1 },
          transition: {
            opacity: { duration: 0.35, delay },
            scale: { duration: 0.35, delay },
            y: {
              duration: 4.2,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
              delay: delay + 0.25,
            },
          },
        }
  ), [animating])

  return (
    <m.div
      ref={boardRef}
      className={`product-board${compact ? ' product-board--compact' : ''}`}
      aria-label="TradeGuard shipment intelligence board"
      initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="product-board__bar">
        <div className="product-board__identity">
          <span className="product-board__mini-logo"><img src="/tradeguard-mark.png" alt="" width="40" height="40" loading="lazy" decoding="async" /></span>
          <span>North India control board</span>
        </div>
        <div className="product-board__presence" aria-label="Three operators online">
          {['AK', 'RS', '+3'].map((operator, index) => (
            <m.span
              key={operator}
              animate={animating ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatType: 'loop',
                delay: index * 0.22,
                ease: 'easeInOut',
              }}
            >
              {operator}
            </m.span>
          ))}
        </div>
      </div>
      <div className="product-board__canvas">
        <m.div
          className="board-route"
          initial={reducedMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.12 }}
        >
          <div className="board-route__label">
            <span>Shipment TG–4821</span>
            <RiskBadge prediction="On Time" />
          </div>
          <div className="board-route__track">
            <span className="board-route__line" />
            <m.span
              // Re-keyed per cycle: without this the fill springs backwards from
              // full to one third when the run restarts, which reads as a glitch.
              key={`progress-${cycle}`}
              className="board-route__progress"
              initial={animating ? { scaleX: 0, opacity: 1 } : false}
              animate={{
                scaleX: activeStop / (BOARD_STOPS.length - 1),
                opacity: resetting ? 0 : 1,
              }}
              transition={{
                scaleX: { type: 'spring', stiffness: 120, damping: 24, restDelta: 0.001 },
                opacity: { duration: 0.24, ease: 'easeOut' },
              }}
            />
            {BOARD_STOPS.map(({ city, PendingIcon }, index) => {
              const reached = index < activeStop
              const active = index === activeStop

              return (
                <m.span
                  key={city}
                  className={`board-route__node${reached ? ' board-route__node--reached' : ''}`}
                  initial={animating ? { opacity: 0, scale: 0.7 } : false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, delay: 0.18 + (index * 0.08), ease: 'easeOut' }}
                >
                  {reached ? <Check weight="bold" /> : <PendingIcon />}
                  {active && (
                    <m.span
                      // The layoutId carries the cycle, so restarting the run mounts
                      // a *new* truck at the origin (it fades in) rather than sliding
                      // the existing one back across the whole track.
                      layoutId={`board-truck-${boardId}-${cycle}`}
                      className="board-route__vehicle"
                      initial={animating ? { opacity: 0, scale: 0.82 } : false}
                      animate={{
                        opacity: resetting ? 0 : 1,
                        scale: resetting ? 0.8 : 1,
                      }}
                      transition={{
                        layout: { type: 'spring', stiffness: 90, damping: 20, restDelta: 0.001 },
                        opacity: { duration: 0.26, ease: 'easeOut' },
                        scale: { duration: 0.26, ease: 'easeOut' },
                      }}
                    >
                      <Truck weight="fill" />
                    </m.span>
                  )}
                </m.span>
              )
            })}
          </div>
          <div className="board-route__cities">
            {BOARD_STOPS.map(({ city }, index) => (
              <span key={city} className={index === activeStop ? 'board-route__city--active' : ''}>
                {city}
              </span>
            ))}
          </div>
        </m.div>
        <div className="board-note board-note--yellow">
          <m.div className="board-note__surface" {...noteMotion(0.38)}>
            <span>WEATHER WATCH</span>
            <strong>Light rain near Surat</strong>
            <small>+8% route exposure</small>
          </m.div>
        </div>
        <div className="board-note board-note--rose">
          <m.div className="board-note__surface" {...noteMotion(0.52)}>
            <span>AI SIGNAL</span>
            <strong>92% on-time confidence</strong>
            <small>Carrier pattern is stable</small>
          </m.div>
        </div>
        <div className="board-note board-note--teal">
          <m.div className="board-note__surface" {...noteMotion(0.66)}>
            <span>NEXT ACTION</span>
            <strong>Continue current route</strong>
            <small>No intervention needed</small>
          </m.div>
        </div>
        {!compact && (
          <m.div
            className="board-score"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 130, damping: 16, delay: 0.72 }}
          >
            <m.span
              className="board-score__pulse"
              aria-hidden="true"
              animate={animating ? { opacity: [0.32, 0], scale: [1, 1.22] } : { opacity: 0, scale: 1 }}
              transition={{ duration: 2.2, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }}
            />
            <span>LIVE RISK</span>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={riskState.score}
                className="board-score__reading"
                initial={reducedMotion ? false : { opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -7 }}
                transition={{ duration: 0.22 }}
              >
                <strong>{riskState.score}%</strong>
                <small>{riskState.label}</small>
              </m.div>
            </AnimatePresence>
          </m.div>
        )}
      </div>
    </m.div>
  )
}

export function AuthShell({ eyebrow, title, description, children }) {
  return (
    <main className="auth-shell">
      <section className="auth-shell__story">
        <Link to="/" aria-label="TradeGuard AI home"><BrandMark /></Link>
        <div className="auth-shell__story-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <ProductBoard compact />
      </section>
      <section className="auth-shell__form">
        <div className="auth-shell__mobile-brand">
          <Link to="/" aria-label="TradeGuard AI home"><BrandMark /></Link>
        </div>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  )
}
