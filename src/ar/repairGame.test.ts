import { describe, it, expect } from 'vitest'
import { emptyRepair, repairStep, repairTree, repairScene } from './repairGame'
import { layoutTree } from '../engine/layoutTree'
import { testMeasurer } from '../engine/metrics'
import { generateJava } from '../codegen/javaCode'
describe('AR repair exercise', () => {
  it('rejects premature placement and button insertion', () => {
    const s = emptyRepair()
    expect(repairStep(s, 'SOUTH')).toBe(s)
    expect(repairStep(s, 'submit')).toBe(s)
    expect(repairStep(s, 'flow')).toBe(s)
  })
  it('repairs the hidden button through a nested FlowLayout panel', () => {
    let s = emptyRepair()
    expect(layoutTree(repairTree(s), { width: 400, height: 270 }, testMeasurer).hidden.map(h => h.id)).toContain('submit')
    for (const action of ['panel', 'flow', 'cancel', 'submit', 'SOUTH'] as const) s = repairStep(s, action)
    expect(s.placed).toBe(true)
    expect(layoutTree(repairTree(s), { width: 400, height: 270 }, testMeasurer).hidden).toEqual([])
    const narrow = repairScene(s, 400, false), wide = repairScene(s, 640, false)
    expect(wide.pieces.find(p => p.id === 'actions')!.w).toBeGreaterThan(narrow.pieces.find(p => p.id === 'actions')!.w)
    expect(wide.pieces.find(p => p.id === 'submit')!.w).toBe(narrow.pieces.find(p => p.id === 'submit')!.w)
    expect(generateJava(repairTree(s), { width: 400, height: 270 }).code).toContain('FlowLayout by default')
  })
})
