import { describe, expect, it } from 'vitest'
import { chunkById } from './corpus'
import { authorizeHintLevel, deterministicHint, type LadderState } from './hintPolicy'
import type { Diagnosis } from './misconceptions'
import { retrieve, retrieveLadder } from './retrieve'

describe('retrieve', () => {
  it('prefers a code-specific chunk over the family fallback', () => {
    const result = retrieve({ code: 'BL-SOUTH-COLLISION', language: 'en-MY', hintLevel: 2 })
    expect(result.hits[0].matchedOn).toBe('code')
    expect(result.hits[0].chunk.sourceId).toBe('ML-BLS-L2')
    expect(result.confidence).toBe('high')
  })

  it('falls back to the family when a code has no authored chunk', () => {
    // BL-NORTH-COLLISION is deliberately taught by the BL-REGION family content.
    const result = retrieve({ code: 'BL-NORTH-COLLISION', language: 'en-MY', hintLevel: 2 })
    expect(result.hits[0].matchedOn).toBe('family')
    expect(result.hits[0].chunk.family).toBe('BL-REGION')
    expect(result.confidence).toBe('medium')
  })

  it('never returns a chunk above the authorised level', () => {
    for (const level of [1, 2, 3] as const) {
      const result = retrieve({ code: 'BL-SOUTH-COLLISION', language: 'en-MY', hintLevel: level, limit: 10 })
      expect(result.hits.every((h) => h.chunk.hintLevel <= level)).toBe(true)
    }
  })

  it('never returns the worked explanation at level 1', () => {
    const result = retrieve({ code: 'BL-SOUTH-COLLISION', language: 'en-MY', hintLevel: 1, limit: 10 })
    expect(result.hits.some((h) => h.chunk.hintLevel === 4)).toBe(false)
  })

  it('returns only chunks in the requested language', () => {
    const ms = retrieve({ code: 'BL-SOUTH-COLLISION', language: 'ms-MY', hintLevel: 3, limit: 10 })
    expect(ms.hits.length).toBeGreaterThan(0)
    expect(ms.hits.every((h) => h.chunk.language === 'ms-MY')).toBe(true)
  })

  it('always returns at least one chunk with a resolvable citation id', () => {
    const result = retrieve({ code: 'SETLAYOUT-AFTER-ADD', language: 'ms-MY', hintLevel: 2 })
    expect(result.chunkIds.length).toBeGreaterThan(0)
    for (const id of result.chunkIds) expect(chunkById(id)).toBeDefined()
  })

  it('is deterministic — the same query returns the same ids in the same order', () => {
    const q = { code: 'GRID-ORDER', language: 'en-MY', hintLevel: 3 } as const
    expect(retrieve(q).chunkIds).toEqual(retrieve(q).chunkIds)
  })

  it('uses engine evidence only to break ties, never to change the match', () => {
    const withEvidence = retrieve({
      code: 'BL-SOUTH-COLLISION',
      language: 'en-MY',
      hintLevel: 2,
      evidence: ['3 components are added directly to BorderLayout.SOUTH of the frame.'],
    })
    const without = retrieve({ code: 'BL-SOUTH-COLLISION', language: 'en-MY', hintLevel: 2 })
    expect(withEvidence.hits[0].chunk.chunkId).toBe(without.hits[0].chunk.chunkId)
  })
})

describe('retrieveLadder', () => {
  it('returns one result per level up to the cap', () => {
    const ladder = retrieveLadder('BL-SOUTH-COLLISION', 'en-MY', 3)
    expect(ladder.map((r) => r.servedLevel)).toEqual([1, 2, 3])
  })

  it('includes the worked explanation only when level 4 is requested', () => {
    expect(retrieveLadder('BL-SOUTH-COLLISION', 'en-MY', 4).map((r) => r.servedLevel)).toEqual([1, 2, 3, 4])
  })
})

describe('authorizeHintLevel', () => {
  const base: LadderState = { attempts: 0, hintsServed: 0, solved: false, teacherUnlocked: false }

  it('refuses a hint before the student has run a check', () => {
    const d = authorizeHintLevel(base)
    expect(d.granted).toBe(false)
  })

  it('grants a level 1 nudge on the first failed attempt', () => {
    const d = authorizeHintLevel({ ...base, attempts: 1 })
    expect(d).toMatchObject({ granted: true, level: 1 })
  })

  it('refuses to escalate until the student attempts again', () => {
    const d = authorizeHintLevel({ ...base, attempts: 1, hintsServed: 1 })
    expect(d.granted).toBe(false)
    expect(d.reason).toContain('next check')
  })

  it('escalates one level per further attempt, capped below the worked explanation', () => {
    expect(authorizeHintLevel({ ...base, attempts: 2, hintsServed: 1 })).toMatchObject({ level: 2 })
    expect(authorizeHintLevel({ ...base, attempts: 3, hintsServed: 2 })).toMatchObject({ level: 3 })
    expect(authorizeHintLevel({ ...base, attempts: 9, hintsServed: 8 })).toMatchObject({ level: 3 })
  })

  it('releases the worked explanation after a successful repair', () => {
    expect(authorizeHintLevel({ ...base, attempts: 3, hintsServed: 2, solved: true })).toMatchObject({ level: 4 })
  })

  it('releases the worked explanation when a teacher unlocks it', () => {
    expect(authorizeHintLevel({ ...base, teacherUnlocked: true })).toMatchObject({ level: 4 })
  })
})

describe('deterministicHint', () => {
  const diagnosis: Diagnosis = {
    code: 'BL-SOUTH-COLLISION',
    family: 'BL-REGION',
    confidence: 'high',
    region: 'SOUTH',
    evidence: ['2 components are added directly to BorderLayout.SOUTH of the frame.'],
  }

  it('answers from approved corpus text with citations, no model involved', () => {
    const hint = deterministicHint(diagnosis, 'en-MY', 2)
    expect(hint.source).toBe('corpus')
    expect(hint.chunkIds).toEqual(['ML-BLS-L2:en-MY'])
    expect(hint.text).toBe(chunkById('ML-BLS-L2:en-MY')!.text)
  })

  it('answers in Bahasa Malaysia when asked', () => {
    const hint = deterministicHint(diagnosis, 'ms-MY', 2)
    expect(hint.chunkIds).toEqual(['ML-BLS-L2:ms-MY'])
    expect(hint.text).toContain('BorderLayout')
  })

  it('degrades to the engine findings rather than inventing content', () => {
    const hint = deterministicHint(diagnosis, 'en-MY', 2, {
      hits: [],
      confidence: 'none',
      servedLevel: null,
      chunkIds: [],
      query: { code: diagnosis.code, language: 'en-MY', hintLevel: 2 },
    })
    expect(hint.source).toBe('engine-only')
    expect(hint.text).toBe(diagnosis.evidence[0])
  })
})
