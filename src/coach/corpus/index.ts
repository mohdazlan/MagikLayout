/**
 * The retrievable corpus: every authored entry expanded into one chunk per
 * language, carrying the full metadata schema from the product strategy.
 *
 *   source_id · misconception_code · concept · learner_level · language ·
 *   hint_level · curriculum_tag · version / reviewer
 *
 * Two properties matter downstream:
 *
 *  • Every chunk has a citation id (`chunkId`), so a hint can always be traced
 *    back to an approved passage, and the guard can reject a hint whose cited
 *    id is not in the corpus.
 *  • The corpus is a versioned, in-repo artefact — no network call, no vector
 *    database. The domain is narrow and the engine emits precise codes, so
 *    metadata-first retrieval is the right tool; infrastructure can follow
 *    content volume, not fashion.
 */
import { MISCONCEPTIONS, type MisconceptionCode, type MisconceptionFamily } from '../misconceptions'
import { CORPUS_ENTRIES, type CorpusEntry, type HintLevel } from './entries'

export type { HintLevel } from './entries'

/** BCP-47 tags, matching the strategy's chunk metadata table. */
export type CorpusLanguage = 'en-MY' | 'ms-MY'

/** The audience this corpus is written for. Reserved for future differentiation. */
export type LearnerLevel = 'secondary-vocational-novice'

export const HINT_LEVELS: HintLevel[] = [1, 2, 3, 4]
export const CORPUS_LANGUAGES: CorpusLanguage[] = ['en-MY', 'ms-MY']

export interface CorpusChunk {
  /** Globally unique citation id: `<sourceId>:<language>`. */
  chunkId: string
  sourceId: string
  /** Null when the chunk teaches a whole family rather than one code. */
  misconceptionCode: MisconceptionCode | null
  family: MisconceptionFamily
  concept: string
  learnerLevel: LearnerLevel
  language: CorpusLanguage
  hintLevel: HintLevel
  curriculumTag: string
  version: string
  reviewer: string
  /** Authoritative reference the rule was derived from, where one applies. */
  derivedFrom?: string
  text: string
}

const LEARNER_LEVEL: LearnerLevel = 'secondary-vocational-novice'

/** Family-level chunks describe a family; their concept label comes from the family itself. */
const FAMILY_CONCEPT: Record<MisconceptionFamily, string> = {
  'BL-REGION': 'BorderLayout region occupancy',
  RESIZE: 'Layout behaviour on resize',
  NESTING: 'Nested containers',
  ORDER: 'Add order as position',
  SETTINGS: 'Layout manager settings',
  LIFECYCLE: 'GUI construction order',
  COMPOSITION: 'Component inventory',
  NONE: 'General layout comparison',
}

const CURRICULUM_TAG = 'IT-010-3:2016-C01'

function expand(entry: CorpusEntry, language: CorpusLanguage, text: string): CorpusChunk {
  // A code-scoped entry inherits its family, concept and curriculum tag from the
  // taxonomy, so the two can never drift apart.
  const scope =
    entry.scope.kind === 'code'
      ? {
          misconceptionCode: entry.scope.code,
          ...MISCONCEPTIONS[entry.scope.code],
        }
      : {
          misconceptionCode: null,
          family: entry.scope.family,
          concept: FAMILY_CONCEPT[entry.scope.family],
          curriculumTag: CURRICULUM_TAG,
        }

  return {
    chunkId: `${entry.sourceId}:${language}`,
    sourceId: entry.sourceId,
    misconceptionCode: scope.misconceptionCode,
    family: scope.family,
    concept: scope.concept,
    learnerLevel: LEARNER_LEVEL,
    language,
    hintLevel: entry.hintLevel,
    curriculumTag: scope.curriculumTag,
    version: entry.version,
    reviewer: entry.reviewer,
    ...(entry.derivedFrom ? { derivedFrom: entry.derivedFrom } : {}),
    text,
  }
}

/** The whole governed corpus, both languages. */
export const CORPUS: CorpusChunk[] = CORPUS_ENTRIES.flatMap((entry) => [
  expand(entry, 'en-MY', entry.en),
  expand(entry, 'ms-MY', entry.ms),
])

const BY_ID = new Map(CORPUS.map((chunk) => [chunk.chunkId, chunk]))

/** Look up a chunk by citation id — the guard's check that a citation is real. */
export function chunkById(chunkId: string): CorpusChunk | undefined {
  return BY_ID.get(chunkId)
}

export function corpusVersion(): string {
  const versions = [...new Set(CORPUS.map((c) => c.version))].sort()
  return versions.join('+')
}

/**
 * Corpus-level invariants, run by the unit tests and by the evaluation gate.
 * Returns human-readable problems; an empty array means the corpus is releasable.
 */
export function validateCorpus(chunks: CorpusChunk[] = CORPUS): string[] {
  const problems: string[] = []

  const seen = new Set<string>()
  for (const chunk of chunks) {
    if (seen.has(chunk.chunkId)) problems.push(`duplicate chunkId ${chunk.chunkId}`)
    seen.add(chunk.chunkId)
    if (chunk.text.trim().length === 0) problems.push(`${chunk.chunkId} has empty text`)
    if (!chunk.reviewer) problems.push(`${chunk.chunkId} has no reviewer`)
    if (!/^v\d+\.\d+$/.test(chunk.version)) problems.push(`${chunk.chunkId} has a malformed version "${chunk.version}"`)
  }

  // Every entry must exist in both languages — bilingual parity is a release gate,
  // not a nice-to-have (MVP RAG acceptance criterion 4).
  const bySource = new Map<string, Set<CorpusLanguage>>()
  for (const chunk of chunks) {
    const set = bySource.get(chunk.sourceId) ?? new Set<CorpusLanguage>()
    set.add(chunk.language)
    bySource.set(chunk.sourceId, set)
  }
  for (const [sourceId, langs] of bySource) {
    for (const lang of CORPUS_LANGUAGES) {
      if (!langs.has(lang)) problems.push(`${sourceId} is missing a ${lang} translation`)
    }
  }

  return problems
}
