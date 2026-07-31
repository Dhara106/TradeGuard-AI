import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Broadcast,
  CheckCircle,
  Clock,
  MapPin,
  Package,
  Path,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react'
import {
  advanceShipment,
  deviateShipment,
  getShipments,
  resetShipmentTracking,
} from '../services/api'
import { useToast } from '../context/ToastContext'
import {
  EmptyState,
  InlineNotice,
  LoadingState,
  MetricCard,
  PageIntro,
  RiskBadge,
  SectionHeading,
} from '../components/ui'
import ShipmentMap from '../components/tracking/ShipmentMap'
import RouteTimeline from '../components/tracking/RouteTimeline'
import NotificationsPanel from '../components/tracking/NotificationsPanel'
import TrackingControls from '../components/tracking/TrackingControls'

const SIMULATION_ROUTE = ['Ahmedabad', 'Vadodara', 'Surat', 'Mumbai']

function statusTone(status) {
  if (status === 'Delivered On Time') return 'success'
  if (status === 'Delivered (Delayed)') return 'warning'
  if (status === 'Delayed' || status === 'Route Deviation') return 'danger'
  return 'info'
}

function ShipmentStatus({ status }) {
  const tone = statusTone(status)
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {tone === 'success'
        ? <CheckCircle />
        : tone === 'danger' || tone === 'warning'
          ? <WarningCircle />
          : <Truck />}
      {status}
    </span>
  )
}

