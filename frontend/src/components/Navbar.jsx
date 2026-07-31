import { useEffect, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChartDonut,
  ClockCounterClockwise,
  Crosshair,
  GearSix,
  List,
  Moon,
  NavigationArrow,
  SignOut,
  Sun,
  X,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { BrandMark } from './ui.jsx'

const workspaceLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: ChartDonut },
  { to: '/predict', label: 'Predictor', icon: Crosshair },
  { to: '/tracking', label: 'Tracking', icon: NavigationArrow },
  { to: '/history', label: 'Audit log', icon: ClockCounterClockwise },
]

export default function Navbar() {
  const { token, logout, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => setOpen(false), [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      {!token && (
        <div className="promo-bar">
          <span className="promo-badge">NEW</span>
          <span className="promo-bar__message">Weather-aware shipment intelligence is live</span>
          <Link to="/register">Start free <span aria-hidden="true">→</span></Link>
        </div>
      )}
      <nav className="top-nav" aria-label="Primary navigation">
        <div className="nav-container">
          <Link to={token ? '/dashboard' : '/'} className="nav-brand" aria-label="TradeGuard AI home">
            <BrandMark />
          </Link>

          <div className="nav-links nav-links--desktop">
            {token ? workspaceLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}>
                <Icon /><span>{label}</span>
              </NavLink>
            )) : (
              <>
                <a href="/#platform" className="nav-link">Platform</a>
                <a href="/#workflow" className="nav-link">How it works</a>
                <a href="/#results" className="nav-link">Results</a>
              </>
            )}
          </div>

          <div className="nav-actions nav-actions--desktop">
            <button
              type="button"
              className="icon-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            {token ? (
              <>
                <Link to="/profile" className="user-chip">
                  <span className="user-chip__avatar">{user?.username?.slice(0, 1).toUpperCase() || 'U'}</span>
                  <span>{user?.username || 'Operator'}</span>
                </Link>
                <Link to="/settings" className="icon-button" aria-label="Settings"><GearSix /></Link>
                <button type="button" className="button button--secondary button--small" onClick={handleLogout}>
                  <SignOut /> Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-text-link">Log in</Link>
                <Link to="/register" className="button button--primary button--small">Get started free</Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="nav-menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
          >
            {open ? <X /> : <List />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <m.div
              key="mobile-navigation"
              className="mobile-nav"
              id="mobile-navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mobile-nav__links">
                {token ? workspaceLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`}>
                    <Icon /><span>{label}</span>
                  </NavLink>
                )) : (
                  <>
                    <a href="/#platform" className="mobile-nav__link">Platform</a>
                    <a href="/#workflow" className="mobile-nav__link">How it works</a>
                    <a href="/#results" className="mobile-nav__link">Results</a>
                  </>
                )}
              </div>
              <div className="mobile-nav__actions">
                <button type="button" className="mobile-nav__link" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun /> : <Moon />}
                  <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                </button>
                {token ? (
                  <>
                    <Link to="/profile" className="mobile-nav__link">Profile</Link>
                    <Link to="/settings" className="mobile-nav__link"><GearSix /> Settings</Link>
                    <button type="button" className="button button--secondary" onClick={handleLogout}><SignOut /> Log out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="button button--secondary">Log in</Link>
                    <Link to="/register" className="button button--primary">Get started free</Link>
                  </>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
