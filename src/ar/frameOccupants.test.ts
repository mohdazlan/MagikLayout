import { describe, expect, it } from 'vitest'
import type { SwingNode } from '../engine/types'
import { frameOccupants } from './frameOccupants'

function frame(children: SwingNode['children']): SwingNode {
  return { id: 'root', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children }
}
const leaf = (id: string, type: SwingNode['type'], text = ''): SwingNode => ({ id, type, text })

describe('frameOccupants', () => {
  it('maps each occupied region to one occupant, defaulting a missing constraint to CENTER', () => {
    const occ = frameOccupants(
      frame([
        { node: leaf('a', 'JLabel', 'Title'), constraint: 'NORTH' },
        { node: leaf('b', 'JButton', 'OK') }, // no constraint → CENTER
      ]),
    )
    expect(occ.map((o) => o.region).sort()).toEqual(['CENTER', 'NORTH'])
    expect(occ.find((o) => o.region === 'NORTH')!.label).toBe('Title')
    expect(occ.find((o) => o.region === 'CENTER')!.label).toBe('OK')
  })

  it('keeps only the last component in a region — matching BorderLayout "last wins"', () => {
    const occ = frameOccupants(
      frame([
        { node: leaf('a', 'JButton', 'first'), constraint: 'SOUTH' },
        { node: leaf('b', 'JButton', 'second'), constraint: 'SOUTH' },
      ]),
    )
    const south = occ.filter((o) => o.region === 'SOUTH')
    expect(south).toHaveLength(1)
    expect(south[0].label).toBe('second')
  })

  it('falls back to the component type when it has no text', () => {
    const occ = frameOccupants(frame([{ node: leaf('a', 'JTextField'), constraint: 'CENTER' }]))
    expect(occ[0].label).toBe('JTextField')
  })

  it('returns [] for a non-BorderLayout frame (AR is scoped to BorderLayout)', () => {
    const flow: SwingNode = { id: 'root', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'LEFT', hgap: 0, vgap: 0 }, children: [{ node: leaf('a', 'JButton', 'x') }] }
    expect(frameOccupants(flow)).toEqual([])
  })
})
