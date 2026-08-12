import { describe, expect, it } from 'vitest'
import { MISCONCEPTIONS } from '../misconceptions'
import { ACCEPTABLE_SOURCES, EVAL_CASES } from './cases'
import { formatReport, runEval } from './runEval'

describe('the evaluation set', () => {
  it('covers every misconception code at every student-facing level in both languages', () => {
    expect(EVAL_CASES.length).toBe(Object.keys(MISCONCEPTIONS).length * 3 * 2)
  })

  it('names a gold-standard source for every code', () => {
    for (const code of Object.keys(MISCONCEPTIONS)) {
      expect(ACCEPTABLE_SOURCES[code as keyof typeof ACCEPTABLE_SOURCES]).toHaveLength(3)
    }
  })
})

describe('acceptance gate — deterministic mode (AI off)', () => {
  it('passes every minimum-viable RAG acceptance criterion', async () => {
    const report = await runEval('deterministic')
    const failures = report.criteria.filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`)
    expect(failures).toEqual([])
    expect(report.pass).toBe(true)
  })

  it('meets the retrieval precision target', async () => {
    const report = await runEval('deterministic')
    expect(report.retrievalPrecision).toBeGreaterThanOrEqual(0.95)
  })

  it('ranks the gold-standard primary source first in every case', async () => {
    const report = await runEval('deterministic')
    const wrong = report.results.filter((r) => r.retrieved[0] !== r.case.primaryChunkId).map((r) => r.case.id)
    expect(wrong).toEqual([])
  })

  it('holds the contradiction and leakage rates at zero', async () => {
    const report = await runEval('deterministic')
    expect(report.contradictionRate).toBe(0)
    expect(report.leakageRate).toBe(0)
  })
})

describe('acceptance gate — adversarial mode (a misbehaving model)', () => {
  it('still passes every criterion, because the guard substitutes approved text', async () => {
    const report = await runEval('adversarial')
    const failures = report.criteria.filter((c) => !c.pass).map((c) => `${c.id}: ${c.detail}`)
    expect(failures).toEqual([])
  })

  it('serves no model output at all — every adversarial response is caught', async () => {
    const report = await runEval('adversarial')
    const servedByModel = report.results.filter((r) => r.log.outcome === 'served-model')
    expect(servedByModel).toEqual([])
  })

  it('records the guard violations it caught rather than hiding them', async () => {
    const report = await runEval('adversarial')
    const caught = new Set(report.results.flatMap((r) => r.guardViolations))
    expect(caught.has('code-leakage')).toBe(true)
    expect(caught.has('unknown-citation')).toBe(true)
    expect(caught.has('contradiction')).toBe(true)
    expect(caught.has('wrong-language')).toBe(true)
  })

  it('gives the student a usable hint in every single case', async () => {
    const report = await runEval('adversarial')
    expect(report.results.every((r) => r.servedText.trim().length > 0)).toBe(true)
  })
})

describe('formatReport', () => {
  it('renders a report a human can paste into the project documentation', async () => {
    const text = formatReport(await runEval('deterministic'))
    expect(text).toContain('RAG acceptance gate')
    expect(text).toContain('GATE: PASS')
  })
})
