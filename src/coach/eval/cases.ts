/**
 * The retrieval/hint evaluation set.
 *
 * `ACCEPTABLE_SOURCES` is a **gold standard written by hand**, not derived from
 * the retrieval code. It records which approved sources a reviewing teacher
 * accepts as relevant for each misconception at each rung of the ladder. That
 * independence is the whole point: if someone changes the scoring weights in
 * retrieve.ts and the wrong passage starts winning, this table is what notices.
 *
 * Codes with their own authored ladder cite their own sources. Codes taught by
 * their family cite the family's — which is a deliberate judgement, not a
 * shortcut: a teacher reviewing BL-EAST-COLLISION agreed that the BL-REGION
 * content teaches it correctly, and if that ever stops being true the fix is to
 * author code-specific text and update this row.
 */
import type { CorpusLanguage, HintLevel } from '../corpus'
import { MISCONCEPTIONS, type Diagnosis, type MisconceptionCode } from '../misconceptions'

/** Source ids (language-independent) accepted at levels 1, 2 and 3 respectively. */
export const ACCEPTABLE_SOURCES: Record<MisconceptionCode, [string, string, string]> = {
  'BL-SOUTH-COLLISION': ['ML-BLS-L1', 'ML-BLS-L2', 'ML-BLS-L3'],
  'BL-NORTH-COLLISION': ['ML-FAM-BLREGION-L1', 'ML-FAM-BLREGION-L2', 'ML-FAM-BLREGION-L3'],
  'BL-EAST-COLLISION': ['ML-FAM-BLREGION-L1', 'ML-FAM-BLREGION-L2', 'ML-FAM-BLREGION-L3'],
  'BL-WEST-COLLISION': ['ML-FAM-BLREGION-L1', 'ML-FAM-BLREGION-L2', 'ML-FAM-BLREGION-L3'],
  'BL-CENTER-COLLISION': ['ML-FAM-BLREGION-L1', 'ML-FAM-BLREGION-L2', 'ML-FAM-BLREGION-L3'],
  'BL-REGION-WRONG': ['ML-FAM-BLREGION-L1', 'ML-FAM-BLREGION-L2', 'ML-FAM-BLREGION-L3'],
  'BL-CENTER-EXPANSION': ['ML-BCE-L1', 'ML-BCE-L2', 'ML-BCE-L3'],
  'BL-EDGE-SIZING': ['ML-FAM-RESIZE-L1', 'ML-FAM-RESIZE-L2', 'ML-FAM-RESIZE-L3'],
  'FLOW-REWRAP': ['ML-FAM-RESIZE-L1', 'ML-FAM-RESIZE-L2', 'ML-FAM-RESIZE-L3'],
  'GRID-UNIFORM-CELLS': ['ML-FAM-RESIZE-L1', 'ML-FAM-RESIZE-L2', 'ML-FAM-RESIZE-L3'],
  'NESTED-PANEL-MISSING': ['ML-NPM-L1', 'ML-NPM-L2', 'ML-NPM-L3'],
  'NESTED-PANEL-EXTRA': ['ML-FAM-NESTING-L1', 'ML-FAM-NESTING-L2', 'ML-FAM-NESTING-L3'],
  'NESTED-PANEL-WRONG-MANAGER': ['ML-FAM-NESTING-L1', 'ML-FAM-NESTING-L2', 'ML-FAM-NESTING-L3'],
  'FLOW-ORDER': ['ML-FLO-L1', 'ML-FLO-L2', 'ML-FLO-L3'],
  'GRID-ORDER': ['ML-GRO-L1', 'ML-GRO-L2', 'ML-GRO-L3'],
  'GRID-DIMENSION': ['ML-FAM-SETTINGS-L1', 'ML-FAM-SETTINGS-L2', 'ML-FAM-SETTINGS-L3'],
  'FLOW-ALIGN-GAP': ['ML-FAM-SETTINGS-L1', 'ML-FAM-SETTINGS-L2', 'ML-FAM-SETTINGS-L3'],
  'SETLAYOUT-AFTER-ADD': ['ML-SLA-L1', 'ML-SLA-L2', 'ML-SLA-L3'],
  'STATEMENT-ORDER': ['ML-FAM-LIFECYCLE-L1', 'ML-FAM-LIFECYCLE-L2', 'ML-FAM-LIFECYCLE-L3'],
  'COMPILE-ERROR': ['ML-FAM-LIFECYCLE-L1', 'ML-FAM-LIFECYCLE-L2', 'ML-FAM-LIFECYCLE-L3'],
  'COMPONENT-MISSING': ['ML-FAM-COMPOSITION-L1', 'ML-FAM-COMPOSITION-L2', 'ML-FAM-COMPOSITION-L3'],
  'COMPONENT-EXTRA': ['ML-FAM-COMPOSITION-L1', 'ML-FAM-COMPOSITION-L2', 'ML-FAM-COMPOSITION-L3'],
  UNKNOWN: ['ML-FAM-NONE-L1', 'ML-FAM-NONE-L2', 'ML-FAM-NONE-L3'],
}

