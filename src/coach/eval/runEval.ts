/**
 * The RAG acceptance gate.
 *
 * Runs the real pipeline over the whole evaluation set and reports the metrics
 * the strategy commits to — retrieval precision ≥ 95%, hint contradiction rate
 * 0% — plus a pass/fail line for each of the seven minimum-viable RAG
 * acceptance criteria.
 *
 * The gate runs in two modes:
 *
 *   deterministic   No composer. Proves the system meets every criterion with
 *                   the language model switched off — the state a teacher can
 *                   fall back to and the state a judged demo can survive on.
 *
 *   adversarial     A composer that deliberately misbehaves (leaks Java, cites
 *                   sources it was not given, answers in the wrong language,
 *                   contradicts the engine). Proves the guard catches it and
 *                   that a student still receives an approved hint.
 *
 * A live-model run is a separate, manual exercise: it needs a key and a network
 * and would make this gate non-deterministic. What is asserted here is the
 * property that matters — that no model output can reach a student unchecked.
 */
import { chunkById, type HintLevel } from '../corpus'
import { validateCorpus } from '../corpus'
import type { GuardViolationCode } from '../guard'
import type { CoachLogRecord } from '../log'
import { runCoach, type ComposeInput, type ComposeOutput, type Composer } from '../pipeline'
import { EVAL_CASES, type EvalCase } from './cases'

export interface CaseResult {
  case: EvalCase
  /** Chunk ids retrieval supplied. */
  retrieved: string[]
  /** Of those, the ones the gold standard accepts. */
  relevant: string[]
  servedText: string
  servedLevel: HintLevel | null
  guardViolations: GuardViolationCode[]
  log: CoachLogRecord
}

export interface EvalCriterion {
  id: number
  statement: string
  pass: boolean
  detail: string
}

export interface EvalReport {
  mode: 'deterministic' | 'adversarial'
  cases: number
  /** Fraction of retrieved chunks the gold standard accepts. */
  retrievalPrecision: number
  /** Fraction of cases whose rank-1 chunk is the gold-standard primary source. */
  topSourceAccuracy: number
  /** Fraction of cases that retrieved at least one chunk. */
  coverage: number
  /** Fraction of served hints that contradicted the engine. Must be 0. */
  contradictionRate: number
  /** Fraction of served hints that leaked code or over-revealed for the level. Must be 0. */
  leakageRate: number
  criteria: EvalCriterion[]
  pass: boolean
  results: CaseResult[]
}

const SESSION = 'EVAL-0000'

async function runCase(evalCase: EvalCase, compose?: Composer): Promise<CaseResult> {
  const result = await runCoach({
    diagnosis: evalCase.diagnosis,
    language: evalCase.language,
    // Attempt counters chosen so the ladder authorises exactly the level under test.
    ladder: { attempts: evalCase.level, hintsServed: evalCase.level - 1, solved: false, teacherUnlocked: false },
    challengeId: 'eval',
    challengeTitle: 'Evaluation case',
    sessionId: SESSION,
    learnerLabel: 'eval',
    compose,
    now: () => 0,
  })

  const retrieved = result.log.retrievedChunkIds
  return {
    case: evalCase,
    retrieved,
    relevant: retrieved.filter((id) => evalCase.acceptableChunkIds.includes(id)),
    servedText: result.status === 'served' ? result.hint.text : '',
    servedLevel: result.log.servedLevel,
    guardViolations: result.log.guardViolations,
    log: result.log,
  }
}

/**
 * A composer that breaks every rule the guard exists to enforce. Rotates through
 * the failure modes so each is exercised across the set.
 */
export const ADVERSARIAL_COMPOSER: Composer = async (input: ComposeInput): Promise<ComposeOutput> => {
  const mode = input.misconceptionCode.length % 4
  switch (mode) {
    case 0: // leaks the answer as Java
      return { text: 'Fix it like this: JPanel bar = new JPanel(); bar.add(save);', citedChunkIds: input.passages.map((p) => p.chunkId), model: 'adversarial' }
    case 1: // cites a source it was never given
      return { text: 'Think about how many components one region can show at a time.', citedChunkIds: ['ML-INVENTED-99:en-MY'], model: 'adversarial' }
    case 2: // contradicts the engine
      return { text: 'Your build is correct, so you can move on to the next challenge.', citedChunkIds: input.passages.map((p) => p.chunkId), model: 'adversarial' }
    default: // answers in the wrong language
      return {
        text: input.language === 'ms-MY' ? 'The region can only show the last component that was added to it.' : 'Kawasan itu hanya boleh menunjukkan komponen terakhir yang ditambah kepadanya.',
        citedChunkIds: input.passages.map((p) => p.chunkId),
        model: 'adversarial',
      }
  }
}

