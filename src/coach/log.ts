/**
 * Stage 6 of the pipeline — Learn.
 *
 * One record per coach request, carrying everything the strategy's acceptance
 * criterion 6 asks for: misconception code, retrieved chunk ids, model and
 * version, response, latency and learner outcome. Two audiences read it:
 *
 *   • the teacher, as cohort evidence — which misconceptions actually occurred,
 *     how much scaffolding each learner needed, and whether the repair landed;
 *   • the RAG evaluation, as the record that a guard violation happened at all.
 *
 * Privacy first. A record carries a session code and an anonymous learner
 * label, never a name, an email or a device id, because the classroom trial is
 * designed to run without student accounts. Storage is the browser's own
 * localStorage, so nothing leaves the machine until a teacher exports it.
 */
import type { CorpusLanguage, HintLevel } from './corpus'
import type { GuardViolationCode } from './guard'
import type { MisconceptionCode, MisconceptionFamily } from './misconceptions'

/** Where the served text ultimately came from. */
export type HintSource = 'model' | 'corpus' | 'engine-only'

export type CoachOutcome =
  /** A model composed the hint and it passed the guard. */
  | 'served-model'
  /** Approved corpus text was served directly (AI off, unconfigured, or offline). */
  | 'served-corpus'
  /** A model answered but failed the guard, so the deterministic hint was substituted. */
  | 'fallback-guard'
  /** The model call failed or timed out, so the deterministic hint was substituted. */
  | 'fallback-error'
  /** The ladder refused: the student has not earned the next level yet. */
  | 'withheld'

export interface CoachLogRecord {
  /** ISO-8601, from an injectable clock so tests and exports are reproducible. */
  timestamp: string
  /** Privacy-safe class session code (see src/classroom/session.ts). */
  sessionId: string
  /** Anonymous per-device learner label within the session — never a name. */
  learnerLabel: string
  challengeId: string
  misconceptionCode: MisconceptionCode
  family: MisconceptionFamily
  language: CorpusLanguage
  /** The level the ladder authorised, and the level actually served. */
  requestedLevel: HintLevel | null
  servedLevel: HintLevel | null
  retrievedChunkIds: string[]
  citedChunkIds: string[]
  source: HintSource | null
  /** Model id and corpus version — the "which system produced this" pair. */
  model: string | null
  corpusVersion: string
  latencyMs: number
  guardViolations: GuardViolationCode[]
  outcome: CoachOutcome
  /** Attempt counters at the moment of the request. */
  attempts: number
  hintsServed: number
  /** Set later, when the student's next check lands — the learning outcome. */
  repairSucceeded?: boolean
}

const STORAGE_KEY = 'magiklayout.coach.log.v1'

/**
 * An append-only log for one browser. Persistence is best-effort: a private
 * window or a full quota must never break a lesson, so a failed write is
 * swallowed and the in-memory log carries on.
 */
export class CoachLog {
  private records: CoachLogRecord[] = []

  constructor(private readonly storage: Storage | null = safeStorage()) {
    this.records = this.read()
  }

  append(record: CoachLogRecord): void {
    this.records.push(record)
    this.write()
  }

  /**
   * Attach the outcome of the check that followed a hint. Called with the
   * challenge the student was working on, so a hint and its result stay paired
   * even when several challenges are open in one session.
   */
  recordOutcome(challengeId: string, repairSucceeded: boolean): void {
    for (let i = this.records.length - 1; i >= 0; i--) {
      const record = this.records[i]
      if (record.challengeId === challengeId && record.repairSucceeded === undefined) {
        record.repairSucceeded = repairSucceeded
        this.write()
        return
      }
    }
  }

  all(): readonly CoachLogRecord[] {
    return this.records
  }

  clear(): void {
    this.records = []
    this.write()
  }

  private read(): CoachLogRecord[] {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CoachLogRecord[]) : []
    } catch {
      return []
    }
  }

  private write(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.records))
    } catch {
      // Quota or private-mode failure: the lesson continues on the in-memory log.
    }
  }
}

const CSV_COLUMNS = [
  'timestamp',
  'sessionId',
  'learnerLabel',
  'challengeId',
  'misconceptionCode',
  'family',
  'language',
  'requestedLevel',
  'servedLevel',
  'source',
  'outcome',
  'attempts',
  'hintsServed',
  'latencyMs',
  'model',
  'corpusVersion',
  'retrievedChunkIds',
  'citedChunkIds',
  'guardViolations',
  'repairSucceeded',
] as const

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(' ') : value === undefined || value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Spreadsheet-ready evidence export — the format a teacher can actually open. */
export function toCsv(records: readonly CoachLogRecord[]): string {
  const rows = records.map((record) =>
    CSV_COLUMNS.map((column) => csvCell((record as unknown as Record<string, unknown>)[column])).join(','),
  )
  return [CSV_COLUMNS.join(','), ...rows].join('\n')
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
