import { describe, expect, it } from 'vitest'
import { parseRoute, challengeHref } from './router'
import { CHALLENGES } from './challenges/data'

describe('router', () => {
  it('resolves the bare #/challenges index (no id)', () => {
    expect(parseRoute('#/challenges')).toEqual({ view: 'challenges', challengeId: null })
    expect(parseRoute('#/challenges/')).toEqual({ view: 'challenges', challengeId: null })
  })

  it('resolves an individual challenge route', () => {
    expect(parseRoute('#/challenges/parsons-confirm-bar')).toEqual({
      view: 'challenges',
      challengeId: 'parsons-confirm-bar',
    })
  })

  it('falls back to the playground for root, empty, and unknown hashes', () => {
    expect(parseRoute('#/')).toEqual({ view: 'playground' })
    expect(parseRoute('')).toEqual({ view: 'playground' })
    expect(parseRoute('#/nonsense')).toEqual({ view: 'playground' })
  })

  it('routes the NOSS-aligned AR learning module', () => {
    expect(parseRoute('#/ar-lab')).toEqual({ view: 'ar-lab' })
    expect(parseRoute('#/ar-lab/')).toEqual({ view: 'ar-lab' })
  })

  it('every shipped challenge id round-trips href → parseRoute (index rows navigate)', () => {
    for (const c of CHALLENGES) {
      expect(parseRoute(challengeHref(c.id))).toEqual({ view: 'challenges', challengeId: c.id })
    }
  })

  it('the contextual-bridge target is a real challenge id', () => {
    // Playground's hidden-notice links to this exact id; keep them in lockstep.
    expect(CHALLENGES.some((c) => c.id === 'parsons-confirm-bar')).toBe(true)
  })
})

describe('challenge index grouping', () => {
  it('ships every exercise grouped under a known mode, with valid Bloom tags', () => {
    expect(CHALLENGES).toHaveLength(10)
    const byMode = (t: string) => CHALLENGES.filter((c) => c.type === t)
    expect(byMode('parsons')).toHaveLength(3)
    expect(byMode('reflow')).toHaveLength(3)
    expect(byMode('reverse')).toHaveLength(4)
    // every challenge lands in exactly one of the three index groups
    expect(byMode('parsons').length + byMode('reflow').length + byMode('reverse').length).toBe(
      CHALLENGES.length,
    )
    for (const c of CHALLENGES) {
      expect(['Recall', 'Apply', 'Analyze']).toContain(c.difficulty)
      expect(c.title.length).toBeGreaterThan(0)
      expect(c.prompt.length).toBeGreaterThan(0)
    }
  })
})
