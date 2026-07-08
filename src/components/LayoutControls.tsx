import type { FlowAlign, LayoutSpec, SwingNode } from '../engine/types'
import { DEFAULT_LAYOUTS } from '../engine/types'

const MANAGERS: { kind: LayoutSpec['kind']; label: string }[] = [
  { kind: 'border', label: 'BorderLayout' },
  { kind: 'flow', label: 'FlowLayout' },
  { kind: 'grid', label: 'GridLayout' },
]

interface LayoutControlsProps {
  container: SwingNode
  containerLabel: string
  onChange: (spec: LayoutSpec) => void
}

function GapKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="knob">
      {label}
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
      />
    </label>
  )
}

export function LayoutControls({ container, containerLabel, onChange }: LayoutControlsProps) {
  const spec = container.layout!

  const selectManager = (kind: LayoutSpec['kind']) => {
    if (spec.kind !== kind) onChange({ ...DEFAULT_LAYOUTS[kind] })
  }

  // ARIA radio contract: arrow keys move selection (and focus) between the segments, wrapping.
  const onRadioKey = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    let next = idx
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % MANAGERS.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + MANAGERS.length) % MANAGERS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = MANAGERS.length - 1
    else return
    e.preventDefault()
    selectManager(MANAGERS[next].kind)
    const group = e.currentTarget.parentElement
    ;(group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next])?.focus()
  }

  return (
    <div className="controls">
      <span className="controls-context">
        Layout of <strong>{containerLabel}</strong>
      </span>

      <div className="segmented" role="radiogroup" aria-label="Layout manager">
        {MANAGERS.map((m, i) => (
          <button
            key={m.kind}
            type="button"
            role="radio"
            aria-checked={spec.kind === m.kind}
            tabIndex={spec.kind === m.kind ? 0 : -1}
            className="segment"
            onClick={() => selectManager(m.kind)}
            onKeyDown={(e) => onRadioKey(e, i)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="knobs">
        {spec.kind === 'flow' && (
          <label className="knob">
            align
            <select
              value={spec.align}
              onChange={(e) => onChange({ ...spec, align: e.target.value as FlowAlign })}
            >
              <option value="LEFT">LEFT</option>
              <option value="CENTER">CENTER</option>
              <option value="RIGHT">RIGHT</option>
            </select>
          </label>
        )}
        {spec.kind === 'grid' && (
          <>
            <label className="knob" title="rows and cols cannot both be 0 — and when rows > 0, cols is derived from the component count">
              rows
              <input
                type="number"
                min={0}
                max={20}
                value={spec.rows}
                onChange={(e) => {
                  const rows = Math.max(0, Math.min(20, Number(e.target.value) || 0))
                  onChange({ ...spec, rows, cols: rows === 0 && spec.cols === 0 ? 1 : spec.cols })
                }}
              />
            </label>
            <label className="knob">
              cols
              <input
                type="number"
                min={0}
                max={20}
                value={spec.cols}
                onChange={(e) => {
                  const cols = Math.max(0, Math.min(20, Number(e.target.value) || 0))
                  onChange({ ...spec, cols, rows: cols === 0 && spec.rows === 0 ? 1 : spec.rows })
                }}
              />
            </label>
          </>
        )}
        <GapKnob label="hgap" value={spec.hgap} onChange={(hgap) => onChange({ ...spec, hgap })} />
        <GapKnob label="vgap" value={spec.vgap} onChange={(vgap) => onChange({ ...spec, vgap })} />
      </div>
    </div>
  )
}