export default function Tracking() {
  const { showToast } = useToast()
  const [shipments, setShipments] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [auto, setAuto] = useState(false)
  const [error, setError] = useState('')
  const requestInFlight = useRef(false)

  const active = useMemo(
    () => shipments.find((shipment) => shipment._id === activeId) || null,
    [activeId, shipments],
  )

  const delayedCount = useMemo(
    () => shipments.filter((shipment) => shipment.prediction === 'Delayed').length,
    [shipments],
  )

  const loadShipments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getShipments()
      if (response.data?.success !== true || !Array.isArray(response.data?.data)) {
        throw new Error('The tracking service returned an unexpected response.')
      }

      const records = response.data.data
      setShipments(records)
      setActiveId((current) => (
        records.some((shipment) => shipment._id === current)
          ? current
          : records[0]?._id || null
      ))
    } catch (requestError) {
      console.error('Error loading shipments for tracking:', requestError)
      setError(
        requestError.response?.data?.message
        || requestError.message
        || 'We could not load the tracking simulation.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadShipments()
  }, [loadShipments])

  const updateShipment = useCallback((updated) => {
    setShipments((current) => current.map(
      (shipment) => (shipment._id === updated._id ? updated : shipment),
    ))
  }, [])

  const mutateShipment = useCallback(async (request, failureMessage) => {
    if (requestInFlight.current) return { blocked: true }

    requestInFlight.current = true
    setBusy(true)
    setError('')

    try {
      const response = await request()
      if (response.data?.success !== true || !response.data?.data) {
        throw new Error('The tracking service returned an unexpected response.')
      }

      const updated = response.data.data
      updateShipment(updated)
      return { updated }
    } catch (requestError) {
      console.error('Tracking action failed:', requestError)
      const message = requestError.response?.data?.message || failureMessage
      setError(message)
      showToast(message, 'error')
      return { error: requestError }
    } finally {
      requestInFlight.current = false
      setBusy(false)
    }
  }, [showToast, updateShipment])

  useEffect(() => {
    if (!auto || !activeId) return undefined

    let cancelled = false
    let timer

    const scheduleNextStop = () => {
      timer = window.setTimeout(async () => {
        const outcome = await mutateShipment(
          () => advanceShipment(activeId),
          'Automatic tracking paused because the next stop could not be reached.',
        )

        if (cancelled) return
        if (!outcome.updated) {
          setAuto(false)
          return
        }
        if (outcome.updated.delivered) {
          setAuto(false)
          showToast('Shipment delivered in the simulation.', 'success')
          return
        }

        scheduleNextStop()
      }, 3000)
    }

    scheduleNextStop()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [activeId, auto, mutateShipment, showToast])

  const handleAdvance = async () => {
    if (!active || auto) return
    const outcome = await mutateShipment(
      () => advanceShipment(active._id),
      'The shipment could not advance to the next stop.',
    )
    if (outcome.updated?.delivered) {
      showToast('Shipment delivered in the simulation.', 'success')
    }
  }

  const handleDeviation = async () => {
    if (!active || auto) return
    const outcome = await mutateShipment(
      () => deviateShipment(active._id),
      'The route deviation could not be simulated.',
    )
    if (outcome.updated) showToast('Route deviation detected near Rajkot.', 'warning')
  }

  const handleReset = async () => {
    if (!active || auto) return
    const outcome = await mutateShipment(
      () => resetShipmentTracking(active._id),
      'The tracking simulation could not be reset.',
    )
    if (outcome.updated) showToast('Tracking simulation reset.', 'info')
  }

  const handleAutoToggle = () => {
    if (busy && !auto) return
    setAuto((current) => !current)
  }

  const handleShipmentSelect = (id) => {
    if (busy) return
    setAuto(false)
    setActiveId(id)
    setError('')
  }

  const currentLocation = active?.currentLocation || SIMULATION_ROUTE[0]
  const currentStatus = active?.currentStatus || 'Dispatched'
  const deviated = currentStatus === 'Route Deviation'
  const progress = Number(active?.progress) || 0
  const currentIndex = SIMULATION_ROUTE.indexOf(currentLocation)
  const remainingStops = currentIndex < 0
    ? SIMULATION_ROUTE.length - 1
    : Math.max(0, SIMULATION_ROUTE.length - 1 - currentIndex)
  const eta = active?.delivered
    ? 'Delivered'
    : deviated
      ? 'On hold'
      : remainingStops === 0
        ? 'Arriving'
        : `About ${remainingStops * 3} hours`

  return (
    <main className="tracking-page">
      <div className="app-page">
        <PageIntro
          eyebrow="Tracking lab"
          title="Move a shipment through the demo route"
          description="Use saved AI predictions to simulate location updates, delivery, and route deviations."
          action={(
            <span className="page-mode-badge page-mode-badge--warning">
              <Broadcast />
              Simulation mode
            </span>
          )}
        />

        <InlineNotice type="warning">
          This is a fixed demonstration route: Ahmedabad → Vadodara → Surat → Mumbai.
          It does not replace live carrier tracking or the shipment&apos;s submitted origin and destination.
        </InlineNotice>

        {error && <InlineNotice type="error">{error}</InlineNotice>}

        {loading ? (
          <LoadingState label="Loading shipments into the tracking lab…" />
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title={error ? 'Tracking is unavailable' : 'No shipments to simulate yet'}
            description={
              error
                ? 'Retry the tracking service, or return after the backend is available.'
                : 'Analyze a shipment first. Its saved prediction will automatically appear here.'
            }
            actionLabel={error ? 'Retry tracking' : 'Analyze a shipment'}
            actionTo={error ? undefined : '/predict'}
            onAction={error ? loadShipments : undefined}
          />
        ) : (
          <>
            <section className="tracking-selector" aria-labelledby="shipment-selector-title">
              <SectionHeading
                eyebrow="Saved predictions"
                title="Choose a shipment"
                description={`${shipments.length} shipment${shipments.length === 1 ? '' : 's'} available · ${delayedCount} predicted delayed`}
              />
              <div className="shipment-pills" role="tablist" aria-label="Shipments">
                {shipments.map((shipment) => (
                  <button
                    key={shipment._id}
                    type="button"
                    role="tab"
                    aria-selected={shipment._id === activeId}
                    className={`shipment-pill${shipment._id === activeId ? ' shipment-pill--active' : ''}`}
                    onClick={() => handleShipmentSelect(shipment._id)}
                    disabled={busy}
                  >
                    <Truck />
                    <span>
                      <strong>{shipment.origin} → {shipment.destination}</strong>
                      <small>#{shipment._id.slice(-6).toUpperCase()}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {active && (
              <>
                <section className="workspace-panel tracking-overview" aria-labelledby="tracking-overview-title">
                  <div className="tracking-overview__header">
                    <div>
                      <span className="eyebrow">Active simulation</span>
                      <h2 id="tracking-overview-title">
                        {active.origin} → {active.destination}
                      </h2>
                      <p>Record #{active._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <div className="tracking-overview__badges">
                      <ShipmentStatus status={currentStatus} />
                      <RiskBadge
                        prediction={active.prediction}
                        score={active.riskScore}
                        label={`AI: ${active.prediction}`}
                      />
                    </div>
                  </div>

                  <ShipmentMap
                    route={SIMULATION_ROUTE}
                    currentLocation={currentLocation}
                    deviated={deviated}
                  />

                  <div className="tracking-progress">
                    <div className="tracking-progress__label">
                      <span>Simulation progress</span>
                      <strong>{progress}%</strong>
                    </div>
                    <div
                      className="tracking-progress__track"
                      role="progressbar"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={progress}
                    >
                      <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                    </div>
                  </div>

                  <div className="tracking-metrics">
                    <MetricCard
                      label="Current location"
                      value={currentLocation}
                      detail={deviated ? 'Outside approved demo route' : 'Latest simulated stop'}
                      tone={deviated ? 'rose' : 'yellow'}
                      icon={<MapPin />}
                    />
                    <MetricCard
                      label="Estimated arrival"
                      value={eta}
                      detail={
                        active.delivered
                          ? 'Simulation complete'
                          : deviated
                            ? 'Simulation paused off route'
                            : `${remainingStops} route stops remaining`
                      }
                      tone="lavender"
                      icon={<Clock />}
                    />
                    <MetricCard
                      label="Risk coefficient"
                      value={`${active.riskScore}%`}
                      detail={`${active.predictedDelay || 0} day predicted delay`}
                      tone={active.riskScore > 70 ? 'rose' : 'teal'}
                      icon={<WarningCircle />}
                    />
                  </div>

                  {active.delivered && (
                    <InlineNotice type={active.prediction === 'Delayed' ? 'warning' : 'success'}>
                      {active.currentStatus}.{' '}
                      {active.deliveryTime
                        ? `Completed ${new Date(active.deliveryTime).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}.`
                        : 'The simulation is complete.'}
                    </InlineNotice>
                  )}

                  {deviated && !active.delivered && (
                    <InlineNotice type="error">
                      Route deviation detected near Rajkot. The backend increased this shipment&apos;s
                      risk score to {active.riskScore}%.
                    </InlineNotice>
                  )}
                </section>

                <TrackingControls
                  onAdvance={handleAdvance}
                  onDeviate={handleDeviation}
                  onReset={handleReset}
                  onToggleAuto={handleAutoToggle}
                  auto={auto}
                  delivered={Boolean(active.delivered)}
                  busy={busy}
                />

                <div className="tracking-details">
                  <section className="workspace-panel tracking-timeline-panel">
                    <SectionHeading
                      eyebrow="Route events"
                      title="Simulation timeline"
                      description="Reached, current, and pending stops on the fixed demonstration route."
                      action={<Path />}
                    />
                    <RouteTimeline
                      route={SIMULATION_ROUTE}
                      currentLocation={currentLocation}
                      deviated={deviated}
                    />
                  </section>
                  <NotificationsPanel notifications={active.notifications || []} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
