// ============================================================
// riskLogic.js  -  Simple Rule-Based Risk Logic
// ------------------------------------------------------------
// This file contains the "AI logic" for the Weather and Traffic
// risk cards on the AI Risk Prediction page.
//
// It is intentionally SIMPLE (if/else rules, no machine learning
// libraries) so it is easy to explain during the project viva.
//
// The page already collects two numbers from the user:
//   - weatherScore : 1 (clear sky)  ->  10 (severe storm)
//   - trafficScore : 1 (light)      ->  10 (heavy congestion)
//
// We convert those numbers into human-friendly predictions
// (condition, temperature, delay, risk level) using plain rules.
// ============================================================

// ------------------------------------------------------------
// WEATHER PREDICTION
// Turns the weather score (1-10) into a readable forecast.
// Rule of thumb: the higher the score, the worse the weather.
// ------------------------------------------------------------
export function getWeatherPrediction(weatherScore) {
  const score = Number(weatherScore) || 5

  let condition, temperature, rainProbability, risk

  if (score <= 2) {
    condition = 'Sunny'
    temperature = 33
    rainProbability = 10
    risk = 'Low'
  } else if (score <= 4) {
    condition = 'Partly Cloudy'
    temperature = 31
    rainProbability = 35
    risk = 'Low'
  } else if (score <= 6) {
    condition = 'Cloudy'
    temperature = 29
    rainProbability = 60
    risk = 'Medium'
  } else if (score <= 8) {
    condition = 'Heavy Rain'
    temperature = 26
    rainProbability = 85
    risk = 'High'
  } else {
    condition = 'Storm'
    temperature = 24
    rainProbability = 95
    risk = 'Very High'
  }

  // Simple safety rule (matches the project spec):
  // if there is a strong chance of rain, weather risk is at least High.
  if (rainProbability > 60 && (risk === 'Low' || risk === 'Medium')) {
    risk = 'High'
  }

  return { condition, temperature, rainProbability, risk }
}

// ------------------------------------------------------------
// TRAFFIC PREDICTION
// Turns the traffic score (1-10) into a readable forecast.
// The higher the score, the heavier the traffic and the delay.
// ------------------------------------------------------------
export function getTrafficPrediction(trafficScore) {
  const score = Number(trafficScore) || 5

  let level, delay, risk

  if (score <= 3) {
    level = 'Light'
    delay = 5
    risk = 'Low'
  } else if (score <= 6) {
    level = 'Moderate'
    delay = 15
    risk = 'Medium'
  } else if (score <= 8) {
    level = 'Heavy'
    delay = 25
    risk = 'High'
  } else {
    level = 'Road Closed'
    delay = 45
    risk = 'Very High'
  }

  // Simple safety rule (matches the project spec):
  // if the expected delay is more than 20 minutes, traffic risk is at least High.
  if (delay > 20 && (risk === 'Low' || risk === 'Medium')) {
    risk = 'High'
  }

  return { level, delay, risk }
}

// ------------------------------------------------------------
// OVERALL RISK
// Combines three inputs into one final risk score (0-100):
//   1. The AI model's risk score  (weight 50%)
//   2. The weather risk           (weight 25%)
//   3. The traffic risk           (weight 25%)
// The AI model gets the biggest weight because it is the main
// prediction; weather and traffic adjust it up or down.
// ------------------------------------------------------------

// Convert a risk label into a number so we can do the maths.
const RISK_VALUE = { 'Low': 25, 'Medium': 50, 'High': 75, 'Very High': 95 }

export function getOverallRisk(aiRiskScore, weather, traffic) {
  const ai = Number(aiRiskScore) || 0
  const weatherValue = RISK_VALUE[weather.risk] || 0
  const trafficValue = RISK_VALUE[traffic.risk] || 0

  // Weighted average -> single score out of 100.
  const score = Math.round(ai * 0.5 + weatherValue * 0.25 + trafficValue * 0.25)

  // Turn the score into a status label.
  let status
  if (score < 40) status = 'Low Risk'
  else if (score < 60) status = 'Medium Risk'
  else if (score < 80) status = 'High Risk'
  else status = 'Very High Risk'

  // Build a short, human-readable explanation.
  const reasons = []
  if (weather.risk === 'High' || weather.risk === 'Very High') {
    reasons.push(`${weather.condition} expected (${weather.rainProbability}% rain)`)
  }
  if (traffic.risk === 'High' || traffic.risk === 'Very High') {
    reasons.push(`${traffic.level} traffic (~${traffic.delay} min delay)`)
  }
  if (ai >= 60) {
    reasons.push('AI model predicts a high chance of delay')
  }
  if (reasons.length === 0) {
    reasons.push('Conditions look favourable for on-time delivery')
  }

  return { score, status, reasons }
}

// ------------------------------------------------------------
// BADGE STYLING
// Returns Tailwind classes for a coloured badge based on the
// risk level, so every card uses the same colour language:
//   Low = Green, Medium = Yellow, High = Orange, Very High = Red
// ------------------------------------------------------------
export function riskBadgeClasses(risk) {
  switch (risk) {
    case 'Low':
      return 'bg-green-500/10 text-green-500 border-green-500/30'
    case 'Medium':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
    case 'High':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/30'
    case 'Very High':
      return 'bg-red-500/10 text-red-500 border-red-500/30'
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
  }
}

// Map an overall status label ("High Risk") to the same colours.
export function statusBadgeClasses(status) {
  if (status.startsWith('Low')) return riskBadgeClasses('Low')
  if (status.startsWith('Medium')) return riskBadgeClasses('Medium')
  if (status.startsWith('Very High')) return riskBadgeClasses('Very High')
  return riskBadgeClasses('High')
}
