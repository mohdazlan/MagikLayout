/**
 * Faithful port of java.awt.GridLayout's layoutContainer / preferredLayoutSize
 * (JDK sources, LTR orientation).
 *
 * Key behaviors preserved:
 * - Rows win: when rows > 0, the column count is DERIVED from the component
 *   count (ceil(n / rows)) and the cols field is ignored — even if it was set.
 * - Every cell is identical; components' preferred sizes are ignored during
 *   layout (they only influence preferredLayoutSize).
 * - Integer division: cell sizes truncate, and the leftover pixels are split
 *   evenly as leading padding (extraWidthAvailable / extraHeightAvailable).
 * - Fill order is row-major: left-to-right, then top-to-bottom.
 */
import type { Insets, Rect, Size } from './types'
import { ZERO_INSETS, intDiv } from './types'

interface GridSpec {
  rows: number
  cols: number
  hgap: number
  vgap: number
}

export function resolveGrid(count: number, rows: number, cols: number): { nrows: number; ncols: number } {
  let nrows = rows
  let ncols = cols
  if (nrows > 0) {
    ncols = intDiv(count + nrows - 1, nrows)
  } else {
    nrows = intDiv(count + ncols - 1, ncols)
  }
  return { nrows, ncols }
}

export function gridLayoutContainer(
  children: Size[],
  spec: GridSpec,
  container: Size,
  insets: Insets = ZERO_INSETS,
): Rect[] {
  const ncomponents = children.length
  if (ncomponents === 0) return []
  const { nrows, ncols } = resolveGrid(ncomponents, spec.rows, spec.cols)
  const { hgap, vgap } = spec

  const totalGapsWidth = (ncols - 1) * hgap
  const widthWOInsets = container.width - (insets.left + insets.right)
  const widthOnComponent = intDiv(widthWOInsets - totalGapsWidth, ncols)
  const extraWidthAvailable = intDiv(widthWOInsets - (widthOnComponent * ncols + totalGapsWidth), 2)

  const totalGapsHeight = (nrows - 1) * vgap
  const heightWOInsets = container.height - (insets.top + insets.bottom)
  const heightOnComponent = intDiv(heightWOInsets - totalGapsHeight, nrows)
  const extraHeightAvailable = intDiv(heightWOInsets - (heightOnComponent * nrows + totalGapsHeight), 2)

  const rects: Rect[] = children.map(() => ({ x: 0, y: 0, width: 0, height: 0 }))
  for (let c = 0, x = insets.left + extraWidthAvailable; c < ncols; c++, x += widthOnComponent + hgap) {
    for (let r = 0, y = insets.top + extraHeightAvailable; r < nrows; r++, y += heightOnComponent + vgap) {
      const i = r * ncols + c
      if (i < ncomponents) {
        rects[i] = { x, y, width: widthOnComponent, height: heightOnComponent }
      }
    }
  }
  return rects
}

export function gridPreferredLayoutSize(
  children: Size[],
  spec: GridSpec,
  insets: Insets = ZERO_INSETS,
): Size {
  const ncomponents = children.length
  const { nrows, ncols } = resolveGrid(Math.max(ncomponents, 1), spec.rows, spec.cols)
  let w = 0
  let h = 0
  for (const d of children) {
    if (d.width > w) w = d.width
    if (d.height > h) h = d.height
  }
  return {
    width: insets.left + insets.right + ncols * w + (ncols - 1) * spec.hgap,
    height: insets.top + insets.bottom + nrows * h + (nrows - 1) * spec.vgap,
  }
}
