import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  CheckCircle,
  LockKey,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react'
import { AuthShell, InlineNotice } from '../components/ui.jsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, newPassword })
      setSuccess(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'We could not reset this password. The link may have expired.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Secure recovery"
      title="Choose a new key for your TradeGuard workspace."
      description="Your shipment history and active risk signals stay in place while you restore account access."
    >
      {!token ? (
        <div className="auth-state" role="alert">
          <span className="auth-state__icon auth-state__icon--danger">
            <WarningCircle aria-hidden="true" />
          </span>
          <span className="eyebrow">Link unavailable</span>
          <h2>This reset link is invalid</h2>
          <p>It may be incomplete or expired. Generate a new link to continue.</p>
          <Link to="/forgot-password" className="button button--primary button--full">
            Request a new link
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : success ? (
        <div className="auth-state" aria-live="polite">
          <span className="auth-state__icon auth-state__icon--success">
            <CheckCircle aria-hidden="true" />
          </span>
          <span className="eyebrow">Access restored</span>
          <h2>Password updated</h2>
          <p>Your new password is ready. Sign in to return to the dashboard.</p>
          <Link to="/login" className="button button--primary button--full">
            Continue to sign in
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <>
          <header className="auth-card__header">
            <span className="eyebrow">New password</span>
            <h2>Secure your account</h2>
            <p>Use at least 6 characters and confirm the password below.</p>
          </header>

          {error && <InlineNotice type="error">{error}</InlineNotice>}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={loading}
            noValidate
          >
            <div className="form-field">
              <label htmlFor="new-password">New password</label>
              <div className="input-frame">
                <LockKey aria-hidden="true" />
                <input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirm-new-password">Confirm password</label>
              <div className="input-frame">
                <LockKey aria-hidden="true" />
                <input
                  id="confirm-new-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
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
                  Updating password…
                </>
              ) : (
                <>
                  Update password
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  )
}
