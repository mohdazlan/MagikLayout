import { describe, expect, it } from 'vitest'
import { layoutTree } from '../engine/layoutTree'
import { testMeasurer } from '../engine/metrics'
import type { SwingNode } from '../engine/types'
import { addChild } from '../state/playground'
import { PARSONS_CHALLENGES } from './data/parsons'
import { REFLOW_CHALLENGES } from './data/reflow'
import { REVERSE_CHALLENGES } from './data/reverse'
import { executeStatements } from './execute'
import { executeOrder, gradeParsons, gradeReflow, gradeReverse, targetExec, treesEquivalent } from './grade'
import { FRAME_VAR, type Stmt } from './types'

const confirmBar = PARSONS_CHALLENGES[0]
const toolbar = PARSONS_CHALLENGES[1]
const pinnedEast = REFLOW_CHALLENGES[0]
const flowWrap = REFLOW_CHALLENGES[1]

const canonical = (n: number) => Array.from({ length: n }, (_, i) => i)

describe('parsons executor', () => {
  it('executes the canonical order cleanly into the target tree', () => {
    const exec = targetExec(confirmBar)
    expect(exec.clean).toBe(true)
    expect(exec.unmanaged).toEqual([])
    const south = exec.root.children!.find((c) => c.constraint === 'SOUTH')!.node
    expect(south.type).toBe('JPanel')
    expect(south.children!.map((c) => c.node.text)).toEqual(['OK', 'Cancel'])
  })

  it('flags add() before the declaration as an error on that statement, not silently', () => {
    // add-okButton (index 4) placed first
    const order = [4, 0, 1, 2, 3, 5, 6, 7]
    const exec = executeOrder(confirmBar, order)
    expect(exec.results[0].ok).toBe(false)
    expect(exec.results[0].error).toContain('cannot find symbol')
    expect(exec.results.slice(1).every((r) => r.ok)).toBe(true)
  })

  it('renders Swing’s actual behavior when adds run before setLayout(new BorderLayout(…))', () => {
    // Toolbar challenge with setLayout (index 1) moved AFTER the adds:
    // components were registered with the old FlowLayout manager, so the new
    // BorderLayout never lays them out — they are invisible, like real Swing.
    const order = [0, 2, 3, 4, 5, 6, 7, 1, 8]
    const exec = executeOrder(toolbar, order)
    expect(exec.clean).toBe(true) // it compiles and runs — that's the trap
    expect(exec.unmanaged.map((u) => u.varName).sort()).toEqual(['backButton', 'goButton', 'urlField'])
    const toolbarNode = exec.root.children!.find((c) => c.constraint === 'NORTH')!.node
    expect(toolbarNode.children).toEqual([]) // nothing visible inside the toolbar
  })

  it('lets FlowLayout ignore a BorderLayout constraint (real JDK behavior)', () => {
    const stmts: Stmt[] = [
      { kind: 'declare', varName: 'p', component: { type: 'JPanel', text: '' } },
      { kind: 'declare', varName: 'b', component: { type: 'JButton', text: 'Hi' } },
      { kind: 'add', target: 'p', child: 'b', constraint: 'NORTH' },
      { kind: 'add', target: FRAME_VAR, child: 'p' },
    ]
    const exec = executeStatements(stmts)
    expect(exec.clean).toBe(true)
    const p = exec.root.children![0].node
    expect(p.layout!.kind).toBe('flow') // still the JPanel default
    expect(p.children!.length).toBe(1) // laid out by flow, constraint ignored
  })

  it('re-parents on a second add, like Container.add', () => {
    const stmts: Stmt[] = [
      { kind: 'declare', varName: 'a', component: { type: 'JPanel', text: '' } },
      { kind: 'declare', varName: 'b', component: { type: 'JButton', text: 'x' } },
      { kind: 'add', target: 'a', child: 'b' },
      { kind: 'add', target: FRAME_VAR, child: 'a', constraint: 'CENTER' },
      { kind: 'add', target: FRAME_VAR, child: 'b', constraint: 'NORTH' },
    ]
    const exec = executeStatements(stmts)
    expect(exec.clean).toBe(true)
    expect(exec.root.children!.find((c) => c.constraint === 'CENTER')!.node.children).toEqual([])
    expect(exec.root.children!.find((c) => c.constraint === 'NORTH')!.node.text).toBe('x')
  })
})