/** Representative engine evidence per code — the phrasing the diagnosers actually emit. */
const EVIDENCE: Partial<Record<MisconceptionCode, string[]>> = {
  'BL-SOUTH-COLLISION': [
    '2 components are added directly to BorderLayout.SOUTH of the frame.',
    'Swing lays out only the last component added to SOUTH; the other one is never sized and stays invisible.',
  ],
  'NESTED-PANEL-MISSING': ['The target holds 1 nested JPanel; this build has 0.'],
  'SETLAYOUT-AFTER-ADD': ['save was added to panel before its BorderLayout was installed, so Swing never registers it — it stays invisible.'],
  'GRID-ORDER': ['The components and the layout settings match the target, so the difference is the order in which components were added.'],
  'FLOW-ORDER': ['The components and the layout settings match the target, so the difference is the order in which components were added.'],
  'BL-CENTER-EXPANSION': ['The frame was resized from 300×200 to 500×400 pixels.', 'The component is in BorderLayout.CENTER.'],
  'COMPILE-ERROR': ['Line 1 (`frame.add(save, BorderLayout.SOUTH);`) does not compile: cannot find symbol: save.'],
}

const REGION: Partial<Record<MisconceptionCode, Diagnosis['region']>> = {
  'BL-NORTH-COLLISION': 'NORTH',
  'BL-SOUTH-COLLISION': 'SOUTH',
  'BL-EAST-COLLISION': 'EAST',
  'BL-WEST-COLLISION': 'WEST',
  'BL-CENTER-COLLISION': 'CENTER',
  'BL-CENTER-EXPANSION': 'CENTER',
  'BL-EDGE-SIZING': 'EAST',
}

export interface EvalCase {
  id: string
  diagnosis: Diagnosis
  language: CorpusLanguage
  level: HintLevel
  /** The one source that must rank first. The sharp metric. */
  primaryChunkId: string
  /**
   * Every source a reviewer accepts as relevant to this finding:
   *   • the code's own text at this rung and the rung below — the ladder is
   *     cumulative, so restating the previous rung's rule while giving a
   *     level-3 clue is good teaching, not noise;
   *   • the family's text at those same rungs, which teaches the same idea more
   *     generally and is legitimate supporting context.
   * Anything from another family, another code, or a HIGHER level is not, which
   * is what keeps the precision figure worth measuring.
   */
  acceptableChunkIds: string[]
}

/** Family fallback source id, e.g. BL-REGION at level 2 → ML-FAM-BLREGION-L2. */
function familySource(code: MisconceptionCode, level: HintLevel): string {
  return `ML-FAM-${MISCONCEPTIONS[code].family.replace(/-/g, '')}-L${level}`
}

const LANGUAGES: CorpusLanguage[] = ['en-MY', 'ms-MY']
const STUDENT_LEVELS: HintLevel[] = [1, 2, 3]

/** The full evaluation set: every code × every student-facing level × both languages. */
export const EVAL_CASES: EvalCase[] = (Object.keys(MISCONCEPTIONS) as MisconceptionCode[]).flatMap((code) =>
  LANGUAGES.flatMap((language) =>
    STUDENT_LEVELS.map((level) => ({
      id: `${code}/L${level}/${language}`,
      language,
      level,
      primaryChunkId: `${ACCEPTABLE_SOURCES[code][level - 1]}:${language}`,
      acceptableChunkIds: [
        ...ACCEPTABLE_SOURCES[code].slice(Math.max(0, level - 2), level),
        ...(level > 1 ? [familySource(code, (level - 1) as HintLevel)] : []),
        familySource(code, level),
      ].map((sourceId) => `${sourceId}:${language}`),
      diagnosis: {
        code,
        family: MISCONCEPTIONS[code].family,
        confidence: 'high' as const,
        ...(REGION[code] ? { region: REGION[code] } : {}),
        evidence: EVIDENCE[code] ?? [`The engine's check failed with ${code}.`],
      },
    })),
  ),
)
