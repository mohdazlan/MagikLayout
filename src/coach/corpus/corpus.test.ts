import { describe, expect, it } from 'vitest'
import { MISCONCEPTIONS, type MisconceptionCode } from '../misconceptions'
import { CORPUS, CORPUS_LANGUAGES, HINT_LEVELS, chunkById, validateCorpus } from './index'

/**
 * Identifiers that must survive translation verbatim. `add` is deliberately
 * absent: in English it is also an ordinary verb ("add what is missing"), whose
 * correct Malay translation is "tambah", so a bare-word check cannot tell the
 * Java method from the English verb. Reviewers cover that case by reading the
 * pair; this test covers what a machine can decide.
 */
const JAVA_TERMS = ['BorderLayout', 'FlowLayout', 'GridLayout', 'JPanel', 'setLayout', 'CENTER', 'NORTH', 'SOUTH', 'EAST', 'WEST']

describe('corpus integrity', () => {
  it('passes every release invariant', () => {
    expect(validateCorpus()).toEqual([])
  })

  it('resolves every chunk by its citation id', () => {
    for (const chunk of CORPUS) {
      expect(chunkById(chunk.chunkId)).toBe(chunk)
    }
  })

  it('reports an unknown citation id as missing', () => {
    expect(chunkById('ML-NOT-REAL:en-MY')).toBeUndefined()
  })

  it('detects a broken corpus rather than silently passing', () => {
    const broken = [{ ...CORPUS[0], text: '   ' }]
    expect(validateCorpus(broken).join(' ')).toContain('empty text')
  })
})

describe('coverage', () => {
  it('covers every misconception code at every hint level in both languages', () => {
    const codes = Object.keys(MISCONCEPTIONS) as MisconceptionCode[]
    const gaps: string[] = []
    for (const code of codes) {
      const family = MISCONCEPTIONS[code].family
      for (const level of HINT_LEVELS) {
        for (const language of CORPUS_LANGUAGES) {
          const hit = CORPUS.some(
            (c) =>
              c.language === language &&
              c.hintLevel === level &&
              (c.misconceptionCode === code || (c.misconceptionCode === null && c.family === family)),
          )
          if (!hit) gaps.push(`${code} L${level} ${language}`)
        }
      }
    }
    expect(gaps).toEqual([])
  })

  it('teaches the competition lesson with code-specific text, not just family fallback', () => {
    const specific = CORPUS.filter((c) => c.misconceptionCode === 'BL-SOUTH-COLLISION')
    expect(specific.length).toBe(HINT_LEVELS.length * CORPUS_LANGUAGES.length)
  })
})

describe('bilingual equivalence', () => {
  it('keeps Java terminology untranslated in the Bahasa Malaysia text', () => {
    const bySource = new Map(CORPUS.filter((c) => c.language === 'en-MY').map((c) => [c.sourceId, c]))
    const mismatches: string[] = []
    for (const ms of CORPUS.filter((c) => c.language === 'ms-MY')) {
      const en = bySource.get(ms.sourceId)!
      for (const term of JAVA_TERMS) {
        const inEn = new RegExp(`\\b${term}\\b`).test(en.text)
        const inMs = new RegExp(`\\b${term}\\b`).test(ms.text)
        if (inEn && !inMs) mismatches.push(`${ms.sourceId} drops "${term}"`)
      }
    }
    expect(mismatches).toEqual([])
  })

  it('gives both languages the same metadata', () => {
    const bySource = new Map(CORPUS.filter((c) => c.language === 'en-MY').map((c) => [c.sourceId, c]))
    for (const ms of CORPUS.filter((c) => c.language === 'ms-MY')) {
      const en = bySource.get(ms.sourceId)!
      expect({ ...ms, chunkId: '', language: 'en-MY', text: '' }).toEqual({ ...en, chunkId: '', language: 'en-MY', text: '' })
    }
  })
})

describe('hint ladder discipline', () => {
  it('never leaks Java code in a level 1, 2 or 3 chunk', () => {
    const leaks = CORPUS.filter((c) => c.hintLevel < 4).filter((c) => /new\s+\w+\s*\(|;\s*$|\w+\.add\(/.test(c.text))
    expect(leaks.map((c) => c.chunkId)).toEqual([])
  })

  it('keeps level 1 nudges short enough to read at a glance', () => {
    const tooLong = CORPUS.filter((c) => c.hintLevel === 1 && c.text.length > 260)
    expect(tooLong.map((c) => c.chunkId)).toEqual([])
  })
})
