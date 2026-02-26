import { useEffect, useMemo, useState } from 'react'

import type { AxisKey } from '../../../poseControls'

type AxisSliderProps = {
  axis: AxisKey
  max: number
  min: number
  onChange: (value: number) => void
  step?: number
  unit?: string
  value: number
}

function axisClassName(axis: AxisKey): string {
  if (axis === 'x') return 'axis-x'
  if (axis === 'y') return 'axis-y'
  return 'axis-z'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function stepPrecision(step: number): number {
  const normalized = String(step)
  const decimalPart = normalized.split('.')[1]
  return decimalPart ? decimalPart.length : 0
}

export function AxisSlider({
  axis,
  max,
  min,
  onChange,
  step = 1,
  unit = 'deg',
  value,
}: AxisSliderProps) {
  const precision = useMemo(() => stepPrecision(step), [step])
  const [draftValue, setDraftValue] = useState(value.toFixed(precision))

  useEffect(() => {
    setDraftValue(value.toFixed(precision))
  }, [precision, value])

  const applyValue = (next: number) => {
    const rounded = Number(next.toFixed(precision))
    onChange(clamp(rounded, min, max))
  }

  return (
    <div className={`axis-slider ${axisClassName(axis)}`}>
      <span className="axis-slider-label">{axis.toUpperCase()}</span>
      <div className="axis-stepper">
        <button type="button" className="axis-step-btn" onClick={() => applyValue(value - step)} aria-label={`Decrease ${axis}`}>
          -
        </button>
        <input
          className="axis-value-input"
          type="number"
          step={step}
          min={min}
          max={max}
          value={draftValue}
          onChange={(event) => setDraftValue(event.currentTarget.value)}
          onBlur={() => {
            const parsed = Number(draftValue)
            if (!Number.isFinite(parsed)) {
              setDraftValue(value.toFixed(precision))
              return
            }
            applyValue(parsed)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              const parsed = Number(draftValue)
              if (!Number.isFinite(parsed)) return
              applyValue(parsed)
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              applyValue(value + step)
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              applyValue(value - step)
            }
          }}
          onWheel={(event) => {
            event.preventDefault()
            applyValue(value + (event.deltaY < 0 ? step : -step))
          }}
        />
        <button type="button" className="axis-step-btn" onClick={() => applyValue(value + step)} aria-label={`Increase ${axis}`}>
          +
        </button>
      </div>
      <span className="axis-slider-value">{unit}</span>
    </div>
  )
}
