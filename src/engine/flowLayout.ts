/**
 * Faithful port of java.awt.FlowLayout's layoutContainer / preferredLayoutSize
 * (JDK sources, LTR orientation, baseline alignment off — the default).
 *
 * Key behaviors preserved:
 * - Components are set to their PREFERRED size, always. FlowLayout never
 *   stretches anything.
 * - Row packing: a component starts a new row only when it doesn't fit in
 *   maxwidth = containerWidth - (insets + hgap*2). The first component of a
 *   row is placed even if wider than the row (x == 0 test).
 * - Row alignment happens per completed row via moveComponents, using the
 *   LEFTOVER space (which can be negative — that off-canvas shift on
 *   too-narrow containers is real JDK behavior, not a bug).
 * - Components are vertically centered within their row's height.
 * - preferredLayoutSize assumes ONE row (that's why FlowLayout panels report
 *   the wrong height after wrapping — a real Swing gotcha worth teaching).
 */
import type { FlowAlign, Insets, Rect, Size } from './types'
import { ZERO_INSETS, intDiv } from './types'

interface FlowSpec {
  align: FlowAlign
  hgap: number
  vgap: number
}

function moveComponents(
  rects: Rect[],
  x: number,
  y: number,
  width: number,
  height: number,
  start: number,
  end: number,
  align: FlowAlign,
  hgap: number,
): number {
  switch (align) {
    case 'LEFT':
      break
    case 'CENTER':
      x += intDiv(width, 2)
      break
    case 'RIGHT':
      x += width
      break
  }
  for (let i = start; i < end; i++) {
    const r = rects[i]
    r.y = y + intDiv(height - r.height, 2)
    r.x = x
    x += r.width + hgap
  }
  return height
}

export function flowLayoutContainer(
  children: Size[],
  spec: FlowSpec,
  container: Size,
  insets: Insets = ZERO_INSETS,
): Rect[] {
  const { align, hgap, vgap } = spec
  const maxwidth = container.width - (insets.left + insets.right + hgap * 2)
  const rects: Rect[] = children.map((d) => ({ x: 0, y: 0, width: d.width, height: d.height }))

  let x = 0
  let y = insets.top + vgap
  let rowh = 0
  let start = 0

  for (let i = 0; i < children.length; i++) {
    const d = children[i]
    if (x === 0 || x + d.width <= maxwidth) {
      if (x > 0) x += hgap
      x += d.width
      rowh = Math.max(rowh, d.height)
    } else {
      rowh = moveComponents(rects, insets.left + hgap, y, maxwidth - x, rowh, start, i, align, hgap)
      x = d.width
      y += vgap + rowh
      rowh = d.height
      start = i
    }
  }
  moveComponents(rects, insets.left + hgap, y, maxwidth - x, rowh, start, children.length, align, hgap)
  return rects
}

export function flowPreferredLayoutSize(
  children: Size[],
  spec: FlowSpec,
  insets: Insets = ZERO_INSETS,
): Size {
  const { hgap, vgap } = spec
  const dim: Size = { width: 0, height: 0 }
  let firstVisibleComponent = true
  for (const d of children) {
    dim.height = Math.max(dim.height, d.height)
    if (firstVisibleComponent) {
      firstVisibleComponent = false
    } else {
      dim.width += hgap
    }
    dim.width += d.width
  }
  dim.width += insets.left + insets.right + hgap * 2
  dim.height += insets.top + insets.bottom + vgap * 2
  return dim
}
