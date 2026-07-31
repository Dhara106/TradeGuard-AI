import { Link } from 'react-router-dom'
import {
  ArrowRight,
  House,
  NavigationArrow,
} from '@phosphor-icons/react'
import { BrandMark } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-page__brand">
        <Link to="/" aria-label="TradeGuard AI home">
          <BrandMark />
        </Link>
      </div>

      <div className="not-found-page__content">
        <div className="route-deviation" aria-hidden="true">
          <span className="route-deviation__origin" />
          <span className="route-deviation__line" />
          <span className="route-deviation__break">
            <NavigationArrow />
          </span>
          <span className="route-deviation__code">404</span>
        </div>

        <span className="eyebrow">Route deviation detected</span>
        <h1>This page took a wrong turn.</h1>
        <p>
          The destination does not exist, or the route has changed. Return home
          or continue to the TradeGuard dashboard.
        </p>

        <div className="not-found-page__actions">
          <Link to="/" className="button button--primary">
            <House aria-hidden="true" />
            Go home
          </Link>
          <Link to="/dashboard" className="button button--secondary">
            Open dashboard
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  )
}
