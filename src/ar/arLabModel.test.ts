import { describe, expect, it } from 'vitest'
import { buildMissionTree, missionScore } from './arLabModel'

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
})
