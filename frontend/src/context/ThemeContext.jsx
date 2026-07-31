// ============================================
// ThemeContext.jsx — simple Light / Dark theme
// --------------------------------------------
// Concepts demonstrated (viva-friendly):
//   • React Context + Hooks (useState, useEffect)
//   • localStorage to remember the choice
//   • Adds a "light"/"dark" class on <html>, which the CSS uses
//
// There are only two themes (light and dark). No system detection.
// ============================================
import { createContext, useContext, useState, useLayoutEffect, useCallback, useMemo } from 'react'

const ThemeContext = createContext(null)

// Read the saved theme from localStorage. The supplied design system is light-first.
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('theme')
  return saved === 'light' || saved === 'dark' ? saved : 'light'
}

// Write the theme class to <html> and persist it. Kept outside the component so it
// can be called synchronously from the setter, before React re-renders children.
const applyTheme = (next) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(next)
  try {
    localStorage.setItem('theme', next)
  } catch {
    // Private browsing / storage disabled — the theme still applies for this session.
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme)

  // Apply before paint on mount (and for any external state change), so the class
  // is never a frame behind the rendered UI.
  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Update the DOM *first*, then the state. Components that read CSS custom
  // properties during render (the charts read --success, --chart-grid, etc. via
  // getComputedStyle) would otherwise resolve against the outgoing theme and paint
  // the previous palette until some unrelated re-render corrected them.
  const setTheme = useCallback((next) => {
    applyTheme(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  }, [setTheme])

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// Custom hook so components can read/change the theme easily.
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

export default ThemeContext
