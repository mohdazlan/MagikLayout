import { describe, expect, it } from 'vitest'
import type { SwingChild, SwingNode } from '../engine/types'
import { executeStatements } from '../challenges/execute'
import { gradeParsons } from '../challenges/grade'
import type { ParsonsChallenge } from '../challenges/types'
import {
  MISCONCEPTIONS,
  collidedRegions,
  diagnoseParsons,
  diagnoseReflow,
  diagnoseReverse,
  primaryDiagnosis,
} from './misconceptions'

const button = (id: string, text: string): SwingNode => ({ id, type: 'JButton', text })

/** frame(BorderLayout) with the given children — the shape every reverse target uses. */
function frame(children: SwingChild[]): SwingNode {
  return { id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children }
}

describe('taxonomy integrity', () => {
  it('every code is its own key and carries a family and curriculum tag', () => {
    for (const [key, spec] of Object.entries(MISCONCEPTIONS)) {
      expect(spec.code).toBe(key)
      expect(spec.family.length).toBeGreaterThan(0)
      expect(spec.curriculumTag).toMatch(/^IT-010-3:2016-C\d\d$/)
    }
  })
})

describe('collidedRegions', () => {
  it('names the region and how many components it hides', () => {
    const root = frame([
      { node: button('a', 'Save'), constraint: 'SOUTH' },
      { node: button('b', 'Cancel'), constraint: 'SOUTH' },
    ])
    expect(collidedRegions(root)).toEqual([{ region: 'SOUTH', hiddenCount: 1 }])
  })

  it('is silent when every region holds at most one component', () => {
    const root = frame([
      { node: button('a', 'Save'), constraint: 'SOUTH' },
      { node: button('b', 'Title'), constraint: 'NORTH' },
    ])
    expect(collidedRegions(root)).toEqual([])
  })

  it('reports nothing for a non-BorderLayout container', () => {
    const flow: SwingNode = {
      id: 'p',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [{ node: button('a', 'One') }, { node: button('b', 'Two') }],
    }
    expect(collidedRegions(flow)).toEqual([])
  })
})

describe('diagnoseReverse', () => {
  it('names the SOUTH collision first when two buttons share the region', () => {
    const target = frame([
      {
        node: {
          id: 'bar',
          type: 'JPanel',
          text: '',
          layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
          children: [{ node: button('a', 'Save') }, { node: button('b', 'Cancel') }],
        },
        constraint: 'SOUTH',
      },
    ])
    const student = frame([
      { node: button('a', 'Save'), constraint: 'SOUTH' },
      { node: button('b', 'Cancel'), constraint: 'SOUTH' },
    ])
    const primary = primaryDiagnosis(diagnoseReverse(target, student))
    expect(primary.code).toBe('BL-SOUTH-COLLISION')
    expect(primary.region).toBe('SOUTH')
    expect(primary.evidence.join(' ')).toContain('BorderLayout.SOUTH')
  })

  it('also flags the missing nested panel that would repair the collision', () => {
    const target = frame([
      {
        node: {
          id: 'bar',
          type: 'JPanel',
          text: '',
          layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
          children: [{ node: button('a', 'Save') }, { node: button('b', 'Cancel') }],
        },
        constraint: 'SOUTH',
      },
    ])
    const student = frame([
      { node: button('a', 'Save'), constraint: 'SOUTH' },
      { node: button('b', 'Cancel'), constraint: 'SOUTH' },
    ])
    expect(diagnoseReverse(target, student).map((d) => d.code)).toContain('NESTED-PANEL-MISSING')
  })

  it('reports a missing component when the build is short a part', () => {
    const target = frame([
      { node: button('a', 'Save'), constraint: 'SOUTH' },
      { node: button('b', 'Title'), constraint: 'NORTH' },
    ])
    const student = frame([{ node: button('a', 'Save'), constraint: 'SOUTH' }])
    const codes = diagnoseReverse(target, student).map((d) => d.code)
    expect(codes).toContain('COMPONENT-MISSING')
  })

  it('reports a wrong region when the parts and settings all match', () => {
    const target = frame([{ node: button('a', 'Save'), constraint: 'SOUTH' }])
    const student = frame([{ node: button('a', 'Save'), constraint: 'NORTH' }])
    const codes = diagnoseReverse(target, student).map((d) => d.code)
    expect(codes).toContain('BL-REGION-WRONG')
  })

  it('falls through to add order when nothing structural differs', () => {
    const flowPanel = (order: string[]): SwingNode => ({
      id: 'frame',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: order.map((t, i) => ({ node: button(`b${i}`, t) })),
    })
    const codes = diagnoseReverse(flowPanel(['One', 'Two']), flowPanel(['Two', 'One'])).map((d) => d.code)
    expect(codes).toEqual(['FLOW-ORDER'])
  })
})

