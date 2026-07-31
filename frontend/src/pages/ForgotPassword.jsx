import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  EnvelopeSimple,
  SpinnerGap,
} from '@phosphor-icons/react'
import { AuthShell, InlineNotice } from '../components/ui.jsx'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setCopied(false)

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: email.trim(),
      })
      if (response.data.token) {
        const origin = window.location.origin
        setResetLink(`${origin}/reset-password?token=${response.data.token}`)
      }
      setSent(true)
    } catch (requestError) {
      setError(
        requestError.response?.data?.message
        || 'We could not generate a reset request. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetLink)
      setCopied(true)
    } catch {
      setError('The link could not be copied automatically. Select and copy it manually.')
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Recover access without losing shipment context."
      description="Generate a secure reset link, choose a new password, and return to the same TradeGuard workspace."
    >
      {!sent ? (
        <>
          <header className="auth-card__header">
            <span className="eyebrow">Password help</span>
            <h2>Reset your password</h2>
            <p>Enter your account email and we will generate a recovery link.</p>
          </header>

          {error && <InlineNotice type="error">{error}</InlineNotice>}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-busy={loading}
          >
            <div className="form-field">
              <label htmlFor="recovery-email">Email address</label>
              <div className="input-frame">
                <EnvelopeSimple aria-hidden="true" />
                <input
                  id="recovery-email"
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

            <button
              type="submit"
              className="button button--primary button--full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <SpinnerGap className="button__spinner" aria-hidden="true" />
                  Generating link…
                </>
              ) : (
                <>
                  Generate reset link
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-card__footer">
            <Link to="/login" className="form-link form-link--back">
              <ArrowLeft aria-hidden="true" />
              Back to sign in
            </Link>
          </p>
        </>
      ) : (
        <div className="auth-state" aria-live="polite">
          <span className="auth-state__icon auth-state__icon--success">
            <CheckCircle aria-hidden="true" />
          </span>
          <span className="eyebrow">Recovery ready</span>
          <h2>Reset link generated</h2>

          {resetLink ? (
            <>
              <p>
                This demo shows the recovery link here. Open it to choose a new password.
              </p>
              <div className="copy-panel">
                <a href={resetLink} className="copy-panel__value">
                  {resetLink}
                </a>
                <button
                  type="button"
                  className="button button--secondary button--full"
                  onClick={handleCopy}
                >
                  {copied
                    ? <Check aria-hidden="true" />
                    : <Copy aria-hidden="true" />}
                  {copied ? 'Copied' : 'Copy reset link'}
                </button>
              </div>
              {error && <InlineNotice type="error">{error}</InlineNotice>}
            </>
          ) : (
            <p>
              If this email exists in TradeGuard, its recovery instructions are ready.
            </p>
          )}

          <Link to="/login" className="button button--primary button--full">
            Back to sign in
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
