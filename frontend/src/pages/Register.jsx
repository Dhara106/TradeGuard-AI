import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Check,
  EnvelopeSimple,
  LockKey,
  SpinnerGap,
  User,
  X,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { AuthShell, InlineNotice } from '../components/ui.jsx'

const createVerificationCode = () => (
  Math.floor(1000 + Math.random() * 9000).toString()
)

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('details')
  const [verificationCode, setVerificationCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', tone: 'empty' }

    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
    if (/\d/.test(password)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

    if (score <= 1) return { score, label: 'Very weak', tone: 'danger' }
    if (score === 2) return { score, label: 'Fair', tone: 'warning' }
    if (score === 3) return { score, label: 'Good', tone: 'info' }
    return { score, label: 'Strong', tone: 'success' }
  }, [password])

  const validations = useMemo(() => [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains an uppercase letter', valid: /[A-Z]/.test(password) },
    {
      label: 'Passwords match',
      valid: Boolean(password && confirmPassword && password === confirmPassword),
    },
  ], [password, confirmPassword])

  const validateDetails = () => {
    if (!username || !email.trim() || !password || !confirmPassword) {
      return 'Complete every field to continue.'
    }
    if (username.length < 3) {
      return 'Username must be at least 3 characters.'
    }
    if (!/^[A-Za-z]+$/.test(username)) {
      return 'Username can contain letters only.'
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
      return 'Use a valid Gmail address, such as name@gmail.com.'
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.'
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match.'
    }
    return ''
  }

  const handleDetailsSubmit = (event) => {
    event.preventDefault()
    const validationError = validateDetails()

    if (validationError) {
      setError(validationError)
      return
    }

    const nextCode = createVerificationCode()
    setVerificationCode(nextCode)
    setEnteredCode('')
    setError('')
    setNotice('A fresh demo verification code has been generated.')
    setStep('verify')
  }

  const handleVerificationSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (enteredCode.length !== 4) {
      setError('Enter the complete 4-digit verification code.')
      return
    }
    if (enteredCode !== verificationCode) {
      setError('That verification code is not correct. Try again or generate a new one.')
      return
    }

    setLoading(true)
    const result = await register(username, email.trim(), password)

    if (result.success) {
      showToast('Account created successfully.', 'success')
      navigate('/dashboard')
    } else {
      setError(result.message)
      showToast(result.message || 'Registration failed.', 'error')
    }

    setLoading(false)
  }

  const handleResend = () => {
    setVerificationCode(createVerificationCode())
    setEnteredCode('')
    setError('')
    setNotice('A new demo verification code is ready.')
  }

  const handleEditDetails = () => {
    setStep('details')
    setEnteredCode('')
    setError('')
    setNotice('')
  }

  return (
    <AuthShell
      eyebrow="Create your workspace"
      title="Put shipment risk in view from day one."
      description="Start with a shipment, add live operating context, and keep every prediction available to your team."
    >
      <header className="auth-card__header">
        <div className="step-indicator" aria-label="Registration progress">
          <span className={step === 'details' ? 'step-indicator__item step-indicator__item--active' : 'step-indicator__item step-indicator__item--complete'}>
            <span>1</span> Account
          </span>
          <span className={step === 'verify' ? 'step-indicator__item step-indicator__item--active' : 'step-indicator__item'}>
            <span>2</span> Verify
          </span>
        </div>
        <h2>{step === 'details' ? 'Create your account' : 'Verify your email'}</h2>
        <p>
          {step === 'details'
            ? 'Enter your details to set up a TradeGuard workspace.'
            : `Enter the demo code generated for ${email}.`}
        </p>
      </header>

      {error && <InlineNotice type="error">{error}</InlineNotice>}
      {notice && !error && <InlineNotice type="success">{notice}</InlineNotice>}

      {step === 'details' ? (
        <form className="auth-form" onSubmit={handleDetailsSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="register-username">Username</label>
            <div className="input-frame">
              <User aria-hidden="true" />
              <input
                id="register-username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value.replace(/[^A-Za-z]/g, ''))}
                placeholder="johndoe"
                autoComplete="username"
                minLength={3}
                required
              />
            </div>
            <span className="form-helper">Letters only, with at least 3 characters.</span>
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Email address</label>
            <div className="input-frame">
              <EnvelopeSimple aria-hidden="true" />
              <input
                id="register-email"
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
            <span className="form-helper">TradeGuard accounts currently require a Gmail address.</span>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="register-password">Password</label>
              <div className="input-frame">
                <LockKey aria-hidden="true" />
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  aria-describedby={password ? 'password-strength password-validation' : undefined}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="register-confirm-password">Confirm password</label>
              <div className="input-frame">
                <LockKey aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          </div>

          {password && (
            <div
              id="password-strength"
              className={`password-meter password-meter--${passwordStrength.tone}`}
              aria-live="polite"
            >
              <div className="password-meter__label">
                <span>Password strength</span>
                <strong>{passwordStrength.label}</strong>
              </div>
              <div className="password-meter__track" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={
                      index < passwordStrength.score
                        ? 'password-meter__segment password-meter__segment--active'
                        : 'password-meter__segment'
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {password && (
            <ul id="password-validation" className="validation-list">
              {validations.map((validation) => (
                <li
                  key={validation.label}
                  className={
                    validation.valid
                      ? 'validation-item validation-item--valid'
                      : 'validation-item'
                  }
                >
                  {validation.valid
                    ? <Check aria-hidden="true" />
                    : <X aria-hidden="true" />}
                  {validation.label}
                </li>
              ))}
            </ul>
          )}

          <button type="submit" className="button button--primary button--full">
            Continue to verification
            <ArrowRight aria-hidden="true" />
          </button>
        </form>
      ) : (
        <form
          className="auth-form"
          onSubmit={handleVerificationSubmit}
          aria-busy={loading}
          noValidate
        >
          <div className="verification-panel" role="status" aria-live="polite">
            <span className="verification-panel__eyebrow">Demo email preview</span>
            <p>Your TradeGuard AI verification code is</p>
            <code>{verificationCode}</code>
            <small>
              This inline preview replaces the simulated browser alert. In production,
              the same code would arrive by email.
            </small>
          </div>

          <div className="form-field form-field--centered">
            <label htmlFor="registration-code">4-digit verification code</label>
            <input
              id="registration-code"
              className="code-input"
              name="verificationCode"
              type="text"
              value={enteredCode}
              onChange={(event) => (
                setEnteredCode(event.target.value.replace(/\D/g, '').slice(0, 4))
              )}
              placeholder="0000"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{4}"
              maxLength={4}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="button button--primary button--full"
            disabled={loading}
          >
            {loading ? (
              <>
                <SpinnerGap className="button__spinner" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              <>
                Verify and create account
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>

          <div className="form-actions form-actions--split">
            <button type="button" className="button button--ghost" onClick={handleEditDetails}>
              <ArrowLeft aria-hidden="true" />
              Edit details
            </button>
            <button type="button" className="button button--secondary" onClick={handleResend}>
              <ArrowsClockwise aria-hidden="true" />
              New code
            </button>
          </div>
        </form>
      )}

      <p className="auth-card__footer">
        Already have an account?{' '}
        <Link to="/login" className="form-link">Sign in</Link>
      </p>
    </AuthShell>
  )
}
