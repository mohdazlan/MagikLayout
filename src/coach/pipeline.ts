/**
 * The coach pipeline, end to end:
 *
 *   Observe → Diagnose → Retrieve → Compose → Guard → Log
 *
 * The caller supplies the first two stages (a `Diagnosis` produced from the
 * engine's own verdict) and, optionally, a `compose` function that reaches a
 * language model. Everything else happens here.
 *
 * The architectural rule from the strategy holds at every branch: **the
 * deterministic engine is the authority for correctness, retrieval selects the
 * knowledge, and the model only explains.** Concretely —
 *
 *   • Retrieval runs BEFORE any model call, and the model is given nothing but
 *     the retrieved passages and the engine's findings. It cannot ground a hint
 *     in something the corpus does not contain.
 *   • If the model is absent, fails, or produces anything the guard rejects,
 *     the approved corpus text is served instead. The student sees a hint
 *     either way; only the telemetry records which path ran.
 *   • Low retrieval confidence never reaches a model at all.
 *
 * That makes the model an optional accelerant, not a dependency — which is what
 * lets a teacher switch AI off, and what makes a network failure during judging
 * a non-event.
 */
import { corpusVersion, type CorpusLanguage, type HintLevel } from './corpus'
import { guardHint, type GuardViolationCode } from './guard'
import { authorizeHintLevel, deterministicHint, type LadderState } from './hintPolicy'
import type { CoachLogRecord, CoachOutcome, HintSource } from './log'
import type { Diagnosis } from './misconceptions'
import { retrieve, type RetrievalResult } from './retrieve'

/** What a composer is allowed to see. Note the absence of any target or answer key. */
export interface ComposeInput {
  /** Engine findings, verbatim. */
  evidence: string[]
  misconceptionCode: string
  language: CorpusLanguage
  hintLevel: HintLevel
  /** The approved passages, with their citation ids. Nothing else may ground the hint. */
  passages: { chunkId: string; text: string }[]
  challengeTitle: string
}

export interface ComposeOutput {
  text: string
  /** Citation ids the composer used. The guard verifies these against `passages`. */
  citedChunkIds: string[]
  /** Model identifier, for the log. */
  model?: string
}

export type Composer = (input: ComposeInput, signal?: AbortSignal) => Promise<ComposeOutput>

export interface CoachRunRequest {
  diagnosis: Diagnosis
  language: CorpusLanguage
  ladder: LadderState
  challengeId: string
  challengeTitle: string
  sessionId: string
  learnerLabel: string
  /** Absent = deterministic mode (AI off, or no backend configured). */
  compose?: Composer
  /** Injected for reproducible tests and exports. */
  now?: () => number
  signal?: AbortSignal
}

export interface ServedHint {
  text: string
  level: HintLevel
  chunkIds: string[]
  source: HintSource
}

export type CoachRunResult =
  | { status: 'served'; hint: ServedHint; log: CoachLogRecord }
  | { status: 'withheld'; reason: string; log: CoachLogRecord }

/** Below this, the model is skipped entirely and approved text is served as written. */
const MODEL_MIN_CONFIDENCE: RetrievalResult['confidence'][] = ['high', 'medium']

export async function runCoach(request: CoachRunRequest): Promise<CoachRunResult> {
  const now = request.now ?? (() => Date.now())
  const startedAt = now()
  const base = {
    timestamp: new Date(startedAt).toISOString(),
    sessionId: request.sessionId,
    learnerLabel: request.learnerLabel,
    challengeId: request.challengeId,
    misconceptionCode: request.diagnosis.code,
    family: request.diagnosis.family,
    language: request.language,
    corpusVersion: corpusVersion(),
    attempts: request.ladder.attempts,
    hintsServed: request.ladder.hintsServed,
  }

  // ── Ladder ─────────────────────────────────────────────────────────────
  const decision = authorizeHintLevel(request.ladder)
  if (!decision.granted) {
    return {
      status: 'withheld',
      reason: decision.reason,
      log: {
        ...base,
        requestedLevel: null,
        servedLevel: null,
        retrievedChunkIds: [],
        citedChunkIds: [],
        source: null,
        model: null,
        latencyMs: now() - startedAt,
        guardViolations: [],
        outcome: 'withheld',
      },
    }
  }
  const level = decision.level

  // ── Retrieve ───────────────────────────────────────────────────────────
  const retrieval = retrieve({
    code: request.diagnosis.code,
    language: request.language,
    hintLevel: level,
    evidence: request.diagnosis.evidence,
    limit: 2,
  })
  const fallback = deterministicHint(request.diagnosis, request.language, level, retrieval)

  const serve = (hint: ServedHint, outcome: CoachOutcome, extra: { model?: string | null; guardViolations?: GuardViolationCode[] } = {}): CoachRunResult => ({
    status: 'served',
    hint,
    log: {
      ...base,
      requestedLevel: level,
      servedLevel: hint.level,
      retrievedChunkIds: retrieval.chunkIds,
      citedChunkIds: hint.chunkIds,
      source: hint.source,
      model: extra.model ?? null,
      latencyMs: now() - startedAt,
      guardViolations: extra.guardViolations ?? [],
      outcome,
    },
  })

  const deterministic = (outcome: CoachOutcome, extra?: { model?: string | null; guardViolations?: GuardViolationCode[] }) =>
    serve({ text: fallback.text, level: fallback.level, chunkIds: fallback.chunkIds, source: fallback.source }, outcome, extra)

  // ── Compose ────────────────────────────────────────────────────────────
  // No composer, or retrieval too weak to ground one: serve approved text.
  if (!request.compose || !MODEL_MIN_CONFIDENCE.includes(retrieval.confidence)) {
    return deterministic('served-corpus')
  }

  let composed: ComposeOutput
  try {
    composed = await request.compose(
      {
        evidence: request.diagnosis.evidence,
        misconceptionCode: request.diagnosis.code,
        language: request.language,
        hintLevel: level,
        passages: retrieval.hits.map((hit) => ({ chunkId: hit.chunk.chunkId, text: hit.chunk.text })),
        challengeTitle: request.challengeTitle,
      },
      request.signal,
    )
  } catch {
    return deterministic('fallback-error')
  }

  // ── Guard ──────────────────────────────────────────────────────────────
  const verdict = guardHint({
    text: composed.text,
    citedChunkIds: composed.citedChunkIds,
    retrievedChunkIds: retrieval.chunkIds,
    language: request.language,
    level,
    diagnosis: request.diagnosis,
  })
  if (!verdict.ok) {
    return deterministic('fallback-guard', {
      model: composed.model ?? null,
      guardViolations: verdict.violations.map((v) => v.code),
    })
  }

  return serve(
    { text: composed.text.trim(), level, chunkIds: composed.citedChunkIds, source: 'model' },
    'served-model',
    { model: composed.model ?? null },
  )
}
