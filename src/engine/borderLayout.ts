/**
 * Faithful port of java.awt.BorderLayout's layoutContainer / preferredLayoutSize
 * (JDK sources, LTR orientation, no relative constraints).
 *
 * Key behaviors preserved:
 * - Region resolution order: NORTH, SOUTH, EAST, WEST, CENTER.
 * - N/S take their preferred height at full remaining width; E/W take their
 *   preferred width at full remaining height; CENTER absorbs the rest.
 * - A region only lays out the LAST component added to it; earlier ones are
 *   left unmanaged (invisible) — exactly like Swing.
 * - A missing constraint means CENTER (JDK treats null as CENTER).
 * - Widths/heights can go negative when the container is too small; Swing
 *   passes those through to setBounds and the component simply isn't visible.
 */
import type { BorderRegion, Insets, Rect, Size } from './types'
import { ZERO_INSETS } from './types'

export interface BorderChild {
  size: Size
  constraint?: BorderRegion
}

interface BorderSpec {
  hgap: number
  vgap: number
}

const REGIONS: BorderRegion[] = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTER']

/** Last-added component per region wins; returns child index per region. */
function resolveSlots(children: BorderChild[]): Partial<Record<BorderRegion, number>> {
  const slots: Partial<Record<BorderRegion, number>> = {}
  children.forEach((child, i) => {
    slots[child.constraint ?? 'CENTER'] = i
  })
  return slots
}

export function borderLayoutContainer(
  children: BorderChild[],
  spec: BorderSpec,
  container: Size,
  insets: Insets = ZERO_INSETS,
): (Rect | null)[] {
  const { hgap, vgap } = spec
  const slots = resolveSlots(children)
  const out: (Rect | null)[] = children.map(() => null)

  let top = insets.top
  let bottom = container.height - insets.bottom
  let left = insets.left
  let right = container.width - insets.right

  const north = slots.NORTH
  if (north !== undefined) {
    const d = children[north].size
    out[north] = { x: left, y: top, width: right - left, height: d.height }
    top += d.height + vgap
  }
  const south = slots.SOUTH
  if (south !== undefined) {
    const d = children[south].size
    out[south] = { x: left, y: bottom - d.height, width: right - left, height: d.height }
    bottom -= d.height + vgap
  }
  const east = slots.EAST
  if (east !== undefined) {
    const d = children[east].size
    out[east] = { x: right - d.width, y: top, width: d.width, height: bottom - top }
    right -= d.width + hgap
  }
  const west = slots.WEST
  if (west !== undefined) {
    const d = children[west].size
    out[west] = { x: left, y: top, width: d.width, height: bottom - top }
    left += d.width + hgap
  }
  const center = slots.CENTER
  if (center !== undefined) {
    out[center] = { x: left, y: top, width: right - left, height: bottom - top }
  }
  return out
}

export function borderPreferredLayoutSize(
  children: BorderChild[],
  spec: BorderSpec,
  insets: Insets = ZERO_INSETS,
): Size {
  const { hgap, vgap } = spec
  const slots = resolveSlots(children)
  const dim: Size = { width: 0, height: 0 }

  for (const region of ['EAST', 'WEST'] as const) {
    const i = slots[region]
    if (i !== undefined) {
      const d = children[i].size
      dim.width += d.width + hgap
      dim.height = Math.max(d.height, dim.height)
    }
  }
  const center = slots.CENTER
  if (center !== undefined) {
    const d = children[center].size
    dim.width += d.width
    dim.height = Math.max(d.height, dim.height)
  }
  for (const region of ['NORTH', 'SOUTH'] as const) {
    const i = slots[region]
    if (i !== undefined) {
      const d = children[i].size
      dim.width = Math.max(d.width, dim.width)
      dim.height += d.height + vgap
    }
  }
  dim.width += insets.left + insets.right
  dim.height += insets.top + insets.bottom
  return dim
}

/** Child indices that will NOT be laid out (their region was re-occupied later). */
export function borderHiddenChildren(children: BorderChild[]): { index: number; region: BorderRegion }[] {
  const slots = resolveSlots(children)
  const hidden: { index: number; region: BorderRegion }[] = []
  children.forEach((child, i) => {
    const region = child.constraint ?? 'CENTER'
    if (slots[region] !== i) hidden.push({ index: i, region })
  })
  return hidden
}

export { REGIONS as BORDER_REGIONS }
