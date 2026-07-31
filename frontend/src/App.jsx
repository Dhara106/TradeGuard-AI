import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import { LoadingState } from './components/LoadingState.jsx'

// React.lazy plus an exposed .preload() so a chunk can be warmed before it is
// needed (idle time after login) instead of being fetched mid-navigation.
const lazyRoute = (load) => {
  const Component = lazy(load)
  Component.preload = load
  return Component
}

const Landing = lazyRoute(() => import('./pages/Landing.jsx'))
const Login = lazyRoute(() => import('./pages/Login.jsx'))
const Register = lazyRoute(() => import('./pages/Register.jsx'))
const Dashboard = lazyRoute(() => import('./pages/Dashboard.jsx'))
const Predict = lazyRoute(() => import('./pages/Predict.jsx'))
const Tracking = lazyRoute(() => import('./pages/Tracking.jsx'))
const History = lazyRoute(() => import('./pages/History.jsx'))
const Profile = lazyRoute(() => import('./pages/Profile.jsx'))
const Settings = lazyRoute(() => import('./pages/Settings.jsx'))
const ForgotPassword = lazyRoute(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword = lazyRoute(() => import('./pages/ResetPassword.jsx'))
const VerifyEmail = lazyRoute(() => import('./pages/VerifyEmail.jsx'))
const NotFound = lazyRoute(() => import('./pages/NotFound.jsx'))

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

// Where a signed-in user usually goes next. Dashboard is by far the heaviest chunk
// (it carries the charting library), so warming these while the main thread is idle
// keeps the first navigation from stalling on a cold fetch.
const WARM_AFTER_AUTH = [Dashboard, Predict, History]

function RouteFallback() {
  return (
    <main className="route-loading">
      <LoadingState label="Opening TradeGuard…" />
    </main>
  )
}

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <main className="route-loading">
        <LoadingState label="Securing your workspace…" />
      </main>
    )
  }

  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const location = useLocation()
  const { pathname } = location
  const { token } = useAuth()

  // The chrome must not react to the *incoming* pathname while the outgoing page
  // is still animating out: mounting or unmounting the sticky navbar (68px) and
  // the footer mid-exit yanks the fading page up or down. So we track the route
  // the chrome is currently drawn for and only advance it once the exit finishes.
  const [chromeRoute, setChromeRoute] = useState(pathname)
  const isAuthRoute = AUTH_ROUTES.includes(chromeRoute)
  const showFooter = chromeRoute === '/' || chromeRoute === '/404'

  useEffect(() => {
    if (!token) return undefined

    const warm = () => WARM_AFTER_AUTH.forEach((route) => route.preload())

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 2500 })
      return () => window.cancelIdleCallback(id)
    }

    const id = window.setTimeout(warm, 1200)
    return () => window.clearTimeout(id)
  }, [token])

  const handleExitComplete = () => {
    setChromeRoute(pathname)
    // Land at the top of the new page. 'instant' opts out of the global
    // `scroll-behavior: smooth`, which would otherwise animate the jump after the
    // page has already swapped.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  return (
    <div className="app-shell">
      <CustomCursor />
      {!isAuthRoute && <Navbar />}
      {/* Suspense sits ABOVE AnimatePresence so a chunk download does not create a
          fresh boundary on every navigation. With it inside the keyed element, the
          fallback spinner is what plays the enter animation and the real content
          then appears with no transition at all. */}
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false} onExitComplete={handleExitComplete}>
          <m.div
            key={pathname}
            className="route-frame"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
              <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </m.div>
        </AnimatePresence>
      </Suspense>
      {showFooter && <Footer />}
    </div>
  )
}
