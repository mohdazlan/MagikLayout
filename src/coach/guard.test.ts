import { describe, expect, it } from 'vitest'
import { CORPUS, chunkById } from './corpus'
import { guardHint, type GuardInput, type GuardViolationCode } from './guard'
import type { Diagnosis } from './misconceptions'
import { retrieve } from './retrieve'

const southCollision: Diagnosis = {
  code: 'BL-SOUTH-COLLISION',
  family: 'BL-REGION',
  confidence: 'high',
  region: 'SOUTH',
  evidence: ['2 components are added directly to BorderLayout.SOUTH of the frame.'],
}

function input(over: Partial<GuardInput> = {}): GuardInput {
  return {
    text: 'BorderLayout keeps one slot per region, so the second component you sent to SOUTH replaced the first.',
    citedChunkIds: ['ML-BLS-L2:en-MY'],
    retrievedChunkIds: ['ML-BLS-L2:en-MY'],
    language: 'en-MY',
    level: 2,
    diagnosis: southCollision,
    ...over,
  }
}

function codes(result: ReturnType<typeof guardHint>): GuardViolationCode[] {
  return result.ok ? [] : result.violations.map((v) => v.code)
}

describe('guardHint', () => {
  it('passes a grounded, cited, in-language hint', () => {
    expect(guardHint(input())).toEqual({ ok: true })
  })

  it('rejects an empty hint', () => {
    expect(codes(guardHint(input({ text: '   ' })))).toEqual(['empty'])
  })
})

describe('citations', () => {
  it('rejects a citation that is not in the corpus', () => {
    expect(codes(guardHint(input({ citedChunkIds: ['ML-INVENTED-01:en-MY'] })))).toContain('unknown-citation')
  })

  it('rejects a real citation that was not retrieved for this request', () => {
    expect(codes(guardHint(input({ citedChunkIds: ['ML-GRO-L2:en-MY'] })))).toContain('citation-not-retrieved')
  })

  it('rejects a hint that cites nothing when sources were supplied', () => {
    expect(codes(guardHint(input({ citedChunkIds: [] })))).toContain('uncited')
  })

  it('allows an uncited hint when retrieval supplied nothing (engine-only fallback)', () => {
    expect(guardHint(input({ citedChunkIds: [], retrievedChunkIds: [] }))).toEqual({ ok: true })
  })
})

describe('answer leakage', () => {
  it('blocks a constructor call', () => {
    expect(codes(guardHint(input({ text: 'Try wrapping them: new JPanel() will hold both buttons for you.' })))).toContain('code-leakage')
  })

  it('blocks a method call on a variable', () => {
    expect(codes(guardHint(input({ text: 'You should call panel.add(save) before adding the panel to SOUTH.' })))).toContain('code-leakage')
  })

  it('blocks a fenced code block', () => {
    expect(codes(guardHint(input({ text: 'Here is the fix:\n```java\nframe.add(bar, BorderLayout.SOUTH);\n```' })))).toContain('code-leakage')
  })

  it('blocks the repair mechanism at level 1', () => {
    expect(codes(guardHint(input({ level: 1, text: 'Put both buttons inside a JPanel first.' })))).toContain('level-leakage')
  })

  it('allows naming the repair mechanism at level 3', () => {
    expect(guardHint(input({ level: 3, citedChunkIds: ['ML-BLS-L3:en-MY'], retrievedChunkIds: ['ML-BLS-L3:en-MY'], text: 'A JPanel is a component and a container at once — that is what makes grouping possible in one SOUTH slot.' }))).toEqual({ ok: true })
  })
})

describe('language', () => {
  it('rejects an English hint when Bahasa Malaysia was requested', () => {
    expect(codes(guardHint(input({ language: 'ms-MY', citedChunkIds: ['ML-BLS-L2:ms-MY'], retrievedChunkIds: ['ML-BLS-L2:ms-MY'] })))).toContain('wrong-language')
  })

  it('accepts a Bahasa Malaysia hint when Bahasa Malaysia was requested', () => {
    const ms = chunkById('ML-BLS-L2:ms-MY')!
    expect(guardHint(input({ language: 'ms-MY', text: ms.text, citedChunkIds: [ms.chunkId], retrievedChunkIds: [ms.chunkId] }))).toEqual({ ok: true })
  })
})

