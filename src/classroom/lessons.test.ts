import { describe, expect, it } from 'vitest'
import { findChallenge } from '../challenges/data'
import { CORPUS_LANGUAGES, HINT_LEVELS } from '../coach/corpus'
import { MISCONCEPTIONS } from '../coach/misconceptions'
import { retrieve } from '../coach/retrieve'
import { LESSON_PACKS, findLessonPack } from './lessons'

describe('lesson packs', () => {
  it('resolves by id', () => {
    expect(findLessonPack('bl-south-collision')?.misconception).toBe('BL-SOUTH-COLLISION')
    expect(findLessonPack('nope')).toBeUndefined()
  })

  for (const pack of LESSON_PACKS) {
    describe(pack.id, () => {
      it('targets a misconception that exists in the taxonomy', () => {
        expect(MISCONCEPTIONS[pack.misconception]).toBeDefined()
      })

      it('is teachable in both languages at every rung the ladder can serve', () => {
        for (const language of CORPUS_LANGUAGES) {
          for (const level of HINT_LEVELS) {
            const result = retrieve({ code: pack.misconception, language, hintLevel: level, limit: 1 })
            expect(result.hits.length, `${pack.id} ${language} L${level}`).toBeGreaterThan(0)
          }
        }
      })

      it('only points at challenges that actually exist', () => {
        for (const id of [...pack.practiceChallengeIds, ...pack.transferChallengeIds]) {
          expect(findChallenge(id), `${pack.id} references missing challenge ${id}`).toBeDefined()
        }
      })

      it('has bilingual text everywhere a learner reads', () => {
        const pairs = [pack.title, pack.learningOutcome, pack.hook, ...pack.exitTicket.map((item) => item.prompt)]
        for (const pair of pairs) {
          expect(pair.en.trim().length).toBeGreaterThan(0)
          expect(pair.ms.trim().length).toBeGreaterThan(0)
        }
      })

      it('states one measurable outcome, not a list of activities', () => {
        expect(pack.learningOutcome.en).toMatch(/By the end/i)
        expect(pack.learningOutcome.en.split(/(?<=\.)\s/).length).toBe(1)
      })

      it('carries a NOSS mapping a coordinator can check', () => {
        expect(pack.noss.unit).toMatch(/^IT-\d{3}-\d:\d{4}-C\d{2}$/)
        expect(pack.noss.workActivity.length).toBeGreaterThan(0)
      })

      it('runs a predict-test-explain-repair arc, in that order', () => {
        const names = pack.phases.map((phase) => phase.name.toLowerCase())
        const index = (needle: string) => names.findIndex((name) => name.includes(needle))
        expect(index('predict')).toBeGreaterThan(-1)
        expect(index('predict')).toBeLessThan(index('test'))
        expect(index('test')).toBeLessThan(index('explain'))
        expect(index('explain')).toBeLessThan(index('repair'))
      })

      it('gives every phase an observable evidence line', () => {
        for (const phase of pack.phases) {
          expect(phase.evidence.trim().length, `${phase.name} has no evidence`).toBeGreaterThan(0)
          expect(phase.learner.trim().length).toBeGreaterThan(0)
        }
      })

      it('fits the stated duration', () => {
        const lastEnd = pack.phases[pack.phases.length - 1].time.split('–')[1]
        const [minutes] = lastEnd.split(':').map(Number)
        expect(minutes).toBeLessThanOrEqual(pack.durationMinutes)
      })

      it('gives each exit-ticket item cues a busy teacher can mark against', () => {
        for (const item of pack.exitTicket) {
          expect(item.lookFor.length).toBeGreaterThanOrEqual(2)
        }
      })

      it('differentiates in both directions', () => {
        expect(pack.differentiation.support.length).toBeGreaterThan(0)
        expect(pack.differentiation.extension.length).toBeGreaterThan(0)
      })

      it('keeps the competition video inside the 3-5 minute rule', () => {
        const end = pack.videoArc[pack.videoArc.length - 1].time.split('–')[1]
        const [m, s] = end.split(':').map(Number)
        const seconds = m * 60 + s
        expect(seconds).toBeGreaterThanOrEqual(180)
        expect(seconds).toBeLessThanOrEqual(300)
      })
    })
  }
})