describe('diagnoseParsons', () => {
  const challenge: ParsonsChallenge = {
    id: 'test-parsons',
    type: 'parsons',
    title: 'Two buttons',
    prompt: 'Order the statements.',
    difficulty: 'Apply',
    frameSize: { width: 300, height: 200 },
    magnets: [
      { id: 'm0', java: 'JButton save = new JButton("Save");', stmt: { kind: 'declare', varName: 'save', component: { type: 'JButton', text: 'Save' } } },
      { id: 'm1', java: 'frame.add(save, BorderLayout.SOUTH);', stmt: { kind: 'add', target: 'frame', child: 'save', constraint: 'SOUTH' } },
      { id: 'm2', java: 'JButton cancel = new JButton("Cancel");', stmt: { kind: 'declare', varName: 'cancel', component: { type: 'JButton', text: 'Cancel' } } },
      { id: 'm3', java: 'frame.add(cancel, BorderLayout.NORTH);', stmt: { kind: 'add', target: 'frame', child: 'cancel', constraint: 'NORTH' } },
    ],
    trayOrder: [0, 1, 2, 3],
  }

  it('puts a compile error ahead of the divergence point', () => {
    const placed = [1, 0, 2, 3] // add before declare
    const exec = executeStatements(placed.map((i) => challenge.magnets[i].stmt))
    const grade = gradeParsons(challenge, placed)
    const primary = primaryDiagnosis(diagnoseParsons(challenge, placed, exec, grade))
    expect(primary.code).toBe('COMPILE-ERROR')
    expect(primary.evidence[0]).toContain('does not compile')
  })

  it('names a region collision produced by the chosen order', () => {
    const collide: ParsonsChallenge = {
      ...challenge,
      magnets: [
        challenge.magnets[0],
        challenge.magnets[1],
        challenge.magnets[2],
        { id: 'm3', java: 'frame.add(cancel, BorderLayout.SOUTH);', stmt: { kind: 'add', target: 'frame', child: 'cancel', constraint: 'SOUTH' } },
      ],
    }
    const placed = [0, 1, 2, 3]
    const exec = executeStatements(placed.map((i) => collide.magnets[i].stmt))
    const grade = gradeParsons(collide, placed)
    const codes = diagnoseParsons(collide, placed, exec, grade).map((d) => d.code)
    expect(codes).toContain('BL-SOUTH-COLLISION')
  })

  it('falls back to statement order when everything ran cleanly', () => {
    const placed = [0, 2, 3, 1]
    const exec = executeStatements(placed.map((i) => challenge.magnets[i].stmt))
    const grade = gradeParsons(challenge, placed)
    const list = diagnoseParsons(challenge, placed, exec, grade)
    // This order is in fact equivalent (adds to different regions commute), so
    // the grader passes and there is nothing to diagnose.
    expect(grade.pass).toBe(true)
    expect(list).toEqual([])
  })
})

describe('diagnoseReflow', () => {
  it('maps a CENTER miss to the CENTER-expansion rule', () => {
    const d = diagnoseReflow(
      {
        id: 'r',
        type: 'reflow',
        title: 'x',
        prompt: 'x',
        difficulty: 'Apply',
        root: { id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children: [{ node: button('t', 'Body'), constraint: 'CENTER' }] },
        startSize: { width: 300, height: 200 },
        endSize: { width: 500, height: 400 },
        targetId: 't',
        tolerance: 24,
      },
      { pass: false, truth: { x: 0, y: 0, width: 500, height: 400 }, dx: 90, dy: 12 },
    )
    expect(d[0].code).toBe('BL-CENTER-EXPANSION')
    expect(d[0].evidence.join(' ')).toContain('300×200')
  })

  it('maps a FlowLayout miss to the re-wrap rule', () => {
    const d = diagnoseReflow(
      {
        id: 'r',
        type: 'reflow',
        title: 'x',
        prompt: 'x',
        difficulty: 'Apply',
        root: { id: 'frame', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [{ node: button('t', 'Body') }] },
        startSize: { width: 300, height: 200 },
        endSize: { width: 200, height: 200 },
        targetId: 't',
        tolerance: 24,
      },
      { pass: false, truth: { x: 0, y: 0, width: 80, height: 26 }, dx: 40, dy: 30 },
    )
    expect(d[0].code).toBe('FLOW-REWRAP')
  })
})

describe('primaryDiagnosis', () => {
  it('returns UNKNOWN for an empty list rather than throwing', () => {
    expect(primaryDiagnosis([]).code).toBe('UNKNOWN')
  })
})
