import {
  CheckCircle,
  Info,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, m } from 'framer-motion'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: Warning,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeouts = useRef(new Map())

  const removeToast = useCallback((id) => {
    const timer = timeouts.current.get(id)
    if (timer) clearTimeout(timer)
    timeouts.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, type }])
    const timer = setTimeout(() => removeToast(id), 4500)
    timeouts.current.set(id, timer)
  }, [removeToast])

  useEffect(() => () => {
    timeouts.current.forEach(clearTimeout)
    timeouts.current.clear()
  }, [])

  // A fresh object here re-renders every useToast() consumer whenever any toast
  // appears or expires — which on /tracking is the entire page tree.
  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
        {/* popLayout pulls an exiting toast out of flow immediately, so the stack
            closes up during the exit rather than after it. */}
        <AnimatePresence initial={false} mode="popLayout">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info
            return (
              <m.div
                layout
                key={toast.id}
                className={`toast toast--${toast.type}`}
                role="status"
                // No `scale` keyframe: layout projection measures the post-scale box,
                // so animating scale and layout together made the text warp while a
                // second toast was entering.
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 18 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="toast__icon"><Icon weight="fill" /></span>
                <span>{toast.message}</span>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X />
                </button>
              </m.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