describe('parsons grading', () => {
  it('passes the canonical order', () => {
    expect(gradeParsons(confirmBar, canonical(confirmBar.magnets.length)).pass).toBe(true)
    expect(gradeParsons(toolbar, canonical(toolbar.magnets.length)).pass).toBe(true)
  })

  it('passes a valid alternative order (declarations hoisted)', () => {
    // All declares first, then adds in canonical relative order.
    const order = [0, 2, 3, 5, 1, 4, 6, 7]
    expect(gradeParsons(confirmBar, order).pass).toBe(true)
  })

  it('fails a swapped FlowLayout add order at the first differing statement', () => {
    // Cancel added before OK — flow order IS layout order, so this is a
    // different UI. First divergence: the add-cancelButton magnet (build slot 4).
    const order = [0, 1, 2, 3, 6, 5, 4, 7]
    const grade = gradeParsons(confirmBar, order)
    expect(grade.pass).toBe(false)
    expect(grade.firstDivergence).toBe(4)
  })

  it('fails the adds-before-setLayout order and points at the first statement off the path', () => {
    const order = [0, 2, 3, 4, 5, 6, 7, 1, 8]
    const grade = gradeParsons(toolbar, order)
    expect(grade.pass).toBe(false)
    // Placing add-backButton (build slot 2) while the toolbar still has
    // FlowLayout is the first statement after which the target is unreachable
    // — the declares before it are harmless in any order.
    expect(grade.firstDivergence).toBe(2)
  })

  it('treats border-region occupancy as order-free but within-region order as meaningful', () => {
    const a = targetExec(confirmBar).root
    // NORTH added after SOUTH — same resolved tree.
    const reordered = executeOrder(confirmBar, [2, 3, 4, 5, 6, 7, 0, 1]).root
    expect(treesEquivalent(a, reordered)).toBe(true)
  })
})

describe('reflow grading', () => {
  it('passes within tolerance and fails outside it, from engine-computed truth', () => {
    const layout = layoutTree(pinnedEast.root, pinnedEast.endSize, testMeasurer)
    const truth = layout.abs.get(pinnedEast.targetId)!
    const center = { x: truth.x + truth.width / 2, y: truth.y + truth.height / 2 }

    expect(gradeReflow(pinnedEast, center, testMeasurer).pass).toBe(true)
    expect(gradeReflow(pinnedEast, { x: center.x + 24, y: center.y }, testMeasurer).pass).toBe(true)
    expect(gradeReflow(pinnedEast, { x: center.x + 25, y: center.y }, testMeasurer).pass).toBe(false)
    expect(gradeReflow(pinnedEast, { x: center.x, y: center.y + 25 }, testMeasurer).pass).toBe(false)
  })

  it('EAST stays pinned to the right edge at the new width', () => {
    const truth = layoutTree(pinnedEast.root, pinnedEast.endSize, testMeasurer).abs.get('sendButton')!
    expect(truth.x + truth.width).toBe(pinnedEast.endSize.width)
  })

  it('the Delete button wraps to a second row at 300px', () => {
    const before = layoutTree(flowWrap.root, flowWrap.startSize, testMeasurer).abs.get('deleteButton')!
    const after = layoutTree(flowWrap.root, flowWrap.endSize, testMeasurer).abs.get('deleteButton')!
    expect(after.y).toBeGreaterThan(before.y) // it moved down a row
  })
})

