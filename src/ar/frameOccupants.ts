/**
 * Thin adapter: the Playground's frame (a SwingNode) → the AR view's
 * RegionOccupant[]. Pure and unit-testable. It reads existing Playground state
 * only; it never changes it.
 *
 * BorderLayout shows only the LAST component added to each region, so this keeps
 * the last occupant per region — the AR desk view then shows exactly what the
 * real frame shows. Returns [] for any non-BorderLayout frame (the AR view is
 * deliberately scoped to BorderLayout).
 */
import type { BorderRegion, ComponentType, SwingNode } from '../engine/types'
import type { RegionOccupant } from './buildLayoutScene'

/** One distinct, readable colour per component type for the 3D plates. */
const TYPE_COLOR: Record<ComponentType, string> = {
  JButton: '#E8590C', // Duke Orange accent
  JLabel: '#1D1D1F', // ink
  JTextField: '#1C7ED6', // blue
  JCheckBox: '#2F9E44', // green
  JComboBox: '#7048E8', // violet
  JPanel: '#ADB5BD', // grey
}

export function frameOccupants(frame: SwingNode): RegionOccupant[] {
  if (frame.layout?.kind !== 'border') return []
  const byRegion = new Map<BorderRegion, RegionOccupant>()
  for (const child of frame.children ?? []) {
    const region = child.constraint ?? 'CENTER' // absent constraint = CENTER, per the JDK
    byRegion.set(region, {
      region,
      label: child.node.text.trim() || child.node.type,
      colorHex: TYPE_COLOR[child.node.type],
    })
  }
  return [...byRegion.values()]
}
