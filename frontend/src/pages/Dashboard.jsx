import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Pulse,
  ArrowRight,
  CheckCircle,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react'
import { getShipments, getStats } from '../services/api'
// The charting library is ~98% of this route's payload. Splitting it out lets the
// metric cards and the shipment table paint immediately while it streams in.
const ShipmentChart = lazy(() => import('../components/ShipmentChart'))
import ShipmentTable from '../components/ShipmentTable'
import {
  InlineNotice,
  LoadingState,
  MetricCard,
  PageIntro,
  RiskBadge,
  SectionHeading,
} from '../components/ui'

const EMPTY_STATS = {
  totalShipments: 0,
  delayedCount: 0,
  onTimeCount: 0,
  avgRiskScore: 0,
}

export default function Dashboard() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [shipments, setShipments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchDashboard = async () => {
      try {
        const [statsResponse, shipmentsResponse] = await Promise.all([
          getStats(),
          getShipments(),
        ])

        if (!active) return
        if (statsResponse.data?.success) {
          setStats({ ...EMPTY_STATS, ...(statsResponse.data.stats || {}) })
        }
        if (shipmentsResponse.data?.success) {
          setShipments(shipmentsResponse.data.data || [])
        }
      } catch (requestError) {
        if (!active) return
        console.error('Error fetching dashboard data:', requestError)
        setError('We could not refresh your shipment intelligence. Check the services and try again.')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchDashboard()
    return () => {
      active = false
    }
  }, [])

  const delayedRate = stats.totalShipments
    ? Math.round((stats.delayedCount / stats.totalShipments) * 100)
    : 0
  const onTimeRate = stats.totalShipments
    ? Math.round((stats.onTimeCount / stats.totalShipments) * 100)
    : 0

  const recentShipments = shipments.slice(0, 5)
  const highestRiskShipment = useMemo(
    () => shipments.reduce(
      (highest, shipment) => (
        !highest || Number(shipment.riskScore) > Number(highest.riskScore) ? shipment : highest
      ),
      null,
    ),
    [shipments],
  )

  if (loading) {
    return (
      <main className="dashboard-page dashboard-page--loading">
        <LoadingState label="Preparing your logistics control room…" />
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <div className="app-page">
        <PageIntro
          eyebrow="Shipment intelligence"
          title="Your logistics control room"
          description="See delivery exposure, route performance, and the shipments that need attention."
          action={(
            <Link to="/predict" className="button button--primary">
              <Truck />
              Analyze shipment
            </Link>
          )}
        />

        {error && <InlineNotice type="error">{error}</InlineNotice>}

        <section className="dashboard-metrics" aria-label="Shipment summary">
          <MetricCard
            label="Cargo tracked"
            value={stats.totalShipments}
            detail={`${shipments.length} records in your audit log`}
            tone="yellow"
            icon={<Truck />}
          />
          <MetricCard
            label="Delayed alerts"
            value={stats.delayedCount}
            detail={`${delayedRate}% of analyzed cargo`}
            tone="rose"
            icon={<WarningCircle />}
          />
          <MetricCard
            label="On-time predictions"
            value={stats.onTimeCount}
            detail={`${onTimeRate}% of analyzed cargo`}
            tone="teal"
            icon={<CheckCircle />}
          />
          <MetricCard
            label="Average risk"
            value={`${stats.avgRiskScore}%`}
            detail={stats.avgRiskScore > 50 ? 'Elevated network exposure' : 'Network exposure is controlled'}
            tone="lavender"
            icon={<Pulse />}
          />
        </section>

        <section className="dashboard-workspace">
          <article className="workspace-panel workspace-panel--charts">
            <SectionHeading
              eyebrow="Live overview"
              title="Risk distribution"
              description="A visual read of delivery outcomes and risk concentration across your shipment history."
            />
            <Suspense fallback={<LoadingState compact label="Preparing charts…" />}>
              <ShipmentChart shipments={shipments} />
            </Suspense>
          </article>

          <aside className="workspace-panel workspace-panel--signals">
            <SectionHeading
              eyebrow="AI signals"
              title="What needs attention"
              description="A quick briefing generated from your current shipment records."
            />

            <div className="signal-stack">
              <article className="signal-note signal-note--yellow">
                <span className="signal-note__label">Delivery health</span>
                <strong>{onTimeRate}% predicted on time</strong>
                <p>
                  {stats.totalShipments
                    ? `${stats.delayedCount} of ${stats.totalShipments} shipments carry a delay alert.`
                    : 'Analyze your first shipment to establish a delivery baseline.'}
                </p>
              </article>

              <article className="signal-note signal-note--rose">
                <span className="signal-note__label">Highest exposure</span>
                {highestRiskShipment ? (
                  <>
                    <strong>{highestRiskShipment.origin} → {highestRiskShipment.destination}</strong>
                    <p>{highestRiskShipment.carrier} · {highestRiskShipment.riskScore}% risk coefficient</p>
                    <RiskBadge
                      prediction={highestRiskShipment.prediction}
                      score={highestRiskShipment.riskScore}
                    />
                  </>
                ) : (
                  <>
                    <strong>No exposure recorded</strong>
                    <p>Your highest-risk route will appear here after an analysis.</p>
                  </>
                )}
              </article>
            </div>

            <Link to="/history" className="button button--secondary workspace-panel__action">
              Open audit log
              <ArrowRight />
            </Link>
          </aside>
        </section>

        <section className="recent-shipments">
          <SectionHeading
            eyebrow="Recent activity"
            title="Latest shipment analyses"
            description="The five most recent records from your logistics audit trail."
            action={(
              <Link to="/history" className="button-link">
                View all records
                <ArrowRight />
              </Link>
            )}
          />
          <ShipmentTable shipments={recentShipments} />
        </section>
      </div>
    </main>
  )
}
