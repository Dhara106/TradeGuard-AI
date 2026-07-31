import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CloudRain,
  Drop,
  Gauge,
  Lightning,
  MapPin,
  Package,
  Pulse,
  SpinnerGap,
  Thermometer,
  TrendUp,
  Truck,
  WarningCircle,
} from '@phosphor-icons/react'
import { predictShipment } from '../services/api'
import {
  getOverallRisk,
  getTrafficPrediction,
  getWeatherPrediction,
} from '../utils/riskLogic'
import {
  EmptyState,
  InlineNotice,
  LoadingState,
  MetricCard,
  PageIntro,
  RiskBadge,
  SectionHeading,
} from '../components/ui'

const CITIES = [
  'Ahmedabad',
  'Bangalore',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Jaipur',
  'Kolkata',
  'Lucknow',
  'Mumbai',
  'Pune',
]

const CARRIERS = ['BlueDart', 'DHL', 'DTDC', 'Delhivery', 'FedEx']

const CITY_COORDS = {
  Ahmedabad: { lat: 23.0225, lon: 72.5714 },
  Bangalore: { lat: 12.9716, lon: 77.5946 },
  Chennai: { lat: 13.0827, lon: 80.2707 },
  Delhi: { lat: 28.6139, lon: 77.209 },
  Hyderabad: { lat: 17.385, lon: 78.4867 },
  Jaipur: { lat: 26.9124, lon: 75.7873 },
  Kolkata: { lat: 22.5726, lon: 88.3639 },
  Lucknow: { lat: 26.8467, lon: 80.9462 },
  Mumbai: { lat: 19.076, lon: 72.8777 },
  Pune: { lat: 18.5204, lon: 73.8567 },
}

const INITIAL_FORM = {
  origin: 'Mumbai',
  destination: 'Delhi',
  weight: '',
  carrier: 'BlueDart',
  weatherScore: 5,
  trafficScore: 5,
}

function weatherFromCode(code) {
  if (code === 0) return { score: 1, label: 'Sunny and clear' }
  if ([1, 2, 3].includes(code)) return { score: 3, label: 'Partly cloudy' }
  if ([51, 53, 55].includes(code)) return { score: 4, label: 'Light drizzle' }
  if ([45, 48].includes(code)) return { score: 5, label: 'Fog or mist' }
  if ([61, 63, 65, 80, 81, 82].includes(code)) return { score: 7, label: 'Rain showers' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { score: 8, label: 'Snow or hail' }
  if ([95, 96, 99].includes(code)) return { score: 10, label: 'Severe thunderstorm' }
  return { score: 2, label: 'Clear conditions' }
}

function trafficFromHour(hour) {
  if ((hour >= 9 && hour <= 11) || (hour >= 18 && hour <= 20)) {
    return { score: 8, label: 'Peak-hour gridlock' }
  }
  if (hour >= 23 || hour <= 5) {
    return { score: 2, label: 'Clear highways' }
  }
  if (hour >= 13 && hour <= 16) {
    return { score: 5, label: 'Active freight flow' }
  }
  return { score: 4, label: 'Moderate traffic' }
}

function validateShipment(input) {
  if (!input.origin || !input.destination || !input.carrier) {
    return 'Choose an origin, destination, and carrier.'
  }
  if (input.origin === input.destination) {
    return 'Origin and destination must be different cities.'
  }

  const weight = Number(input.weight)
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 10000) {
    return 'Cargo weight must be between 0.1 kg and 10,000 kg.'
  }

  const weatherScore = Number(input.weatherScore)
  const trafficScore = Number(input.trafficScore)
  if (
    !Number.isInteger(weatherScore)
    || !Number.isInteger(trafficScore)
    || weatherScore < 1
    || weatherScore > 10
    || trafficScore < 1
    || trafficScore > 10
  ) {
    return 'Weather and traffic scores must be whole numbers from 1 to 10.'
  }

  return ''
}

function riskTone(risk) {
  if (risk === 'Very High' || risk === 'High') return 'danger'
  if (risk === 'Medium') return 'warning'
  return 'success'
}

function RiskLabel({ risk }) {
  const tone = riskTone(risk)
  return (
    <span className={`status-badge status-badge--${tone}`}>
      {tone === 'success' ? <CheckCircle /> : <WarningCircle />}
      {risk} risk
    </span>
  )
}

