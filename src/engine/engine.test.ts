import { describe, expect, it } from 'vitest'
import { borderLayoutContainer, borderPreferredLayoutSize, borderHiddenChildren } from './borderLayout'
import { flowLayoutContainer, flowPreferredLayoutSize } from './flowLayout'
import { gridLayoutContainer, gridPreferredLayoutSize, resolveGrid } from './gridLayout'
import { layoutTree, containerAt } from './layoutTree'
import { testMeasurer } from './metrics'
import type { SwingNode } from './types'

const sz = (width: number, height: number) => ({ width, height })

describe('BorderLayout', () => {
  it('lays out all five regions like the JDK', () => {
    // new BorderLayout(0, 0) in a 400x300 container
    const children = [
      { size: sz(50, 30), constraint: 'NORTH' as const },
      { size: sz(60, 20), constraint: 'SOUTH' as const },
      { size: sz(40, 100), constraint: 'EAST' as const },
      { size: sz(35, 100), constraint: 'WEST' as const },
      { size: sz(10, 10), constraint: 'CENTER' as const },
    ]
    const r = borderLayoutContainer(children, { hgap: 0, vgap: 0 }, sz(400, 300))
    expect(r[0]).toEqual({ x: 0, y: 0, width: 400, height: 30 }) // NORTH: full width, pref height
    expect(r[1]).toEqual({ x: 0, y: 280, width: 400, height: 20 }) // SOUTH: pinned to bottom
    expect(r[2]).toEqual({ x: 360, y: 30, width: 40, height: 250 }) // EAST: between N and S
    expect(r[3]).toEqual({ x: 0, y: 30, width: 35, height: 250 }) // WEST
    expect(r[4]).toEqual({ x: 35, y: 30, width: 325, height: 250 }) // CENTER absorbs the rest
  })

  it('applies hgap/vgap between regions, not at container edges', () => {
    const children = [
      { size: sz(50, 30), constraint: 'NORTH' as const },
      { size: sz(40, 50), constraint: 'WEST' as const },
      { size: sz(10, 10), constraint: 'CENTER' as const },
    ]
    const r = borderLayoutContainer(children, { hgap: 10, vgap: 8 }, sz(400, 300))
    expect(r[0]).toEqual({ x: 0, y: 0, width: 400, height: 30 })
    expect(r[1]).toEqual({ x: 0, y: 38, width: 40, height: 262 }) // top = 30 + vgap 8
    expect(r[2]).toEqual({ x: 50, y: 38, width: 350, height: 262 }) // left = 40 + hgap 10
  })

  it('only lays out the LAST component added to a region (the classic gotcha)', () => {
    const children = [
      { size: sz(80, 30), constraint: 'CENTER' as const },
      { size: sz(60, 25), constraint: 'CENTER' as const },
    ]
    const r = borderLayoutContainer(children, { hgap: 0, vgap: 0 }, sz(200, 100))
    expect(r[0]).toBeNull()
    expect(r[1]).toEqual({ x: 0, y: 0, width: 200, height: 100 })
    expect(borderHiddenChildren(children)).toEqual([{ index: 0, region: 'CENTER' }])
  })

  it('treats a missing constraint as CENTER, like JDK null', () => {
    const children = [{ size: sz(10, 10) }]
    const r = borderLayoutContainer(children, { hgap: 0, vgap: 0 }, sz(100, 80))
    expect(r[0]).toEqual({ x: 0, y: 0, width: 100, height: 80 })
  })

  it('computes preferredLayoutSize with gaps only for occupied regions', () => {
    const children = [
      { size: sz(100, 30), constraint: 'NORTH' as const },
      { size: sz(40, 60), constraint: 'WEST' as const },
      { size: sz(50, 45), constraint: 'CENTER' as const },
    ]
    // width = max(north, west+hgap+center) = max(100, 40+5+50) = 100
    // height = north + vgap + max(west, center) = 30 + 3 + 60 = 93
    expect(borderPreferredLayoutSize(children, { hgap: 5, vgap: 3 })).toEqual(sz(100, 93))
  })
})

