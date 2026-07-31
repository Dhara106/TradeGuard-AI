import { SpinnerGap } from '@phosphor-icons/react'

// Kept in its own module (rather than in ui.jsx) because App.jsx renders this in
// the route Suspense fallback. Importing it from the ui.jsx barrel would pull that
// whole file — including the Landing-only ProductBoard and its icons — into the
// entry chunk that every visitor downloads.
export function LoadingState({ label = 'Loading your workspace…', compact = false }) {
  return (
    <div className={`loading-state${compact ? ' loading-state--compact' : ''}`} role="status">
      <span className="spinner" aria-hidden="true"><SpinnerGap /></span>
      <p>{label}</p>
    </div>
  )
}

export default LoadingState
