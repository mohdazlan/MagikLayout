import type { JSX } from 'react'
import type { ComponentType } from '../engine/types'

const GLYPHS: Record<ComponentType, JSX.Element> = {
  JButton: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <rect x="1" y="3" width="24" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="7" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  JLabel: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  JTextField: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <rect x="1" y="4" width="24" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5" y1="7" x2="5" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  JCheckBox: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <rect x="2" y="4" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 9l2 2.2L10 6.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="15" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  JComboBox: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <rect x="1" y="4" width="24" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M18 7.5l2.5 3 2.5-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  JPanel: (
    <svg width="26" height="18" viewBox="0 0 26 18" aria-hidden="true">
      <rect x="1" y="1" width="24" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 2.4" />
    </svg>
  ),
}

export const PALETTE_TYPES: ComponentType[] = ['JButton', 'JLabel', 'JTextField', 'JCheckBox', 'JComboBox', 'JPanel']

interface PaletteProps {
  onDragStart: (type: ComponentType, e: React.PointerEvent) => void
  onClickAdd: (type: ComponentType) => void
}

export function Palette({ onDragStart, onClickAdd }: PaletteProps) {
  return (
    <aside className="palette" aria-label="Component palette">
      <h2 className="pane-title">Components</h2>
      <ul className="palette-list">
        {PALETTE_TYPES.map((type) => (
          <li key={type}>
            <button
              type="button"
              className="palette-item"
              onPointerDown={(e) => {
                if (e.button === 0) onDragStart(type, e)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onClickAdd(type)
                }
              }}
              aria-label={`Add ${type}`}
            >
              {GLYPHS[type]}
              {type}
            </button>
          </li>
        ))}
      </ul>
      <p className="palette-hint">
        Click to add, or drag onto the canvas.
      </p>
    </aside>
  )
}