describe('reverse grading', () => {
  const searchBar = REVERSE_CHALLENGES[0]

  /** Builds the search-bar target the way the Playground does: addChild ops. */
  const buildSearchBar = (): SwingNode => {
    let root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [],
    }
    root = addChild(
      root,
      'root',
      { id: 'p1', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [] },
      'NORTH',
    )
    root = addChild(root, 'p1', { id: 'f1', type: 'JTextField', text: '', columns: 10 })
    root = addChild(root, 'p1', { id: 'b1', type: 'JButton', text: 'Search' })
    root = addChild(root, 'root', { id: 'l1', type: 'JLabel', text: 'No results yet' }, 'CENTER')
    return root
  }

  it('passes a Playground-built tree that matches the target structurally', () => {
    const grade = gradeReverse(searchBar.target, buildSearchBar())
    expect(grade).toEqual({ pass: true, findings: [] })
  })

  it('reports missing and extra components by identity', () => {
    let root = buildSearchBar()
    root = {
      ...root,
      children: root.children!.map((c) =>
        c.node.id === 'p1'
          ? { ...c, node: { ...c.node, children: c.node.children!.filter((cc) => cc.node.id !== 'b1') } }
          : c,
      ),
    }
    root = addChild(root, 'root', { id: 'x1', type: 'JCheckBox', text: 'Check me' }, 'SOUTH')
    const grade = gradeReverse(searchBar.target, root)
    expect(grade.pass).toBe(false)
    expect(grade.findings).toContain('Missing from your build: a JButton “Search”.')
    expect(grade.findings).toContain('Not in the target: a JCheckBox “Check me”.')
  })

  it('flags right-components-wrong-arrangement when only placement differs', () => {
    let root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [],
    }
    // Same parts, but the bar in CENTER and the label in NORTH.
    root = addChild(
      root,
      'root',
      { id: 'p1', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [] },
      'CENTER',
    )
    root = addChild(root, 'p1', { id: 'f1', type: 'JTextField', text: '', columns: 10 })
    root = addChild(root, 'p1', { id: 'b1', type: 'JButton', text: 'Search' })
    root = addChild(root, 'root', { id: 'l1', type: 'JLabel', text: 'No results yet' }, 'NORTH')
    const grade = gradeReverse(searchBar.target, root)
    expect(grade.pass).toBe(false)
    expect(grade.findings).toHaveLength(1)
    expect(grade.findings[0]).toMatch(/wrong arrangement/)
  })

  it('flags differing panel layout settings when structure otherwise matches', () => {
    let root = buildSearchBar()
    // Same components, same regions — only the flow panel's align differs.
    root = {
      ...root,
      children: root.children!.map((c) =>
        c.node.id === 'p1'
          ? { ...c, node: { ...c.node, layout: { kind: 'flow' as const, align: 'RIGHT' as const, hgap: 5, vgap: 5 } } }
          : c,
      ),
    }
    const grade = gradeReverse(searchBar.target, root)
    expect(grade.pass).toBe(false)
    expect(grade.findings).toHaveLength(1)
    expect(grade.findings[0]).toMatch(/layout settings differ/)
  })

  it('flags a differing frame layout manager', () => {
    const root: SwingNode = {
      id: 'root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [],
    }
    const grade = gradeReverse(searchBar.target, root)
    expect(grade.pass).toBe(false)
    expect(grade.findings[0]).toMatch(/different layout manager/)
  })

  it('reverse: a structurally equivalent rebuild lays out to identical geometry (shared engine)', () => {
    const rebuilt = buildSearchBar()
    const rects = (root: SwingNode) =>
      [...layoutTree(root, searchBar.frameSize, testMeasurer).abs.values()]
        .map((r) => `${r.x},${r.y},${r.width},${r.height}`)
        .sort()
    expect(rects(rebuilt)).toEqual(rects(searchBar.target))
  })
})

describe('engine parity with the Playground', () => {
  // The same component tree must produce identical geometry whether it was
  // built by Playground reducer ops or by executing Parsons magnets — both
  // feed the same layoutTree. One test per new mode.

  it('parsons: executed magnet tree lays out identically to a Playground-built tree', () => {
    const exec = targetExec(confirmBar)

    // Build the equivalent tree the way the Playground does (addChild ops).
    let root: SwingNode = {
      id: FRAME_VAR,
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [],
    }
    root = addChild(root, FRAME_VAR, { id: 'nameField', type: 'JTextField', text: '', columns: 14 }, 'NORTH')
    root = addChild(
      root,
      FRAME_VAR,
      { id: 'buttonRow', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [] },
      'SOUTH',
    )
    root = addChild(root, 'buttonRow', { id: 'okButton', type: 'JButton', text: 'OK' })
    root = addChild(root, 'buttonRow', { id: 'cancelButton', type: 'JButton', text: 'Cancel' })

    const a = layoutTree(exec.root, confirmBar.frameSize, testMeasurer)
    const b = layoutTree(root, confirmBar.frameSize, testMeasurer)
    // Same ids on both trees — compare every absolute rect.
    expect(Object.fromEntries(a.abs)).toEqual(Object.fromEntries(b.abs))
  })

  it('reflow: the graded rect is exactly the rect the Playground would render', () => {
    const layout = layoutTree(flowWrap.root, flowWrap.endSize, testMeasurer)
    const graded = gradeReflow(
      flowWrap,
      { x: 0, y: 0 }, // guess irrelevant — we assert the truth rect
      testMeasurer,
    ).truth
    expect(graded).toEqual(layout.abs.get(flowWrap.targetId))
  })
})
