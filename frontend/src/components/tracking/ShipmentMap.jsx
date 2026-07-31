import {
  CheckCircle,
  MapPin,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react'

export default function ShipmentMap({
  route = [],
  currentLocation,
  deviated = false,
}) {
  const currentIndex = route.indexOf(currentLocation)

  return (
    <div className={`route-map${deviated ? ' route-map--deviated' : ''}`}>
      <div
        className="route-map__stops"
        role="list"
        aria-label="Fixed shipment simulation route"
      >
        {route.map((city, index) => {
          const reached = !deviated && currentIndex >= 0 && index < currentIndex
          const active = !deviated && currentIndex >= 0 && index === currentIndex
          const state = reached ? 'reached' : active ? 'active' : 'pending'
          const Icon = reached ? CheckCircle : active ? Truck : MapPin

          return (
            <div
              key={city}
              className={`route-stop route-stop--${state}`}
              role="listitem"
              aria-current={active ? 'step' : undefined}
            >
              {index > 0 && <span className="route-stop__connector" aria-hidden="true" />}
              <span className="route-stop__marker" aria-hidden="true">
                <Icon weight={reached || active ? 'fill' : 'regular'} />
              </span>
              <span className="route-stop__copy">
                <strong>{city}</strong>
                <small>{reached ? 'Reached' : active ? 'Current stop' : 'Pending'}</small>
              </span>
            </div>
          )
        })}
      </div>

      {deviated && (
        <div className="route-map__deviation" role="status">
          <WarningCircle weight="fill" />
          <div>
            <strong>{currentLocation || 'Rajkot'}</strong>
            <span>Outside the approved demonstration route</span>
          </div>
        </div>
      )}
    </div>
  )
}