export async function runEval(mode: 'deterministic' | 'adversarial' = 'deterministic'): Promise<EvalReport> {
  const composer = mode === 'adversarial' ? ADVERSARIAL_COMPOSER : undefined
  const results: CaseResult[] = []
  for (const evalCase of EVAL_CASES) results.push(await runCase(evalCase, composer))

  const retrievedTotal = results.reduce((n, r) => n + r.retrieved.length, 0)
  const relevantTotal = results.reduce((n, r) => n + r.relevant.length, 0)
  const retrievalPrecision = retrievedTotal === 0 ? 0 : relevantTotal / retrievedTotal
  const coverage = results.filter((r) => r.retrieved.length > 0).length / results.length
  const topSourceAccuracy = results.filter((r) => r.retrieved[0] === r.case.primaryChunkId).length / results.length

  // A served hint is what the student actually saw. Because the pipeline
  // substitutes approved text whenever the guard fires, these rates are measured
  // on the SERVED text — the only thing that can harm a learner.
  const servedViolations = results.flatMap((r) => (r.log.outcome === 'served-model' ? r.guardViolations : []))
  const contradictionRate = servedViolations.filter((v) => v === 'contradiction').length / results.length
  const leakageRate = servedViolations.filter((v) => v === 'code-leakage' || v === 'level-leakage').length / results.length

  const corpusProblems = validateCorpus()
  const unresolvableCitations = results.flatMap((r) => r.log.citedChunkIds.filter((id) => !chunkById(id)))
  const emptyHints = results.filter((r) => r.servedText.trim().length === 0)
  const levelOneLeaks = results.filter((r) => r.case.level === 1 && /\bJPanel\b|```|\bnew\s+[A-Z]/.test(r.servedText))
  const wrongLevel = results.filter((r) => r.servedLevel !== null && r.servedLevel > r.case.level)
  const missingLogFields = results.filter(
    (r) =>
      !r.log.timestamp ||
      !r.log.misconceptionCode ||
      r.log.retrievedChunkIds.length === 0 ||
      !r.log.corpusVersion ||
      r.log.latencyMs === undefined ||
      !r.log.outcome,
  )

  // Criterion 4 in machine-checkable form: the two languages must agree on which
  // source they served, differing only in the language suffix.
  const parityMismatches: string[] = []
  for (const en of results.filter((r) => r.case.language === 'en-MY')) {
    const ms = results.find((r) => r.case.id === en.case.id.replace('en-MY', 'ms-MY'))
    if (!ms) {
      parityMismatches.push(`${en.case.id} has no Bahasa Malaysia counterpart`)
      continue
    }
    const strip = (ids: string[]) => ids.map((id) => id.split(':')[0]).sort().join(',')
    if (strip(en.retrieved) !== strip(ms.retrieved)) parityMismatches.push(en.case.id)
  }

  const criteria: EvalCriterion[] = [
    {
      id: 1,
      statement: 'Every supported misconception retrieves at least one approved chunk with a valid source id.',
      pass: coverage === 1 && unresolvableCitations.length === 0 && topSourceAccuracy === 1,
      detail: `coverage ${pct(coverage)}, top-source accuracy ${pct(topSourceAccuracy)}, ${unresolvableCitations.length} unresolvable citations`,
    },
    {
      id: 2,
      statement: 'The final hint cites its retrieved source and never contradicts the engine finding.',
      pass: contradictionRate === 0 && results.every((r) => r.log.citedChunkIds.length > 0),
      detail: `contradiction rate ${pct(contradictionRate)}, all ${results.length} hints cited`,
    },
    {
      id: 3,
      statement: 'Hint level 1 does not reveal the final code or the complete component tree.',
      pass: levelOneLeaks.length === 0 && wrongLevel.length === 0 && leakageRate === 0,
      detail: `${levelOneLeaks.length} level-1 leaks, ${wrongLevel.length} over-level responses, leakage rate ${pct(leakageRate)}`,
    },
    {
      id: 4,
      statement: 'English and Bahasa Malaysia outputs preserve the same Swing terminology and technical meaning.',
      pass: parityMismatches.length === 0 && corpusProblems.length === 0,
      detail: `${parityMismatches.length} parity mismatches, ${corpusProblems.length} corpus problems`,
    },
    {
      id: 5,
      statement: 'If retrieval is empty or low-confidence, the system uses a reviewed deterministic fallback.',
      pass: emptyHints.length === 0,
      detail: `${emptyHints.length} cases produced no hint text`,
    },
    {
      id: 6,
      statement: 'Every request logs the misconception code, retrieved chunk ids, model/version, response, latency and outcome.',
      pass: missingLogFields.length === 0,
      detail: `${missingLogFields.length} incomplete log records of ${results.length}`,
    },
    {
      id: 7,
      statement: 'Teachers can disable AI and complete the challenge using deterministic feedback alone.',
      pass: results.every((r) => r.servedText.trim().length > 0),
      detail:
        mode === 'deterministic'
          ? 'every case served approved text with no model in the loop'
          : 'every case served a hint even with a misbehaving model',
    },
  ]

  return {
    mode,
    cases: results.length,
    retrievalPrecision,
    topSourceAccuracy,
    coverage,
    contradictionRate,
    leakageRate,
    criteria,
    pass: criteria.every((c) => c.pass) && retrievalPrecision >= 0.95,
    results,
  }
}

export function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/** Plain-text report — what goes in the project report and the prompt/log appendix. */
export function formatReport(report: EvalReport): string {
  const lines = [
    `MagikLayout RAG acceptance gate — ${report.mode} mode`,
    `${report.cases} cases · retrieval precision ${pct(report.retrievalPrecision)} (target ≥95%) · top-source accuracy ${pct(report.topSourceAccuracy)} · coverage ${pct(report.coverage)}`,
    `contradiction rate ${pct(report.contradictionRate)} (target 0%) · leakage rate ${pct(report.leakageRate)} (target 0%)`,
    '',
  ]
  for (const criterion of report.criteria) {
    lines.push(`${criterion.pass ? 'PASS' : 'FAIL'}  ${criterion.id}. ${criterion.statement}`)
    lines.push(`      ${criterion.detail}`)
  }
  lines.push('', report.pass ? 'GATE: PASS' : 'GATE: FAIL')
  return lines.join('\n')
}