describe('length', () => {
  it('rejects a level 2 hint that runs past the limit', () => {
    expect(codes(guardHint(input({ text: `${'BorderLayout region rules. '.repeat(40)}` })))).toContain('too-long')
  })

  it('gives the worked explanation more room', () => {
    const long = `The repair works because SOUTH now holds one component. ${'It is a container with its own manager. '.repeat(8)}`
    expect(codes(guardHint(input({ level: 4, text: long, citedChunkIds: ['ML-BLS-L4:en-MY'], retrievedChunkIds: ['ML-BLS-L4:en-MY'] })))).not.toContain('too-long')
  })
})

describe('contradiction with the engine', () => {
  it('rejects a hint that tells the student their build is correct', () => {
    expect(codes(guardHint(input({ text: 'Your build is correct — the SOUTH region is fine as it stands.' })))).toContain('contradiction')
  })

  it('rejects an invented compile error', () => {
    expect(codes(guardHint(input({ text: 'That second line does not compile, so SOUTH never receives the button.' })))).toContain('contradiction')
  })

  it('rejects a hint that points at a different region than the finding', () => {
    expect(codes(guardHint(input({ text: 'Look at what you added to the NORTH region of the frame.' })))).toContain('contradiction')
  })

  it('rejects a whole-attempt "all correct" verdict in Bahasa Malaysia', () => {
    const ms = 'Semuanya betul. Anda hanya perlu melihat kawasan SOUTH itu sekali lagi.'
    expect(codes(guardHint(input({ language: 'ms-MY', text: ms, citedChunkIds: ['ML-BLS-L2:ms-MY'], retrievedChunkIds: ['ML-BLS-L2:ms-MY'] })))).toContain('contradiction')
  })

  it('allows praise scoped to a part of the attempt', () => {
    const ms = 'Komponen anda semuanya betul dan semuanya ada, tetapi lihat kawasan SOUTH itu sekali lagi.'
    expect(codes(guardHint(input({ language: 'ms-MY', text: ms, citedChunkIds: ['ML-BLS-L2:ms-MY'], retrievedChunkIds: ['ML-BLS-L2:ms-MY'] })))).not.toContain('contradiction')
  })

  it('allows a hint that names the finding region alongside others', () => {
    expect(guardHint(input({ text: 'BorderLayout serves NORTH, SOUTH, EAST and WEST before CENTER, and SOUTH is a single slot.' }))).toEqual({ ok: true })
  })
})

describe('the corpus itself passes the guard', () => {
  it('clears every approved chunk at its own level and language', () => {
    const failures: string[] = []
    for (const chunk of CORPUS) {
      const code = chunk.misconceptionCode ?? 'UNKNOWN'
      const verdict = guardHint({
        text: chunk.text,
        citedChunkIds: [chunk.chunkId],
        retrievedChunkIds: [chunk.chunkId],
        language: chunk.language,
        level: chunk.hintLevel,
        diagnosis: { code, family: chunk.family, confidence: 'high', evidence: [] },
      })
      if (!verdict.ok) failures.push(`${chunk.chunkId}: ${verdict.violations.map((v) => v.code).join(', ')}`)
    }
    expect(failures).toEqual([])
  })

  it('clears what retrieval actually serves for the competition lesson', () => {
    for (const language of ['en-MY', 'ms-MY'] as const) {
      for (const level of [1, 2, 3] as const) {
        const result = retrieve({ code: 'BL-SOUTH-COLLISION', language, hintLevel: level, limit: 1 })
        const verdict = guardHint({
          text: result.hits[0].chunk.text,
          citedChunkIds: result.chunkIds,
          retrievedChunkIds: result.chunkIds,
          language,
          level,
          diagnosis: southCollision,
        })
        expect(verdict).toEqual({ ok: true })
      }
    }
  })
})