export default function Predict() {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [result, setResult] = useState(null)
  const [submittedInput, setSubmittedInput] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [conditionNotice, setConditionNotice] = useState('')
  const [error, setError] = useState('')

  const analysis = useMemo(() => {
    if (!result || !submittedInput) return null
    const weather = getWeatherPrediction(submittedInput.weatherScore)
    const traffic = getTrafficPrediction(submittedInput.trafficScore)
    const overall = getOverallRisk(result.riskScore, weather, traffic)
    return { weather, traffic, overall }
  }, [result, submittedInput])

  const handleFieldChange = (event) => {
    const { name, value } = event.target
    setError('')

    setFormData((current) => {
      if (name === 'origin' && value === current.destination) {
        return {
          ...current,
          origin: value,
          destination: CITIES.find((city) => city !== value),
        }
      }
      return { ...current, [name]: value }
    })
  }

  const handleScoreChange = (name, value) => {
    setError('')
    setFormData((current) => ({ ...current, [name]: Number(value) }))
  }

  const handleAutoDetect = async () => {
    const originCity = formData.origin
    const coords = CITY_COORDS[originCity]
    if (!coords || detecting) return

    setDetecting(true)
    setError('')
    setConditionNotice('')

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`
      const response = await fetch(weatherUrl)
      if (!response.ok) {
        throw new Error(`Weather service returned HTTP ${response.status}.`)
      }

      const data = await response.json()
      const weather = weatherFromCode(data?.current_weather?.weathercode)
      const traffic = trafficFromHour(new Date().getHours())

      setFormData((current) => ({
        ...current,
        weatherScore: weather.score,
        trafficScore: traffic.score,
      }))
      setConditionNotice(
        `${weather.label} (${weather.score}/10) near ${originCity}; ${traffic.label.toLowerCase()} (${traffic.score}/10).`,
      )
    } catch (requestError) {
      console.error('Error detecting live conditions:', requestError)
      setFormData((current) => ({
        ...current,
        weatherScore: 5,
        trafficScore: 5,
      }))
      setError('Live conditions are unavailable, so both scores were reset to a neutral 5/10.')
    } finally {
      setDetecting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading || detecting) return

    const validationError = validateShipment(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      origin: formData.origin,
      destination: formData.destination,
      weight: Number(formData.weight),
      carrier: formData.carrier,
      weatherScore: Number(formData.weatherScore),
      trafficScore: Number(formData.trafficScore),
    }

    setLoading(true)
    setError('')
    setResult(null)
    setSubmittedInput(null)

    try {
      const response = await predictShipment(payload)
      if (
        response.status !== 201
        || response.data?.success !== true
        || !response.data?.data
      ) {
        throw new Error('The prediction service returned an unexpected response.')
      }

      setSubmittedInput(payload)
      setResult(response.data.data)
    } catch (requestError) {
      console.error('Error submitting prediction:', requestError)
      setError(
        requestError.response?.data?.message
        || requestError.message
        || 'We could not reach the AI predictor. Check the services and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="predict-page">
      <div className="app-page">
        <PageIntro
          eyebrow="AI risk studio"
          title="Understand delivery risk before dispatch"
          description="Combine route, cargo, weather, and traffic signals into one explainable shipment forecast."
          action={(
            <span className="page-mode-badge">
              <Pulse />
              Random forest model
            </span>
          )}
        />

        <div className="predict-workspace">
          <section className="workspace-panel predict-form-panel">
            <SectionHeading
              eyebrow="Shipment brief"
              title="Set the operating conditions"
              description="The model uses these six inputs to create and save a trackable shipment record."
            />

            <form className="predict-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
              <div className="predict-form__grid">
                <div className="form-field">
                  <label htmlFor="predict-origin">Origin hub</label>
                  <div className="input-frame">
                    <MapPin aria-hidden="true" />
                    <select
                      id="predict-origin"
                      name="origin"
                      value={formData.origin}
                      onChange={handleFieldChange}
                      disabled={loading || detecting}
                    >
                      {CITIES.map((city) => <option key={city}>{city}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="predict-destination">Destination hub</label>
                  <div className="input-frame">
                    <ArrowRight aria-hidden="true" />
                    <select
                      id="predict-destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleFieldChange}
                      disabled={loading || detecting}
                    >
                      {CITIES.filter((city) => city !== formData.origin).map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="predict-weight">Cargo weight</label>
                  <div className="input-frame">
                    <Package aria-hidden="true" />
                    <input
                      id="predict-weight"
                      name="weight"
                      type="number"
                      min="0.1"
                      max="10000"
                      step="0.1"
                      value={formData.weight}
                      onChange={handleFieldChange}
                      placeholder="Weight in kilograms"
                      inputMode="decimal"
                      disabled={loading || detecting}
                      required
                    />
                    <span className="input-frame__suffix">kg</span>
                  </div>
                  <small>Accepted range: 0.1–10,000 kg</small>
                </div>

                <div className="form-field">
                  <label htmlFor="predict-carrier">Shipping carrier</label>
                  <div className="input-frame">
                    <Truck aria-hidden="true" />
                    <select
                      id="predict-carrier"
                      name="carrier"
                      value={formData.carrier}
                      onChange={handleFieldChange}
                      disabled={loading || detecting}
                    >
                      {CARRIERS.map((carrier) => <option key={carrier}>{carrier}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <section className="condition-panel" aria-labelledby="conditions-title">
                <div className="condition-panel__header">
                  <div>
                    <span className="eyebrow">Environment signals</span>
                    <h3 id="conditions-title">Weather and traffic</h3>
                    <p>Set each score manually or use live weather at the origin hub.</p>
                  </div>
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={handleAutoDetect}
                    disabled={detecting || loading}
                  >
                    {detecting ? <SpinnerGap className="is-spinning" /> : <Lightning />}
                    {detecting ? 'Detecting…' : 'Detect live conditions'}
                  </button>
                </div>

                {conditionNotice && <InlineNotice type="success">{conditionNotice}</InlineNotice>}

                <div className="condition-sliders">
                  <label className="score-control" htmlFor="weather-score">
                    <span className="score-control__heading">
                      <span><CloudRain /> Weather severity</span>
                      <strong>{formData.weatherScore}/10</strong>
                    </span>
                    <input
                      id="weather-score"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.weatherScore}
                      onChange={(event) => handleScoreChange('weatherScore', event.target.value)}
                      disabled={loading || detecting}
                    />
                    <span className="score-control__scale">
                      <small>Clear</small>
                      <small>Severe</small>
                    </span>
                  </label>

                  <label className="score-control" htmlFor="traffic-score">
                    <span className="score-control__heading">
                      <span><Truck /> Traffic congestion</span>
                      <strong>{formData.trafficScore}/10</strong>
                    </span>
                    <input
                      id="traffic-score"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.trafficScore}
                      onChange={(event) => handleScoreChange('trafficScore', event.target.value)}
                      disabled={loading || detecting}
                    />
                    <span className="score-control__scale">
                      <small>Light</small>
                      <small>Gridlock</small>
                    </span>
                  </label>
                </div>
              </section>

              {error && <InlineNotice type="error">{error}</InlineNotice>}

              <button
                type="submit"
                className="button button--primary button--full predict-form__submit"
                disabled={loading || detecting}
              >
                {loading ? (
                  <>
                    <SpinnerGap className="is-spinning" />
                    Running risk analysis…
                  </>
                ) : (
                  <>
                    Analyze delivery risk
                    <ArrowRight />
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="workspace-panel predict-result-panel" aria-live="polite">
            {loading ? (
              <LoadingState label="Comparing route signals with the trained model…" />
            ) : result && analysis ? (
              <>
                <div className="prediction-result__header">
                  <div>
                    <span className="eyebrow">Model decision</span>
                    <h2>{submittedInput.origin} → {submittedInput.destination}</h2>
                  </div>
                  <RiskBadge prediction={result.prediction} score={result.riskScore} />
                </div>

                <div className="prediction-score">
                  <span>Shipment risk</span>
                  <strong>{result.riskScore}%</strong>
                  <p>
                    Predicted <b>{result.prediction.toLowerCase()}</b> with{' '}
                    {Math.round(result.confidence * 100)}% model confidence.
                  </p>
                  <div
                    className="prediction-score__track"
                    role="meter"
                    aria-label="Shipment risk score"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={result.riskScore}
                  >
                    <span style={{ width: `${Math.max(0, Math.min(100, result.riskScore))}%` }} />
                  </div>
                </div>

                <div className="prediction-result__metrics">
                  <MetricCard
                    label="Confidence"
                    value={`${Math.round(result.confidence * 100)}%`}
                    detail="Model certainty"
                    tone="lavender"
                    icon={<Gauge />}
                  />
                  <MetricCard
                    label="Expected delay"
                    value={`${result.predictedDelay || 0}d`}
                    detail={result.predictedDelay ? 'Estimated late arrival' : 'No delay expected'}
                    tone={result.predictedDelay ? 'rose' : 'teal'}
                    icon={<Clock />}
                  />
                </div>

                <div className="prediction-reasons">
                  <h3>Why the model decided this</h3>
                  {result.reasons?.length ? (
                    <ul>
                      {result.reasons.map((reason, index) => (
                        <li key={`${reason}-${index}`}>
                          <CheckCircle />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No additional risk factors were returned.</p>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Gauge />}
                title="Ready for a shipment brief"
                description="Complete the inputs and the prediction, confidence, delay estimate, and explanation will appear here."
              />
            )}
          </aside>
        </div>

        {result && submittedInput && analysis && (
          <section className="predict-analysis">
            <SectionHeading
              eyebrow="Decision breakdown"
              title="One forecast, every operating signal"
              description="This view is locked to the exact inputs used for the completed analysis, even if you edit the form above."
            />

            <div className="predict-analysis__grid">
              <article className="insight-card insight-card--yellow">
                <span className="insight-card__icon"><Package /></span>
                <div className="insight-card__heading">
                  <span>Shipment brief</span>
                  <h3>{submittedInput.origin} → {submittedInput.destination}</h3>
                </div>
                <dl className="detail-list">
                  <div><dt>Carrier</dt><dd>{submittedInput.carrier}</dd></div>
                  <div><dt>Cargo</dt><dd>{submittedInput.weight.toLocaleString()} kg</dd></div>
                  <div><dt>Prediction</dt><dd>{result.prediction}</dd></div>
                </dl>
              </article>

              <article className="insight-card insight-card--teal">
                <span className="insight-card__icon"><CloudRain /></span>
                <div className="insight-card__heading">
                  <span>Weather signal</span>
                  <h3>{analysis.weather.condition}</h3>
                </div>
                <RiskLabel risk={analysis.weather.risk} />
                <dl className="detail-list">
                  <div><dt>Severity input</dt><dd>{submittedInput.weatherScore}/10</dd></div>
                  <div><dt>Temperature</dt><dd><Thermometer /> {analysis.weather.temperature}°C</dd></div>
                  <div><dt>Rain probability</dt><dd><Drop /> {analysis.weather.rainProbability}%</dd></div>
                </dl>
              </article>

              <article className="insight-card insight-card--rose">
                <span className="insight-card__icon"><Truck /></span>
                <div className="insight-card__heading">
                  <span>Traffic signal</span>
                  <h3>{analysis.traffic.level}</h3>
                </div>
                <RiskLabel risk={analysis.traffic.risk} />
                <dl className="detail-list">
                  <div><dt>Congestion input</dt><dd>{submittedInput.trafficScore}/10</dd></div>
                  <div><dt>Expected impact</dt><dd>{analysis.traffic.delay} min</dd></div>
                </dl>
              </article>
            </div>

            <article className="overall-risk-card">
              <div className="overall-risk-card__summary">
                <span className="overall-risk-card__icon"><TrendUp /></span>
                <div>
                  <span className="eyebrow">Combined assessment</span>
                  <h3>{analysis.overall.status}</h3>
                  <p>AI prediction weighted with weather and traffic exposure.</p>
                </div>
              </div>
              <strong className="overall-risk-card__score">{analysis.overall.score}%</strong>
              <ul>
                {analysis.overall.reasons.map((reason, index) => (
                  <li key={`${reason}-${index}`}>
                    <WarningCircle />
                    {reason}
                  </li>
                ))}
              </ul>
            </article>
          </section>
        )}
      </div>
    </main>
  )
}
