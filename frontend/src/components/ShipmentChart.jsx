import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { EmptyState } from './ui'

const cssVariable = (name, fallback) => {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export default function ShipmentChart({ shipments = [] }) {
  const { theme } = useTheme()

  // Every value recharts receives by reference must be memoised. Recharts 3 keys
  // its entry animation on reference equality, so a fresh array or style object on
  // each render makes the bars collapse to zero and re-grow, and the pie re-sweep.
  const counts = useMemo(() => {
    const onTime = shipments.filter((shipment) => shipment.prediction === 'On Time').length
    const delayed = shipments.filter((shipment) => shipment.prediction === 'Delayed').length
    const low = shipments.filter((shipment) => Number(shipment.riskScore) < 35).length
    const medium = shipments.filter((shipment) => {
      const score = Number(shipment.riskScore)
      return score >= 35 && score <= 70
    }).length
    const high = shipments.filter((shipment) => Number(shipment.riskScore) > 70).length
    return { onTime, delayed, low, medium, high }
  }, [shipments])

  const outcomeData = useMemo(
    () => [
      { name: 'On time', value: counts.onTime },
      { name: 'Delayed', value: counts.delayed },
    ],
    [counts.onTime, counts.delayed],
  )

  const riskData = useMemo(
    () => [
      { name: 'Low', count: counts.low, tone: 'success' },
      { name: 'Medium', count: counts.medium, tone: 'warning' },
      { name: 'High', count: counts.high, tone: 'danger' },
    ],
    [counts.low, counts.medium, counts.high],
  )

  // ThemeContext writes the <html> class synchronously before this re-renders, so
  // reading the custom properties here resolves against the incoming theme.
  const palette = useMemo(
    () => ({
      success: cssVariable('--success', '#00b473'),
      warning: cssVariable('--warning', '#ffd02f'),
      danger: cssVariable('--danger', '#ff9999'),
      blue: cssVariable('--brand-blue', cssVariable('--primary', '#4262ff')),
      grid: cssVariable('--chart-grid', '#e0e2e8'),
      axis: cssVariable('--chart-axis', '#6b6f7e'),
      tooltipBackground: cssVariable('--chart-tooltip-bg', '#ffffff'),
      tooltipBorder: cssVariable('--chart-tooltip-border', '#e0e2e8'),
      text: cssVariable('--text-strong', '#1c1c1e'),
      cursor: cssVariable('--chart-cursor', 'rgba(66, 98, 255, 0.08)'),
      shadow: cssVariable('--shadow-board', 'rgba(5, 0, 56, 0.08) 0 12px 32px -4px'),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  )

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: palette.tooltipBackground,
      border: `1px solid ${palette.tooltipBorder}`,
      borderRadius: '12px',
      color: palette.text,
      // Was a hardcoded light-mode navy shadow, invisible against the dark canvas.
      boxShadow: palette.shadow,
    }),
    [palette],
  )

  const barCursor = useMemo(() => ({ fill: palette.cursor }), [palette.cursor])

  if (shipments.length === 0) {
    return (
      <div className="shipment-charts shipment-charts--empty">
        <EmptyState
          title="No chart data yet"
          description="Delivery and risk patterns will appear after your first shipment analysis."
        />
      </div>
    )
  }

  return (
    <div className="shipment-charts" data-theme={theme}>
      <article className="chart-card" aria-label="Delivery outcome chart">
        <header className="chart-card__header">
          <div>
            <span className="chart-card__eyebrow">Delivery outcome</span>
            <h3>On-time ratio</h3>
          </div>
          <strong className="chart-card__summary">
            {Math.round((counts.onTime / shipments.length) * 100)}%
            <span>on time</span>
          </strong>
        </header>

        <div className="chart-card__canvas">
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={outcomeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={66}
                outerRadius={94}
                paddingAngle={3}
                strokeWidth={0}
              >
                <Cell fill={palette.success} />
                <Cell fill={palette.danger} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          {counts.onTime} shipments are predicted on time and {counts.delayed} are predicted delayed.
        </p>
      </article>

      <article className="chart-card" aria-label="Risk concentration chart">
        <header className="chart-card__header">
          <div>
            <span className="chart-card__eyebrow">Exposure bands</span>
            <h3>Risk concentration</h3>
          </div>
          <strong className="chart-card__summary">
            {counts.high}
            <span>high risk</span>
          </strong>
        </header>

        <div className="chart-card__canvas">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={riskData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke={palette.grid} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={palette.axis}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                stroke={palette.axis}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={barCursor}
              />
              <Bar dataKey="count" name="Shipments" radius={[10, 10, 2, 2]}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={palette[entry.tone]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="sr-only">
          {counts.low} low-risk, {counts.medium} medium-risk, and {counts.high} high-risk shipments.
        </p>
      </article>
    </div>
  )
}