describe('FlowLayout', () => {
  it('centers a single row and vertically centers within the row', () => {
    // FlowLayout(CENTER, 5, 5) in 300x100; two comps 60x20 and 40x30
    const r = flowLayoutContainer([sz(60, 20), sz(40, 30)], { align: 'CENTER', hgap: 5, vgap: 5 }, sz(300, 100))
    // row width = 60 + 5 + 40 = 105; maxwidth = 300 - 10 = 290; leftover = 290 - 105 = 185
    // x starts at insets.left + hgap + trunc(185/2) = 5 + 92 = 97
    expect(r[0]).toEqual({ x: 97, y: 10, width: 60, height: 20 }) // y = vgap 5 + (30-20)/2
    expect(r[1]).toEqual({ x: 162, y: 5, width: 40, height: 30 })
  })

  it('left-aligns rows when align is LEFT', () => {
    const r = flowLayoutContainer([sz(60, 20), sz(40, 20)], { align: 'LEFT', hgap: 5, vgap: 5 }, sz(300, 100))
    expect(r[0].x).toBe(5)
    expect(r[1].x).toBe(70)
  })

  it('wraps to a new row when a component does not fit', () => {
    // container 150 wide → maxwidth = 140; 60 + 5 + 60 = 125 fits, third wraps
    const r = flowLayoutContainer(
      [sz(60, 20), sz(60, 20), sz(60, 20)],
      { align: 'LEFT', hgap: 5, vgap: 5 },
      sz(150, 200),
    )
    expect(r[0].y).toBe(5)
    expect(r[1].y).toBe(5)
    expect(r[2]).toEqual({ x: 5, y: 30, width: 60, height: 20 }) // y = 5 + 20 + 5
  })

  it('places the first component of a row even when wider than the container', () => {
    const r = flowLayoutContainer([sz(500, 20)], { align: 'CENTER', hgap: 5, vgap: 5 }, sz(200, 100))
    // leftover = (200-10) - 500 = -310 → x = 5 + trunc(-310/2) = 5 - 155 (Java truncation toward zero)
    expect(r[0].x).toBe(-150)
  })

  it('never resizes components (preferred size always wins)', () => {
    const r = flowLayoutContainer([sz(60, 20)], { align: 'CENTER', hgap: 5, vgap: 5 }, sz(1000, 1000))
    expect(r[0].width).toBe(60)
    expect(r[0].height).toBe(20)
  })

  it('reports single-row preferred size (the wrap-height gotcha)', () => {
    expect(flowPreferredLayoutSize([sz(60, 20), sz(40, 30)], { align: 'CENTER', hgap: 5, vgap: 5 })).toEqual(
      sz(60 + 5 + 40 + 10, 30 + 10),
    )
  })
})

