import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  CaretUp,
  Package,
  Trash,
} from '@phosphor-icons/react'
import { EmptyState, RiskBadge } from './ui'

const formatDate = (dateValue) => {
  if (!dateValue) return 'Date unavailable'

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatWeight = (weight) => {
  const value = Number(weight)
  return Number.isFinite(value) ? `${value.toLocaleString('en-IN')} kg` : '—'
}

const riskTone = (score) => {
  const value = Number(score)
  if (value > 70) return 'high'
  if (value >= 35) return 'medium'
  return 'low'
}

function SortButton({ field, label, onSort, sortKey, sortOrder }) {
  if (!onSort) return <span>{label}</span>

  const active = sortKey === field
  const Icon = active && sortOrder === 'asc' ? CaretUp : CaretDown

  return (
    <button
      type="button"
      className={`shipment-sort${active ? ' shipment-sort--active' : ''}`}
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      <Icon aria-hidden="true" />
    </button>
  )
}

function ShipmentRoute({ shipment }) {
  return (
    <span className="shipment-route">
      <span>{shipment.origin}</span>
      <ArrowRight aria-hidden="true" />
      <span>{shipment.destination}</span>
    </span>
  )
}

function DeleteButton({ shipmentId, onDelete }) {
  return (
    <button
      type="button"
      className="icon-button icon-button--danger"
      onClick={() => onDelete(shipmentId)}
      aria-label="Delete shipment record"
      title="Delete shipment record"
    >
      <Trash aria-hidden="true" />
    </button>
  )
}

export default function ShipmentTable({
  shipments = [],
  onDelete,
  showDelete = false,
  onSort,
  sortKey,
  sortOrder,
}) {
  if (shipments.length === 0) {
    return (
      <div className="shipment-records shipment-records--empty">
        <EmptyState
          icon={<Package />}
          title="No shipment records"
          description="New analyses will appear here as soon as they are created."
        />
      </div>
    )
  }

  return (
    <div className="shipment-records">
      <div className="shipment-table-view">
        <table className="shipment-table">
          <caption className="sr-only">Shipment risk audit records</caption>
          <thead>
            <tr>
              <th aria-sort={sortKey === 'createdAt' ? `${sortOrder}ending` : 'none'}>
                <SortButton
                  field="createdAt"
                  label="Analyzed"
                  onSort={onSort}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th>Route</th>
              <th aria-sort={sortKey === 'weight' ? `${sortOrder}ending` : 'none'}>
                <SortButton
                  field="weight"
                  label="Weight"
                  onSort={onSort}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th>Carrier</th>
              <th aria-sort={sortKey === 'riskScore' ? `${sortOrder}ending` : 'none'}>
                <SortButton
                  field="riskScore"
                  label="Risk"
                  onSort={onSort}
                  sortKey={sortKey}
                  sortOrder={sortOrder}
                />
              </th>
              <th>Verdict</th>
              {showDelete && <th><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => (
              <tr key={shipment._id}>
                <td>
                  <time className="shipment-date" dateTime={shipment.createdAt || undefined}>
                    {formatDate(shipment.createdAt)}
                  </time>
                </td>
                <td><ShipmentRoute shipment={shipment} /></td>
                <td>{formatWeight(shipment.weight)}</td>
                <td><span className="shipment-carrier">{shipment.carrier}</span></td>
                <td>
                  <strong className={`shipment-risk shipment-risk--${riskTone(shipment.riskScore)}`}>
                    {shipment.riskScore}%
                  </strong>
                </td>
                <td>
                  <RiskBadge
                    prediction={shipment.prediction}
                    score={shipment.riskScore}
                  />
                </td>
                {showDelete && (
                  <td>
                    <DeleteButton shipmentId={shipment._id} onDelete={onDelete} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="shipment-card-list">
        {shipments.map((shipment) => (
          <article className="shipment-audit-card" key={shipment._id}>
            <header className="shipment-audit-card__header">
              <span className="shipment-audit-card__reference">
                #{String(shipment._id).slice(-6).toUpperCase()}
              </span>
              <RiskBadge
                prediction={shipment.prediction}
                score={shipment.riskScore}
              />
            </header>

            <div className="shipment-audit-card__route">
              <ShipmentRoute shipment={shipment} />
            </div>

            <time
              className="shipment-audit-card__date"
              dateTime={shipment.createdAt || undefined}
            >
              <CalendarBlank aria-hidden="true" />
              {formatDate(shipment.createdAt)}
            </time>

            <dl className="shipment-audit-card__details">
              <div>
                <dt>Carrier</dt>
                <dd>{shipment.carrier}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{formatWeight(shipment.weight)}</dd>
              </div>
              <div>
                <dt>Risk coefficient</dt>
                <dd className={`shipment-risk shipment-risk--${riskTone(shipment.riskScore)}`}>
                  {shipment.riskScore}%
                </dd>
              </div>
            </dl>

            {showDelete && (
              <footer className="shipment-audit-card__footer">
                <button
                  type="button"
                  className="button-link button-link--danger"
                  onClick={() => onDelete(shipment._id)}
                >
                  <Trash aria-hidden="true" />
                  Remove record
                </button>
              </footer>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
