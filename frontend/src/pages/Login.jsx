import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  EnvelopeSimple,
  LockKey,
  SpinnerGap,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AuthShell, InlineNotice } from '../components/ui.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter both your email address and password.')
      return
    }

    setLoading(true)
    const result = await login(email.trim(), password)

    if (result.success) {
      showToast('Welcome back to TradeGuard AI.', 'success')
      navigate('/dashboard')
    } else {
      setError(result.message)
      showToast(result.message || 'Login failed.', 'error')
    }

    setLoading(false)
  }

  return (
    <AuthShell
      eyebrow="Operations access"
      title="Return to your shipment command center."
      description="Review active risk signals, run a new prediction, and keep every logistics decision connected."
    >
      <header className="auth-card__header">
        <span className="eyebrow">Welcome back</span>
        <h2>Sign in to TradeGuard AI</h2>
        <p>Use the email address linked to your workspace.</p>
      </header>

      {error && <InlineNotice type="error">{error}</InlineNotice>}

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        aria-busy={loading}
        noValidate
      >
        <div className="form-field">
          <label htmlFor="login-email">Email address</label>
          <div className="input-frame">
            <EnvelopeSimple aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@gmail.com"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <div className="form-field__label-row">
            <label htmlFor="login-password">Password</label>
            <Link to="/forgot-password" className="form-link">
              Forgot password?
            </Link>
          </div>
          <div className="input-frame">
            <LockKey aria-hidden="true" />
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="button button--primary button--full"
          disabled={loading}
        >
          {loading ? (
            <>
              <SpinnerGap className="button__spinner" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="auth-card__footer">
        New to TradeGuard?{' '}
        <Link to="/register" className="form-link">Create an account</Link>
      </p>
    </AuthShell>
  )
}
