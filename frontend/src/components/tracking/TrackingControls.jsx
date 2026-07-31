import {
  ArrowCounterClockwise,
  CaretRight,
  Pause,
  Play,
  SpinnerGap,
  WarningCircle,
} from '@phosphor-icons/react'
import { SectionHeading } from '../ui'

export default function TrackingControls({
  onAdvance,
  onDeviate,
  onReset,
  onToggleAuto,
  auto,
  delivered,
  busy,
}) {
  const manualDisabled = busy || auto || delivered
  const resetDisabled = busy || auto
  const autoDisabled = delivered || (busy && !auto)

  return (
    <section className="workspace-panel tracking-controls" aria-labelledby="tracking-controls-title">
      <SectionHeading
        eyebrow="Demo controls"
        title="Run the route simulation"
        description="Manual actions are locked while automation or another update is in progress."
      />

      <div className="tracking-controls__actions">
        <button
          type="button"
          className="button button--primary"
          onClick={onAdvance}
          disabled={manualDisabled}
        >
          {busy && !auto ? <SpinnerGap className="is-spinning" /> : <CaretRight />}
          Next location
        </button>

        <button
          type="button"
          className={`button ${auto ? 'button--danger' : 'button--secondary'}`}
          onClick={onToggleAuto}
          disabled={autoDisabled}
          aria-pressed={auto}
        >
          {auto ? <Pause weight="fill" /> : <Play weight="fill" />}
          {auto ? 'Pause automation' : 'Run automatically'}
        </button>

        <button
          type="button"
          className="button button--secondary"
          onClick={onReset}
          disabled={resetDisabled}
        >
          <ArrowCounterClockwise />
          Reset route
        </button>

        <button
          type="button"
          className="button button--danger"
          onClick={onDeviate}
          disabled={manualDisabled}
        >
          <WarningCircle />
          Simulate deviation
        </button>
      </div>

      <p className="tracking-controls__status" aria-live="polite">
        {busy
          ? 'Saving the latest simulation event…'
          : auto
            ? 'Automation advances one stop after each completed request.'
            : delivered
              ? 'Delivery complete. Reset the route to run the simulation again.'
              : 'Choose one action to update the active shipment.'}
      </p>
    </section>
  )
}
