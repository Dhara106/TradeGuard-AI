import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarBlank,
  Check,
  CheckCircle,
  EnvelopeSimple,
  Key,
  LockKey,
  MoonStars,
  ShieldCheck,
  Sun,
  User,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import {
  InlineNotice,
  PageIntro,
  SectionHeading,
} from '../components/ui.jsx'

const themeOptions = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright canvas with crisp ink and soft operational color.',
    Icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-light canvas with subdued panels and clear status contrast.',
    Icon: MoonStars,
  },
]

const formatJoinedDate = (value) => {
  if (!value) return 'Unavailable'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Settings() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const emailStatus = user?.isVerified === false ? 'Pending verification' : 'Verified'

  return (
    <main className="settings-page workspace-page">
      <PageIntro
        eyebrow="Preferences"
        title="Settings"
        description="Choose how TradeGuard looks and review the security details attached to your account."
        action={(
          <Link to="/profile" className="button button--secondary">
            <User aria-hidden="true" />
            View profile
          </Link>
        )}
      />

      <section className="panel settings-appearance" aria-label="Appearance settings">
        <SectionHeading
          eyebrow="Appearance"
          title="Choose your workspace theme"
          description="Both themes use the same clear hierarchy, status colors, and accessible controls."
        />

        <div className="theme-picker" role="group" aria-label="Color theme">
          {themeOptions.map(({ value, label, description, Icon }) => {
            const active = theme === value
            return (
              <button
                key={value}
                type="button"
                className={
                  active
                    ? 'theme-option theme-option--active'
                    : 'theme-option'
                }
                aria-pressed={active}
                onClick={() => setTheme(value)}
              >
                <span className="theme-option__header">
                  <span className="theme-option__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  {active && (
                    <span className="status-badge status-badge--success">
                      <Check aria-hidden="true" />
                      Active
                    </span>
                  )}
                </span>
                <span className={`theme-option__preview theme-option__preview--${value}`} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <strong>{label}</strong>
                <small>{description}</small>
              </button>
            )
          })}
        </div>

        <InlineNotice type="info">
          Theme preference is saved in this browser and applied immediately.
        </InlineNotice>
      </section>

      <div className="settings-grid">
        <section className="panel settings-panel" aria-label="Account details">
          <SectionHeading
            eyebrow="Account"
            title="Identity details"
            description="Details supplied by your TradeGuard account."
          />

          <dl className="detail-list">
            <div className="detail-list__item">
              <dt><User aria-hidden="true" /> Username</dt>
              <dd>{user?.username || 'Unavailable'}</dd>
            </div>
            <div className="detail-list__item">
              <dt><EnvelopeSimple aria-hidden="true" /> Email</dt>
              <dd>{user?.email || 'Unavailable'}</dd>
            </div>
            <div className="detail-list__item">
              <dt><CalendarBlank aria-hidden="true" /> Member since</dt>
              <dd>{formatJoinedDate(user?.createdAt)}</dd>
            </div>
          </dl>

          <Link to="/profile" className="button button--secondary">
            Edit device-local profile
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className="panel settings-panel" aria-label="Security details">
          <SectionHeading
            eyebrow="Security"
            title="Account protection"
            description="A concise view of the safeguards active on this account."
          />

          <dl className="detail-list">
            <div className="detail-list__item">
              <dt><LockKey aria-hidden="true" /> Password storage</dt>
              <dd>
                <span className="status-badge status-badge--success">
                  <CheckCircle aria-hidden="true" />
                  Bcrypt hashed
                </span>
              </dd>
            </div>
            <div className="detail-list__item">
              <dt><ShieldCheck aria-hidden="true" /> Authentication</dt>
              <dd>
                <span className="status-badge status-badge--success">
                  <CheckCircle aria-hidden="true" />
                  JWT session active
                </span>
              </dd>
            </div>
            <div className="detail-list__item">
              <dt><EnvelopeSimple aria-hidden="true" /> Email status</dt>
              <dd>
                <span
                  className={
                    emailStatus === 'Verified'
                      ? 'status-badge status-badge--success'
                      : 'status-badge status-badge--warning'
                  }
                >
                  {emailStatus === 'Verified'
                    ? <CheckCircle aria-hidden="true" />
                    : <EnvelopeSimple aria-hidden="true" />}
                  {emailStatus}
                </span>
              </dd>
            </div>
          </dl>

          <Link to="/forgot-password" className="button button--primary">
            <Key aria-hidden="true" />
            Change password
          </Link>
        </section>
      </div>
    </main>
  )
}
