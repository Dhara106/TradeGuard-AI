import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react'
import { AuthShell, LoadingState } from '../components/ui.jsx'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    const verify = async () => {
      if (!token) {
        setStatus('error')
        setMessage('This verification link is incomplete.')
        return
      }

      try {
        const response = await axios.get(`/api/auth/verify-email?token=${token}`)
        if (!active) return
        setStatus('success')
        setMessage(response.data?.message || 'Your email address is verified.')
      } catch (requestError) {
        if (!active) return
        setStatus('error')
        setMessage(
          requestError.response?.data?.message
          || 'Verification failed. The link may have expired.',
        )
      }
    }

    verify()
    return () => {
      active = false
    }
  }, [token])

  return (
    <AuthShell
      eyebrow="Identity check"
      title="Keep shipment intelligence connected to the right team."
      description="Email verification protects workspace access and keeps operational alerts routed to a trusted address."
    >
      {status === 'verifying' && (
        <div className="auth-state" aria-live="polite">
          <span className="eyebrow">Checking link</span>
          <h2>Verifying your email</h2>
          <LoadingState label="Confirming your email address…" compact />
        </div>
      )}

      {status === 'success' && (
        <div className="auth-state" aria-live="polite">
          <span className="auth-state__icon auth-state__icon--success">
            <CheckCircle aria-hidden="true" />
          </span>
          <span className="eyebrow">Verification complete</span>
          <h2>Email verified</h2>
          <p>{message}</p>
          <Link to="/dashboard" className="button button--primary button--full">
            Open dashboard
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="auth-state" role="alert">
          <span className="auth-state__icon auth-state__icon--danger">
            <XCircle aria-hidden="true" />
          </span>
          <span className="eyebrow">Verification stopped</span>
          <h2>We could not verify this email</h2>
          <p>{message}</p>
          <Link to="/login" className="button button--secondary button--full">
            Return to sign in
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </AuthShell>
  )
}
