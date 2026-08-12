import { describe, expect, it } from 'vitest'
import type { CoachLogRecord } from '../coach/log'
import { toCsv } from '../coach/log'
import { buildEpisodes, buildEvidenceBundle, formatRate, summarizeCohort } from './cohort'
import { createSession, generateLearnerLabel, generateSessionCode, joinLink, normalizeSessionCode } from './session'

/** A seeded generator, so a "random" code is reproducible in a test. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 0xffffffff
    return state / 0xffffffff
  }
}

describe('session codes', () => {
  it('generates six characters from the unambiguous alphabet', () => {
    const code = generateSessionCode(seeded(7))
    expect(code).toHaveLength(6)
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRTUVWXYZ2346789]{6}$/)
  })

  it('never emits characters that are misread aloud', () => {
    for (let seed = 1; seed < 200; seed++) {
      expect(generateSessionCode(seeded(seed))).not.toMatch(/[OI01S5]/)
    }
  })

  it('labels learners anonymously', () => {
    expect(generateLearnerLabel(seeded(3))).toMatch(/^L-[A-Z2-9]{4}$/)
  })

  it('accepts what a learner actually types', () => {
    const code = generateSessionCode(seeded(11))
    expect(normalizeSessionCode(code.toLowerCase())).toBe(code)
    expect(normalizeSessionCode(` ${code.slice(0, 3)}-${code.slice(3)} `)).toBe(code)
  })

  it('repairs the confusable characters the alphabet omits', () => {
    expect(normalizeSessionCode('QRTUVW')).toBe('QRTUVW')
    expect(normalizeSessionCode('0RTUVW')).toBe('QRTUVW') // typed zero for Q
    expect(normalizeSessionCode('QRTUV5')).toBe('QRTUVW') // typed five for W
  })

  it('rejects a malformed code instead of guessing', () => {
    expect(normalizeSessionCode('ABC')).toBeNull()
    expect(normalizeSessionCode('ABCDEFG')).toBeNull()
    expect(normalizeSessionCode('ABC@EF')).toBeNull()
  })

  it('builds a join link that works from any device', () => {
    expect(joinLink('QRTUVW', 'https://example.test/')).toBe('https://example.test/#/classroom/QRTUVW')
  })

  it('creates a session with a timestamp and no learner data', () => {
    const session = createSession({ label: '4 Amanah / Wed p3', lessonId: 'bl-south-collision', aiEnabled: false, random: seeded(5), now: () => 0 })
    expect(session.createdAt).toBe('1970-01-01T00:00:00.000Z')
    expect(Object.keys(session).sort()).toEqual(['aiEnabled', 'code', 'createdAt', 'label', 'lessonId'])
  })
})

// ── Cohort ────────────────────────────────────────────────────────────────

function record(over: Partial<CoachLogRecord> = {}): CoachLogRecord {
  return {
    timestamp: '2026-08-13T01:00:00.000Z',
    sessionId: 'QRTUVW',
    learnerLabel: 'L-AAAA',
    challengeId: 'bl-south-collision',
    misconceptionCode: 'BL-SOUTH-COLLISION',
    family: 'BL-REGION',
    language: 'en-MY',
    requestedLevel: 1,
    servedLevel: 1,
    retrievedChunkIds: ['ML-BLS-L1:en-MY'],
    citedChunkIds: ['ML-BLS-L1:en-MY'],
    source: 'corpus',
    model: null,
    corpusVersion: 'v1.0',
    latencyMs: 3,
    guardViolations: [],
    outcome: 'served-corpus',
    attempts: 1,
    hintsServed: 0,
    ...over,
  }
}

describe('episodes', () => {
  it('groups by learner and challenge, not by request', () => {
    const episodes = buildEpisodes([
      record({ learnerLabel: 'L-AAAA' }),
      record({ learnerLabel: 'L-AAAA', servedLevel: 2 }),
      record({ learnerLabel: 'L-BBBB' }),
    ])
    expect(episodes).toHaveLength(2)
    expect(episodes[0].hintsServed).toBe(2)
    expect(episodes[0].maxHintLevel).toBe(2)
  })

  it('does not count a withheld request as a hint', () => {
    const episodes = buildEpisodes([record({ outcome: 'withheld', servedLevel: null })])
    expect(episodes[0].hintsServed).toBe(0)
    expect(episodes[0].maxHintLevel).toBe(0)
  })

  it('treats an eventual success as a success', () => {
    const episodes = buildEpisodes([record({ repairSucceeded: false }), record({ servedLevel: 2, repairSucceeded: true })])
    expect(episodes[0].succeeded).toBe(true)
  })
})

describe('cohort summary', () => {
  it('counts learners, episodes and hint requests', () => {
    const summary = summarizeCohort('QRTUVW', [
      record({ learnerLabel: 'L-AAAA', repairSucceeded: true }),
      record({ learnerLabel: 'L-BBBB', servedLevel: 3, repairSucceeded: false }),
      record({ learnerLabel: 'L-BBBB', outcome: 'withheld', servedLevel: null }),
    ])
    expect(summary.learners).toBe(2)
    expect(summary.episodes).toBe(2)
    expect(summary.hintRequests).toBe(2)
    expect(summary.withheld).toBe(1)
  })

  it('ignores records from another session', () => {
    const summary = summarizeCohort('QRTUVW', [record(), record({ sessionId: 'ZZZZZZ' })])
    expect(summary.hintRequests).toBe(1)
  })

  it('ranks misconceptions by frequency and counts distinct learners', () => {
    const summary = summarizeCohort('QRTUVW', [
      record({ learnerLabel: 'L-AAAA' }),
      record({ learnerLabel: 'L-BBBB' }),
      record({ learnerLabel: 'L-CCCC', challengeId: 'x', misconceptionCode: 'GRID-ORDER', family: 'ORDER' }),
    ])
    expect(summary.byMisconception[0]).toMatchObject({ code: 'BL-SOUTH-COLLISION', occurrences: 2, learners: 2 })
    expect(summary.byMisconception[1]).toMatchObject({ code: 'GRID-ORDER', occurrences: 1 })
  })

  it('measures hint independence against successful episodes only', () => {
    const summary = summarizeCohort('QRTUVW', [
      record({ learnerLabel: 'L-AAAA', servedLevel: 1, repairSucceeded: true }),
      record({ learnerLabel: 'L-BBBB', servedLevel: 3, repairSucceeded: true }),
      record({ learnerLabel: 'L-CCCC', servedLevel: 3, repairSucceeded: false }),
    ])
    expect(summary.repairRate).toBeCloseTo(2 / 3)
    expect(summary.hintIndependence).toBeCloseTo(1 / 2)
  })

  it('reports nothing rather than a spurious zero when no outcome was recorded', () => {
    const summary = summarizeCohort('QRTUVW', [record()])
    expect(summary.repairRate).toBeNull()
    expect(summary.hintIndependence).toBeNull()
    expect(formatRate(summary.repairRate)).toBe('—')
  })

  it('surfaces guard violations and fallbacks rather than hiding them', () => {
    const summary = summarizeCohort('QRTUVW', [
      record({ outcome: 'fallback-guard', guardViolations: ['code-leakage'], model: 'test' }),
      record({ outcome: 'served-corpus' }),
    ])
    expect(summary.guardViolations).toBe(1)
    expect(summary.fallbackRate).toBeCloseTo(0.5)
  })
})

describe('evidence bundle', () => {
  const session = { code: 'QRTUVW', label: '4 Amanah', lessonId: 'bl-south-collision', createdAt: '2026-08-13T00:00:00.000Z' }

  it('carries the summary, the raw records and the privacy notice', () => {
    const bundle = buildEvidenceBundle({ session, records: [record({ repairSucceeded: true })], now: () => 0 })
    expect(bundle.summary.repairRate).toBe(1)
    expect(bundle.records).toHaveLength(1)
    expect(bundle.notice).toContain('not linked to any name')
  })

  it('exports no personal data — only labels, codes and engine outcomes', () => {
    const bundle = buildEvidenceBundle({ session, records: [record()], now: () => 0 })
    const serialized = JSON.stringify(bundle)
    expect(serialized).not.toMatch(/@/) // no email-shaped value anywhere
    expect(serialized).toContain('L-AAAA')
  })

  it('produces a CSV a teacher can open in a spreadsheet', () => {
    const csv = toCsv([record({ repairSucceeded: true })])
    const [header, row] = csv.split('\n')
    expect(header.startsWith('timestamp,sessionId,learnerLabel')).toBe(true)
    expect(row).toContain('BL-SOUTH-COLLISION')
    expect(row).toContain('ML-BLS-L1:en-MY')
  })
})