describe('GridLayout', () => {
  it('rows win over cols when both are set (JDK derives cols from count)', () => {
    expect(resolveGrid(5, 2, 3)).toEqual({ nrows: 2, ncols: 3 })
    expect(resolveGrid(5, 2, 99)).toEqual({ nrows: 2, ncols: 3 }) // cols ignored
    expect(resolveGrid(5, 0, 2)).toEqual({ nrows: 3, ncols: 2 })
  })

  it('divides the container into identical cells, ignoring preferred sizes', () => {
    const r = gridLayoutContainer(
      [sz(10, 10), sz(999, 999), sz(10, 10), sz(10, 10)],
      { rows: 2, cols: 2, hgap: 0, vgap: 0 },
      sz(200, 100),
    )
    for (const rect of r) {
      expect(rect.width).toBe(100)
      expect(rect.height).toBe(50)
    }
    expect(r[0]).toEqual({ x: 0, y: 0, width: 100, height: 50 })
    expect(r[1]).toEqual({ x: 100, y: 0, width: 100, height: 50 }) // row-major fill
    expect(r[2]).toEqual({ x: 0, y: 50, width: 100, height: 50 })
  })

  it('applies gaps between cells and centers integer-division remainders', () => {
    // 205px wide, 2 cols, hgap 5: cells trunc((205-5)/2)=100, remainder 0 → but 205-(200+5)=0
    // use 207: cells trunc(202/2)=101, used=207 → extra=trunc((207-207)/2)=0
    // use 209: cells trunc(204/2)=102, used 209 → 209-(204+5)=0... pick clean case:
    // 203 wide: cells trunc(198/2)=99, used = 198+5=203 → extra 0; 204: trunc(199/2)=99, used 203, extra trunc(1/2)=0
    // 206: trunc(201/2)=100, used 205, extra = trunc(1/2) = 0; 207: trunc(202/2)=101 used 207 extra 0
    const r = gridLayoutContainer(
      [sz(1, 1), sz(1, 1)],
      { rows: 1, cols: 2, hgap: 5, vgap: 0 },
      sz(208, 50),
    )
    // widthOnComponent = trunc((208-5)/2) = 101; extra = trunc((208-207)/2) = 0
    expect(r[0]).toEqual({ x: 0, y: 0, width: 101, height: 50 })
    expect(r[1]).toEqual({ x: 106, y: 0, width: 101, height: 50 })
  })

  it('computes preferred size from the largest component times the grid', () => {
    expect(
      gridPreferredLayoutSize([sz(40, 20), sz(80, 25), sz(10, 10), sz(10, 10)], { rows: 2, cols: 2, hgap: 4, vgap: 6 }),
    ).toEqual(sz(2 * 80 + 4, 2 * 25 + 6))
  })
})

describe('layoutTree (nesting)', () => {
  const button = (id: string, text: string): SwingNode => ({ id, type: 'JButton', text })

  it('lays out a nested JPanel with its own manager and offsets absolute bounds', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: button('b1', 'North'), constraint: 'NORTH' },
        {
          node: {
            id: 'p1',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 1, cols: 2, hgap: 0, vgap: 0 },
            children: [{ node: button('b2', 'A') }, { node: button('b3', 'B') }],
          },
          constraint: 'CENTER',
        },
      ],
    }
    const t = layoutTree(root, sz(400, 300), testMeasurer)
    const northH = t.prefs.get('b1')!.height
    expect(t.abs.get('p1')).toEqual({ x: 0, y: northH, width: 400, height: 300 - northH })
    // grid children: two identical cells inside the panel
    expect(t.rel.get('b2')).toEqual({ x: 0, y: 0, width: 200, height: 300 - northH })
    expect(t.abs.get('b3')!.x).toBe(200)
    expect(t.abs.get('b3')!.y).toBe(northH)
  })

  it("a panel's preferred size is its manager's preferredLayoutSize (recursive)", () => {
    const inner: SwingNode = {
      id: 'p1',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [{ node: button('b1', 'OK') }],
    }
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [{ node: inner }],
    }
    const t = layoutTree(root, sz(400, 300), testMeasurer)
    const btnPref = t.prefs.get('b1')!
    expect(t.prefs.get('p1')).toEqual(sz(btnPref.width + 10, btnPref.height + 10))
  })

  it('reports hidden components from BorderLayout region collisions', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: button('b1', 'First'), constraint: 'CENTER' },
        { node: button('b2', 'Second'), constraint: 'CENTER' },
      ],
    }
    const t = layoutTree(root, sz(200, 100), testMeasurer)
    expect(t.hidden).toEqual([{ id: 'b1', region: 'CENTER', containerId: 'root' }])
    expect(t.rel.has('b1')).toBe(false)
    expect(t.rel.get('b2')).toEqual({ x: 0, y: 0, width: 200, height: 100 })
  })

  it('containerAt finds the deepest panel under a point', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        {
          node: { id: 'p1', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [] },
          constraint: 'CENTER',
        },
      ],
    }
    const t = layoutTree(root, sz(400, 300), testMeasurer)
    expect(containerAt(root, t, 200, 150).id).toBe('p1')
    expect(containerAt(root, t, 10_000, 150).id).toBe('root')
  })
})
