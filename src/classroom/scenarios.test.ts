import { describe, expect, it } from 'vitest'
import { CORPUS_LANGUAGES } from '../coach/corpus'
import { retrieve } from '../coach/retrieve'
import { SCENARIOS, findScenario } from './scenarios'

describe('demo scenarios', () => {
  it('resolves by id', () => {
    expect(findScenario('south-collision')?.mode).toBe('reverse')
    expect(findScenario('nope')).toBeUndefined()
  })

  it('reproduces the misconception each one claims to show', () => {
    const actual = Object.fromEntries(SCENARIOS.map((s) => [s.id, s.diagnosis.code]))
    expect(actual).toEqual({
      'south-collision': 'BL-SOUTH-COLLISION',
      'setlayout-timing': 'SETLAYOUT-AFTER-ADD',
      'grid-order': 'GRID-ORDER',
      'center-expansion': 'BL-CENTER-EXPANSION',
    })
  })

  it('carries engine evidence, not an empty finding', () => {
    for (const scenario of SCENARIOS) {
      expect(scenario.diagnosis.evidence.length, scenario.id).toBeGreaterThan(0)
    }
  })

  it('covers all three challenge modes', () => {
    expect(new Set(SCENARIOS.map((s) => s.mode))).toEqual(new Set(['reverse', 'parsons', 'reflow']))
  })

  it('is teachable — every scenario retrieves approved content in both languages', () => {
    for (const scenario of SCENARIOS) {
      for (const language of CORPUS_LANGUAGES) {
        const result = retrieve({ code: scenario.diagnosis.code, language, hintLevel: 1, limit: 1 })
        expect(result.hits.length, `${scenario.id} ${language}`).toBeGreaterThan(0)
      }
    }
  })
})
