import type { BorderRegion, Rect } from '../engine/types'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * Drop-target bands for a BorderLayout container. These are hit zones for the
 * drag interaction (Swing itself has no such geometry — regions are chosen in
 * code), sized so CENTER stays generous. Painting and hit-testing share this
 * function so the highlight never lies about where a drop will go.
 */
export function regionBands(r: Rect): Record<BorderRegion, Rect> {
  const bandH = clamp(r.height * 0.25, 8, 56)
  const bandW = clamp(r.width * 0.25, 8, 72)
  return {
    NORTH: { x: r.x, y: r.y, width: r.width, height: bandH },
    SOUTH: { x: r.x, y: r.y + r.height - bandH, width: r.width, height: bandH },
    WEST: { x: r.x, y: r.y + bandH, width: bandW, height: r.height - 2 * bandH },
    EAST: { x: r.x + r.width - bandW, y: r.y + bandH, width: bandW, height: r.height - 2 * bandH },
    CENTER: { x: r.x + bandW, y: r.y + bandH, width: r.width - 2 * bandW, height: r.height - 2 * bandH },
  }
}

export function regionAtPoint(r: Rect, x: number, y: number): BorderRegion {
  const bands = regionBands(r)
  for (const region of ['NORTH', 'SOUTH', 'WEST', 'EAST'] as const) {
    const b = bands[region]
    if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) return region
  }
  return 'CENTER'
}
