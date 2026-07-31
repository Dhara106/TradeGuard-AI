import { Link } from 'react-router-dom'
import {
  Pulse,
  ArrowRight,
  Check,
  CloudRain,
  FileText,
  Lightning,
  MapTrifold,
  ShieldCheck,
  TrendUp,
  Truck,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  MetricCard,
  ProductBoard,
  SectionHeading,
} from '../components/ui.jsx'

const metrics = [
  {
    label: 'Risk assessment',
    value: 'Instant',
    detail: 'A clear prediction before dispatch',
    tone: 'yellow',
    icon: <Lightning />,
  },
  {
    label: 'Weather context',
    value: 'Live',
    detail: 'Conditions detected at the origin hub',
    tone: 'teal',
    icon: <CloudRain />,
  },
  {
    label: 'Route visibility',
    value: 'End to end',
    detail: 'From dispatch through delivery',
    tone: 'rose',
    icon: <MapTrifold />,
  },
  {
    label: 'Decision history',
    value: 'One trail',
    detail: 'Every prediction stays auditable',
    tone: 'plain',
    icon: <FileText />,
  },
]

const features = [
  {
    icon: <ShieldCheck />,
    eyebrow: 'Predict',
    title: 'See delivery risk before cargo moves.',
    description:
      'Combine route, carrier, cargo, weather, and traffic signals into one understandable risk score.',
    tone: 'yellow',
  },
  {
    icon: <Truck />,
    eyebrow: 'Track',
    title: 'Keep every active shipment in view.',
    description:
      'Follow route progress, surface deviations, and give operators one place to coordinate the next action.',
    tone: 'teal',
  },
  {
    icon: <TrendUp />,
    eyebrow: 'Improve',
    title: 'Turn prediction history into better decisions.',
    description:
      'Compare outcomes, spot recurring risk patterns, and maintain a useful audit trail for your logistics team.',
    tone: 'rose',
  },
]

const steps = [
  {
    number: '01',
    title: 'Describe the shipment',
    description: 'Choose the route and carrier, then add cargo weight and operating conditions.',
  },
  {
    number: '02',
    title: 'Run the risk model',
    description: 'TradeGuard evaluates the shipment and returns a confidence-backed prediction.',
  },
  {
    number: '03',
    title: 'Act with context',
    description: 'Review the explanation, track the route, and keep the decision in your audit log.',
  },
]

export default function Landing() {
  const { token } = useAuth()
  const primaryDestination = token ? '/dashboard' : '/register'
  const secondaryDestination = token ? '/predict' : '/login'

  return (
    <main className="landing-page">
      <section className="marketing-hero" aria-labelledby="tradeguard-hero-title">
        <div className="marketing-hero__inner">
          <div className="marketing-hero__copy">
            <span className="eyebrow">
              <Pulse aria-hidden="true" />
              AI-powered shipment intelligence
            </span>
            <h1 id="tradeguard-hero-title">
              Know the risk before the shipment leaves.
            </h1>
            <p>
              TradeGuard AI brings prediction, live route context, and shipment
              history into one focused operations workspace.
            </p>

            <div className="marketing-hero__actions">
              <Link to={primaryDestination} className="button button--primary">
                {token ? 'Open dashboard' : 'Start free'}
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link to={secondaryDestination} className="button button--secondary">
                {token ? 'Analyze a shipment' : 'Sign in'}
              </Link>
            </div>

            <ul className="marketing-hero__assurances" aria-label="Product highlights">
              <li><Check aria-hidden="true" /> Live weather context</li>
              <li><Check aria-hidden="true" /> Explainable risk signals</li>
              <li><Check aria-hidden="true" /> No setup required</li>
            </ul>
          </div>

          <div className="marketing-hero__visual">
            <ProductBoard />
            <span className="marketing-hero__visual-caption">
              Live operations view · updated as shipments move
            </span>
          </div>
        </div>
      </section>

      <section id="results" className="marketing-section marketing-section--metrics" aria-label="TradeGuard capabilities">
        <div className="marketing-section__inner">
          <div className="stats-grid">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="marketing-section" aria-label="TradeGuard product capabilities">
        <div className="marketing-section__inner">
          <SectionHeading
            eyebrow="One risk workspace"
            title="From prediction to delivery, keep the full picture together."
            description="Purpose-built tools help logistics teams understand risk early and respond without losing context."
            align="center"
          />

          <div className="feature-grid">
            {features.map((feature) => (
              <article
                key={feature.title}
                className={`feature-card feature-card--${feature.tone}`}
              >
                <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
                <span className="feature-card__eyebrow">{feature.eyebrow}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="marketing-section marketing-section--soft" aria-label="How TradeGuard works">
        <div className="marketing-section__inner">
          <SectionHeading
            eyebrow="Simple workflow"
            title="A useful answer in three clear steps."
            description="Start with the facts your team already has. TradeGuard adds the intelligence layer."
            align="center"
          />

          <ol className="steps-grid">
            {steps.map((step) => (
              <li key={step.number} className="step-card">
                <span className="step-card__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="marketing-section" aria-labelledby="closing-cta-title">
        <div className="marketing-section__inner">
          <div className="marketing-cta">
            <div className="marketing-cta__copy">
              <span className="eyebrow">Make the next move with confidence</span>
              <h2 id="closing-cta-title">Give every shipment a risk check before dispatch.</h2>
              <p>
                Create an account, analyze your first route, and keep the result
                connected to the shipment throughout its journey.
              </p>
            </div>
            <Link to={token ? '/predict' : '/register'} className="button button--on-dark">
              {token ? 'Analyze a shipment' : 'Create free account'}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
