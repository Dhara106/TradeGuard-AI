import {
  Bell,
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react'
import { SectionHeading } from '../ui'

const NOTIFICATION_TONES = {
  success: { Icon: CheckCircle, className: 'notification-item--success' },
  info: { Icon: Info, className: 'notification-item--info' },
  warning: { Icon: WarningCircle, className: 'notification-item--warning' },
  error: { Icon: XCircle, className: 'notification-item--error' },
}

function formatTimestamp(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsPanel({ notifications = [] }) {
  const items = Array.isArray(notifications) ? [...notifications].reverse() : []

  return (
    <aside className="workspace-panel notification-panel" aria-labelledby="notifications-title">
      <SectionHeading
        eyebrow="Event feed"
        title="Notifications"
        description="Backend-generated updates for the active tracking simulation."
        action={(
          <span className="notification-panel__count" aria-label={`${items.length} notifications`}>
            <Bell />
            {items.length}
          </span>
        )}
      />

      {items.length === 0 ? (
        <div className="notification-panel__empty">
          <Bell />
          <p>No simulation events have been recorded yet.</p>
        </div>
      ) : (
        <ol className="notification-list" aria-live="polite">
          {items.map((notification) => {
            const tone = NOTIFICATION_TONES[notification.type] || NOTIFICATION_TONES.info
            const Icon = tone.Icon

            return (
              <li
                // Keyed on identity, never on index: the list is reversed, so a new
                // event shifts every index and re-keyed every row — remounting the
                // whole list and making aria-live re-announce all of it each tick.
                key={notification._id || `${notification.createdAt}-${notification.message}`}
                className={`notification-item ${tone.className}`}
              >
                <span className="notification-item__icon" aria-hidden="true">
                  <Icon weight="fill" />
                </span>
                <div className="notification-item__copy">
                  <p>{notification.message}</p>
                  {formatTimestamp(notification.createdAt) && (
                    <time dateTime={notification.createdAt}>
                      {formatTimestamp(notification.createdAt)}
                    </time>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}
