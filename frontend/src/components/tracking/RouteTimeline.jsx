import {
  CheckCircle,
  MapPin,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react'

export default function RouteTimeline({
  route = [],
  currentLocation,
  deviated = false,
}) {
  const currentIndex = route.indexOf(currentLocation)

  return (
    <ol className="route-timeline">
      {deviated && (
        <li className="route-timeline__item route-timeline__item--deviation">
          <span className="route-timeline__marker"><WarningCircle weight="fill" /></span>
          <div>
            <strong>{currentLocation || 'Off-route location'}</strong>
            <p>Route deviation detected; the approved simulation path is paused.</p>
          </div>
        </li>
      )}

      {route.map((city, index) => {
        const reached = !deviated && currentIndex >= 0 && index < currentIndex
        const active = !deviated && currentIndex >= 0 && index === currentIndex
        const state = reached ? 'reached' : active ? 'active' : 'pending'
        const Icon = reached ? CheckCircle : active ? Truck : MapPin

        return (
          <li
            key={city}
            className={`route-timeline__item route-timeline__item--${state}`}
          >
            <span className="route-timeline__marker" aria-hidden="true">
              <Icon weight={reached || active ? 'fill' : 'regular'} />
            </span>
            <div>
              <strong>{city}</strong>
              <p>
                {reached ? 'Reached' : active ? 'Current simulated stop' : 'Pending'}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
