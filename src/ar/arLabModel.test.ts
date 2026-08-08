import { describe, expect, it } from 'vitest'
import { applyARInteraction, buildMissionTree, missionScore } from './arLabModel'

describe('AR lab model', () => {
  it('represents the duplicate SOUTH collision before the structural fix', () => {
    const tree = buildMissionTree({ mission: 3, collisionRevealed: true })
    expect(tree.children?.filter((child) => child.constraint === 'SOUTH')).toHaveLength(2)
  })

  it('uses one nested JPanel in SOUTH after the learner fixes the collision', () => {
    const tree = buildMissionTree({ mission: 3, collisionRevealed: true, collisionFixed: true })
    const south = tree.children?.filter((child) => child.constraint === 'SOUTH') ?? []
    expect(south).toHaveLength(1)
    expect(south[0].node.type).toBe('JPanel')
    expect(south[0].node.children).toHaveLength(2)
  })

  it('scores only completed deterministic outcomes', () => {
    expect(missionScore({ mission: 3, placedRegion: 'NORTH', resizeRevealed: true, collisionFixed: true })).toBe(3)
  })

  it('requires the learner to tap NORTH directly in AR for mission 1', () => {
    const wrong = applyARInteraction({ mission: 1 }, { kind: 'region', region: 'WEST' })
    expect(wrong.status).toBe('incorrect')
    expect(wrong.visual.placedRegion).toBe('WEST')

    const correct = applyARInteraction(wrong.visual, { kind: 'region', region: 'NORTH' })
    expect(correct.status).toBe('passed')
    expect(correct.visual.placedRegion).toBe('NORTH')
  })

  it('reveals and repairs the SOUTH collision through two distinct AR taps', () => {
    const reveal = applyARInteraction({ mission: 3 }, { kind: 'reveal-collision' })
    expect(reveal.status).toBe('progress')
    expect(reveal.visual.collisionRevealed).toBe(true)
    expect(reveal.visual.collisionFixed).toBeUndefined()

    const repair = applyARInteraction(reveal.visual, { kind: 'repair-panel' })
    expect(repair.status).toBe('passed')
    expect(repair.visual.collisionFixed).toBe(true)
  })

  it('does not accept the repair hotspot before X-ray diagnosis', () => {
    const result = applyARInteraction({ mission: 3 }, { kind: 'repair-panel' })
    expect(result.status).toBe('incorrect')
    expect(result.visual.collisionRevealed).toBeUndefined()
  })
})
