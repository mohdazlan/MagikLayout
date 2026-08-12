/**
 * Stage 3 of the pipeline — Retrieve.
 *
 * Metadata-first retrieval, deliberately. The domain is narrow and the engine
 * already emits a precise misconception code, so the highest-precision key is
 * the code itself; embeddings would add operational cost and non-determinism
 * without adding recall we need. Keyword overlap only breaks ties.
 *
 * Retrieval is a hard filter plus an additive score:
 *
 *   HARD    language must match, and hint level must never exceed the level the
 *           policy authorised — retrieval can serve *less* than was asked for,
 *           never more. This is where premature answer leakage is prevented.
 *   SCORE   exact misconception code ≫ family fallback; exact level ≫ one level
 *           below; learner level and concept-keyword overlap break ties.
 *
 * Every hit keeps its chunk id, so the composed hint can cite its sources and
 * the guard can verify those citations against the corpus.
 */
import type { MisconceptionCode, MisconceptionFamily } from './misconceptions'
import { MISCONCEPTIONS } from './misconceptions'
import { CORPUS, type CorpusChunk, type CorpusLanguage, type HintLevel, type LearnerLevel } from './corpus'

export interface RetrievalQuery {
  code: MisconceptionCode
  language: CorpusLanguage
  /** The highest level the hint policy authorised for this request. */
  hintLevel: HintLevel
  learnerLevel?: LearnerLevel
  /** Engine findings — used only as tie-break keywords, never as retrieval truth. */
  evidence?: string[]
  /** Cap on returned hits. Small by design: a hint is composed from one or two passages. */
  limit?: number
}

export type MatchedOn = 'code' | 'family'

export interface RetrievalHit {
  chunk: CorpusChunk
  score: number
  matchedOn: MatchedOn
}

export type RetrievalConfidence = 'high' | 'medium' | 'low' | 'none'

export interface RetrievalResult {
  hits: RetrievalHit[]
  confidence: RetrievalConfidence
  /** The level actually served — may be below the level requested. */
  servedLevel: HintLevel | null
  /** Citation ids, in score order. Empty when nothing was retrieved. */
  chunkIds: string[]
  query: RetrievalQuery
}

const SCORE_CODE_MATCH = 100
const SCORE_FAMILY_MATCH = 50
const SCORE_LEVEL_EXACT = 30
const SCORE_LEVEL_ONE_BELOW = 8
const SCORE_LEARNER_LEVEL = 5
const SCORE_KEYWORD = 1

/** Words worth matching on: Swing identifiers and layout vocabulary, not English filler. */
const KEYWORD_RE = /\b(BorderLayout|FlowLayout|GridLayout|JPanel|JButton|JLabel|JTextField|setLayout|NORTH|SOUTH|EAST|WEST|CENTER|region|nested|order|resize|compile)\b/gi

function keywords(text: string): Set<string> {
  return new Set((text.match(KEYWORD_RE) ?? []).map((w) => w.toLowerCase()))
}

function scoreChunk(chunk: CorpusChunk, query: RetrievalQuery, family: MisconceptionFamily, queryWords: Set<string>): RetrievalHit | null {
  if (chunk.language !== query.language) return null
  if (chunk.hintLevel > query.hintLevel) return null // never escalate past the authorised level

  let score = 0
  let matchedOn: MatchedOn
  if (chunk.misconceptionCode === query.code) {
    score += SCORE_CODE_MATCH
    matchedOn = 'code'
  } else if (chunk.misconceptionCode === null && chunk.family === family) {
    score += SCORE_FAMILY_MATCH
    matchedOn = 'family'
  } else {
    return null
  }

  if (chunk.hintLevel === query.hintLevel) score += SCORE_LEVEL_EXACT
  else if (chunk.hintLevel === query.hintLevel - 1) score += SCORE_LEVEL_ONE_BELOW
  else return null // two or more levels below is stale scaffolding, not a hint

  if (!query.learnerLevel || chunk.learnerLevel === query.learnerLevel) score += SCORE_LEARNER_LEVEL

  if (queryWords.size > 0) {
    for (const word of keywords(chunk.text)) {
      if (queryWords.has(word)) score += SCORE_KEYWORD
    }
  }

  return { chunk, score, matchedOn }
}

/**
 * Run one retrieval. Pure and deterministic: the same query against the same
 * corpus version always returns the same chunk ids in the same order, which is
 * what makes the evaluation gate meaningful.
 */
export function retrieve(query: RetrievalQuery): RetrievalResult {
  const family = MISCONCEPTIONS[query.code].family
  const queryWords = keywords((query.evidence ?? []).join(' '))

  const hits = CORPUS.map((chunk) => scoreChunk(chunk, query, family, queryWords))
    .filter((hit): hit is RetrievalHit => hit !== null)
    .sort((a, b) => b.score - a.score || a.chunk.chunkId.localeCompare(b.chunk.chunkId))
    .slice(0, query.limit ?? 2)

  const top = hits[0]
  const confidence: RetrievalConfidence = !top
    ? 'none'
    : top.matchedOn === 'code' && top.chunk.hintLevel === query.hintLevel
      ? 'high'
      : top.chunk.hintLevel === query.hintLevel
        ? 'medium'
        : 'low'

  return {
    hits,
    confidence,
    servedLevel: top ? top.chunk.hintLevel : null,
    chunkIds: hits.map((h) => h.chunk.chunkId),
    query,
  }
}

/**
 * The whole authorised ladder for a code — levels 1..maxLevel. Used by the
 * teacher lesson-pack view and by the evaluation harness, never to serve a
 * student more than one level at a time.
 */
export function retrieveLadder(
  code: MisconceptionCode,
  language: CorpusLanguage,
  maxLevel: HintLevel,
): RetrievalResult[] {
  const levels: HintLevel[] = [1, 2, 3, 4]
  return levels.filter((l) => l <= maxLevel).map((hintLevel) => retrieve({ code, language, hintLevel, limit: 1 }))
}
