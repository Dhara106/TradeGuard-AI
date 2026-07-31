import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarBlank,
  Camera,
  ChartLineUp,
  Check,
  CheckCircle,
  ClockCounterClockwise,
  EnvelopeSimple,
  Gauge,
  GearSix,
  Lightning,
  Phone,
  ShieldCheck,
  Trash,
  User,
  Warning,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import { getShipments, getStats } from '../services/api.js'
import { useLocalStorageState } from '../components/profile/hooks.js'
import {
  InlineNotice,
  LoadingState,
  MetricCard,
  PageIntro,
  SectionHeading,
} from '../components/ui.jsx'

const createVerificationCode = () => (
  Math.floor(1000 + Math.random() * 9000).toString()
)

const formatJoinedDate = (value) => {
  if (!value) return 'Date unavailable'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return (
      <main className="profile-page workspace-page">
        <LoadingState label="Preparing your profile…" />
      </main>
    )
  }

  return <ProfileWorkspace key={user._id} user={user} />
}

function ProfileWorkspace({ user }) {
  const storageId = user._id
  const [profile, setProfile] = useLocalStorageState(`profile:info:${storageId}`, {})
  const [avatar, setAvatar] = useLocalStorageState(`profile:avatar:${storageId}`, null)
  const [shipments, setShipments] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [nameNotice, setNameNotice] = useState('')
  const [phoneDraft, setPhoneDraft] = useState(profile.phone || '')
  const [phoneStep, setPhoneStep] = useState('idle')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneCodeInput, setPhoneCodeInput] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneNotice, setPhoneNotice] = useState('')
  const [avatarError, setAvatarError] = useState('')

  useEffect(() => {
    let active = true

    const loadMetrics = async () => {
      const [shipmentsResult, statsResult] = await Promise.allSettled([
        getShipments(),
        getStats(),
      ])

      if (!active) return

      if (
        shipmentsResult.status === 'fulfilled'
        && shipmentsResult.value.data?.success
      ) {
        setShipments(shipmentsResult.value.data.data || [])
      }

      if (
        statsResult.status === 'fulfilled'
        && statsResult.value.data?.success
      ) {
        setStats(statsResult.value.data.stats || null)
      }

      if (
        shipmentsResult.status === 'rejected'
        && statsResult.status === 'rejected'
      ) {
        setMetricsError('Activity metrics are temporarily unavailable.')
      }

      setLoadingMetrics(false)
    }

    loadMetrics()
    return () => {
      active = false
    }
  }, [])

  const metrics = useMemo(() => {
    const total = shipments.length
    const highRisk = shipments.filter((shipment) => shipment.prediction === 'Delayed').length
    const onTime = shipments.filter((shipment) => shipment.prediction === 'On Time').length
    const calculatedAverage = total
      ? Math.round(
        shipments.reduce((sum, shipment) => sum + Number(shipment.riskScore || 0), 0)
        / total,
      )
      : 0

    return {
      total,
      highRisk,
      onTime,
      averageRisk: stats?.avgRiskScore ?? calculatedAverage,
    }
  }, [shipments, stats])

  const displayName = profile.fullName || user.username || 'TradeGuard user'
  const initial = displayName.charAt(0).toUpperCase()

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setAvatarError('')

    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file for your profile picture.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Choose an image smaller than 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setAvatar(reader.result)
    }
    reader.onerror = () => setAvatarError('This image could not be read.')
    reader.readAsDataURL(file)
  }

  const handleNameSave = (event) => {
    event.preventDefault()
    const normalizedName = fullName.trim()
    setProfile((current) => ({ ...current, fullName: normalizedName }))
    setFullName(normalizedName)
    setNameNotice(normalizedName ? 'Full name saved on this device.' : 'Full name removed.')
  }

  const handlePhoneChange = (event) => {
    setPhoneDraft(event.target.value.replace(/\D/g, '').slice(0, 10))
    setPhoneStep('idle')
    setPhoneCode('')
    setPhoneCodeInput('')
    setPhoneError('')
    setPhoneNotice('')
  }

  const handlePhoneCodeRequest = () => {
    if (!/^\d{10}$/.test(phoneDraft)) {
      setPhoneError('Enter a valid 10-digit phone number.')
      return
    }

    setPhoneCode(createVerificationCode())
    setPhoneCodeInput('')
    setPhoneStep('verify')
    setPhoneError('')
    setPhoneNotice('A new device-only demo code is ready below.')
  }

  const handlePhoneVerification = (event) => {
    event.preventDefault()
    setPhoneError('')

    if (phoneCodeInput.length !== 4) {
      setPhoneError('Enter the complete 4-digit code.')
      return
    }
    if (phoneCodeInput !== phoneCode) {
      setPhoneError('That code is not correct. Try again or generate a new one.')
      return
    }

    setProfile((current) => ({ ...current, phone: phoneDraft }))
    setPhoneStep('verified')
    setPhoneNotice('Phone number verified and saved on this device.')
    setPhoneCode('')
    setPhoneCodeInput('')
  }

  const handlePhoneRemove = () => {
    setProfile((current) => ({ ...current, phone: '' }))
    setPhoneDraft('')
    setPhoneStep('idle')
    setPhoneCode('')
    setPhoneCodeInput('')
    setPhoneError('')
    setPhoneNotice('Phone number removed from this device.')
  }

  return (
    <main className="profile-page workspace-page">
      <PageIntro
        eyebrow="Account"
        title="My profile"
        description="Manage device-local profile details and review your prediction activity."
        action={(
          <Link to="/settings" className="button button--secondary">
            <GearSix aria-hidden="true" />
            Account settings
          </Link>
        )}
      />

      <section className="profile-hero" aria-label="Profile summary">
        <div className="profile-hero__signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="profile-hero__content">
          <div className="profile-avatar">
            <span className="profile-avatar__image">
              {avatar
                ? <img src={avatar} alt={`${displayName} profile`} />
                : <span aria-hidden="true">{initial}</span>}
            </span>
            <div className="profile-avatar__actions">
              <label htmlFor="profile-avatar-upload" className="button button--secondary">
                <Camera aria-hidden="true" />
                {avatar ? 'Change photo' : 'Add photo'}
              </label>
              <input
                id="profile-avatar-upload"
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              {avatar && (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setAvatar(null)}
                >
                  <Trash aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="profile-hero__identity">
            <div className="profile-hero__title">
              <h2>{displayName}</h2>
              <span className="status-badge status-badge--info">
                <ShieldCheck aria-hidden="true" />
                Standard user
              </span>
            </div>
            <div className="profile-meta">
              <span><User aria-hidden="true" /> @{user.username || 'user'}</span>
              <span><EnvelopeSimple aria-hidden="true" /> {user.email || 'Email unavailable'}</span>
              <span><CalendarBlank aria-hidden="true" /> Joined {formatJoinedDate(user.createdAt)}</span>
            </div>
            <p className="profile-hero__device-note">
              Photo and editable profile details stay in this browser on this device.
            </p>
          </div>
        </div>

        {avatarError && <InlineNotice type="error">{avatarError}</InlineNotice>}
      </section>

      <section className="profile-metrics" aria-label="Prediction activity">
        <SectionHeading
          eyebrow="Activity"
          title="Prediction overview"
          description="A summary calculated from your TradeGuard shipment history."
        />
        {loadingMetrics ? (
          <LoadingState label="Calculating account activity…" compact />
        ) : (
          <>
            {metricsError && <InlineNotice type="warning">{metricsError}</InlineNotice>}
            <div className="metrics-grid">
              <MetricCard
                label="Total predictions"
                value={metrics.total}
                detail="All shipment analyses"
                tone="plain"
                icon={<ChartLineUp aria-hidden="true" />}
              />
              <MetricCard
                label="High-risk predictions"
                value={metrics.highRisk}
                detail="Predicted as delayed"
                tone="coral"
                icon={<Warning aria-hidden="true" />}
              />
              <MetricCard
                label="On-time predictions"
                value={metrics.onTime}
                detail="Predicted on time"
                tone="teal"
                icon={<CheckCircle aria-hidden="true" />}
              />
              <MetricCard
                label="Average risk score"
                value={`${metrics.averageRisk}%`}
                detail="Across all predictions"
                tone="yellow"
                icon={<Gauge aria-hidden="true" />}
              />
            </div>
          </>
        )}
      </section>

      <div className="profile-grid">
        <section className="panel profile-details" aria-label="Personal details">
          <SectionHeading
            eyebrow="Device-local profile"
            title="Personal details"
            description="These optional fields are saved only in this browser."
          />

          <InlineNotice type="info">
            These details do not update your backend account and will not follow
            you to another browser or device.
          </InlineNotice>

          <form className="profile-edit-form" onSubmit={handleNameSave}>
            <div className="form-field">
              <label htmlFor="profile-full-name">Full name</label>
              <div className="input-frame">
                <User aria-hidden="true" />
                <input
                  id="profile-full-name"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value)
                    setNameNotice('')
                  }}
                  placeholder="Add your full name"
                  autoComplete="name"
                />
              </div>
            </div>
            <button type="submit" className="button button--secondary">
              <Check aria-hidden="true" />
              Save full name
            </button>
            {nameNotice && <p className="form-helper" role="status">{nameNotice}</p>}
          </form>

          <div className="phone-editor">
            <div className="form-field">
              <div className="form-field__label-row">
                <label htmlFor="profile-phone">Phone number</label>
                {profile.phone && phoneDraft === profile.phone && (
                  <span className="status-badge status-badge--success">
                    <Check aria-hidden="true" />
                    Device verified
                  </span>
                )}
              </div>
              <div className="input-frame">
                <Phone aria-hidden="true" />
                <span className="input-frame__prefix">+91</span>
                <input
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  value={phoneDraft}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                />
              </div>
              <span className="form-helper">
                Demo verification and storage are limited to this device.
              </span>
            </div>

            <div className="form-actions form-actions--split">
              <button
                type="button"
                className="button button--primary"
                onClick={handlePhoneCodeRequest}
              >
                <Phone aria-hidden="true" />
                {phoneStep === 'verify' ? 'Generate new code' : 'Verify phone'}
              </button>
              {profile.phone && (
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={handlePhoneRemove}
                >
                  <Trash aria-hidden="true" />
                  Remove number
                </button>
              )}
            </div>

            {phoneError && <InlineNotice type="error">{phoneError}</InlineNotice>}
            {phoneNotice && !phoneError && <InlineNotice type="success">{phoneNotice}</InlineNotice>}

            {phoneStep === 'verify' && (
              <form className="phone-verification" onSubmit={handlePhoneVerification}>
                <div className="verification-panel" role="status" aria-live="polite">
                  <span className="verification-panel__eyebrow">Demo SMS preview · device only</span>
                  <p>Use this code to verify +91 {phoneDraft}</p>
                  <code>{phoneCode}</code>
                  <small>
                    No SMS is sent. This demonstration saves the verified number
                    only in this browser.
                  </small>
                </div>

                <div className="form-field form-field--centered">
                  <label htmlFor="profile-phone-code">4-digit verification code</label>
                  <input
                    id="profile-phone-code"
                    className="code-input"
                    name="phoneCode"
                    type="text"
                    value={phoneCodeInput}
                    onChange={(event) => (
                      setPhoneCodeInput(event.target.value.replace(/\D/g, '').slice(0, 4))
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

                <div className="form-actions form-actions--split">
                  <button type="submit" className="button button--primary">
                    <Check aria-hidden="true" />
                    Verify on this device
                  </button>
                  <button
                    type="button"
                    className="button button--ghost"
                    onClick={() => {
                      setPhoneStep('idle')
                      setPhoneCode('')
                      setPhoneCodeInput('')
                      setPhoneError('')
                      setPhoneNotice('')
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="panel profile-shortcuts" aria-label="Profile shortcuts">
          <SectionHeading
            eyebrow="Shortcuts"
            title="Keep moving"
            description="Jump directly to common account tasks."
          />
          <nav className="shortcut-list">
            <Link to="/predict" className="shortcut-card">
              <span className="shortcut-card__icon"><Lightning aria-hidden="true" /></span>
              <span>
                <strong>Generate prediction</strong>
                <small>Analyze a new shipment</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/history" className="shortcut-card">
              <span className="shortcut-card__icon"><ClockCounterClockwise aria-hidden="true" /></span>
              <span>
                <strong>Prediction history</strong>
                <small>Review the audit trail</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/settings" className="shortcut-card">
              <span className="shortcut-card__icon"><GearSix aria-hidden="true" /></span>
              <span>
                <strong>Account settings</strong>
                <small>Theme and security details</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </nav>
        </aside>
      </div>
    </main>
  )
}
