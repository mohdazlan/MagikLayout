/**
 * Demonstration scenarios for the Coach Lab.
 *
 * Every scenario runs the REAL diagnosers over a real component tree or a real
 * magnet sequence. Nothing here is a canned finding — if the taxonomy or the
 * engine changes, these change with it, and a scenario that stops reproducing
 * its misconception fails the tests rather than quietly showing a stale string.
 *
 * That matters more than it looks: the Coach Lab is what a judge or a
 * coordinator watches to decide whether the retrieval story is real. It has to
 * be the same code path a student hits.
 */
import { executeStatements } from '../challenges/execute'
import { gradeParsons } from '../challenges/grade'
import type { ParsonsChallenge, ReflowChallenge } from '../challenges/types'
import type { SwingNode } from '../engine/types'
import { diagnoseParsons, diagnoseReflow, diagnoseReverse, primaryDiagnosis, type Diagnosis } from '../coach/misconceptions'

export interface Scenario {
  id: string
  /** What a teacher would call this on a whiteboard. */
  title: string
  /** The student action that produced it. */
  situation: string
  mode: 'reverse' | 'parsons' | 'reflow'
  challengeTitle: string
  diagnosis: Diagnosis
}

const button = (id: string, text: string): SwingNode => ({ id, type: 'JButton', text })

// ── 1. The competition lesson: two buttons sent to one region ──────────────

const southTarget: SwingNode = {
  id: 'frame',
  type: 'JPanel',
  text: '',
  layout: { kind: 'border', hgap: 0, vgap: 0 },
  children: [
    {
      node: {
        id: 'bar',
        type: 'JPanel',
        text: '',
        layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
        children: [{ node: button('save', 'Save') }, { node: button('cancel', 'Cancel') }],
      },
      constraint: 'SOUTH',
    },
    { node: { id: 'status', type: 'JLabel', text: 'Ready' }, constraint: 'CENTER' },
  ],
}

const southStudent: SwingNode = {
  id: 'frame',
  type: 'JPanel',
  text: '',
  layout: { kind: 'border', hgap: 0, vgap: 0 },
  children: [
    { node: button('save', 'Save'), constraint: 'SOUTH' },
    { node: button('cancel', 'Cancel'), constraint: 'SOUTH' },
    { node: { id: 'status', type: 'JLabel', text: 'Ready' }, constraint: 'CENTER' },
  ],
}

// ── 2. Statement order: added before the manager was installed ─────────────

const timingChallenge: ParsonsChallenge = {
  id: 'demo-timing',
  type: 'parsons',
  title: 'Toolbar with a late setLayout',
  prompt: 'Order the statements so the toolbar appears.',
  difficulty: 'Analyze',
  frameSize: { width: 420, height: 240 },
  magnets: [
    { id: 'd-panel', java: 'JPanel toolbar = new JPanel();', stmt: { kind: 'declare', varName: 'toolbar', component: { type: 'JPanel', text: '' } } },
    { id: 's-panel', java: 'toolbar.setLayout(new BorderLayout());', stmt: { kind: 'setLayout', target: 'toolbar', spec: { kind: 'border', hgap: 0, vgap: 0 } } },
    { id: 'd-back', java: 'JButton back = new JButton("Back");', stmt: { kind: 'declare', varName: 'back', component: { type: 'JButton', text: 'Back' } } },
    { id: 'a-back', java: 'toolbar.add(back, BorderLayout.WEST);', stmt: { kind: 'add', target: 'toolbar', child: 'back', constraint: 'WEST' } },
    { id: 'a-toolbar', java: 'frame.add(toolbar, BorderLayout.NORTH);', stmt: { kind: 'add', target: 'frame', child: 'toolbar', constraint: 'NORTH' } },
  ],
  trayOrder: [0, 1, 2, 3, 4],
}

/** The student's order: the add runs before setLayout, so Swing never registers it. */
const timingOrder = [0, 2, 3, 1, 4]

// ── 3. Grid order: right parts, wrong sequence ─────────────────────────────

const gridPanel = (order: string[]): SwingNode => ({
  id: 'frame',
  type: 'JPanel',
  text: '',
  layout: { kind: 'grid', rows: 2, cols: 2, hgap: 0, vgap: 0 },
  children: order.map((text, i) => ({ node: button(`b${i}`, text) })),
})

// ── 4. Reflow: predicting where a CENTER component lands ───────────────────

const reflowChallenge: ReflowChallenge = {
  id: 'demo-reflow',
  type: 'reflow',
  title: 'The body grows',
  prompt: 'Predict where the body label lands after the resize.',
  difficulty: 'Apply',
  root: {
    id: 'frame',
    type: 'JPanel',
    text: '',
    layout: { kind: 'border', hgap: 0, vgap: 0 },
    children: [
      { node: { id: 'title', type: 'JLabel', text: 'Report' }, constraint: 'NORTH' },
      { node: { id: 'body', type: 'JLabel', text: 'Body text' }, constraint: 'CENTER' },
    ],
  },
  startSize: { width: 320, height: 220 },
  endSize: { width: 560, height: 420 },
  targetId: 'body',
  tolerance: 24,
}

function timingDiagnosis(): Diagnosis {
  const exec = executeStatements(timingOrder.map((i) => timingChallenge.magnets[i].stmt))
  return primaryDiagnosis(diagnoseParsons(timingChallenge, timingOrder, exec, gradeParsons(timingChallenge, timingOrder)))
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'south-collision',
    title: 'Two buttons sent to SOUTH',
    situation: 'The learner added Save and Cancel straight to BorderLayout.SOUTH. The code compiled; one button is invisible.',
    mode: 'reverse',
    challengeTitle: 'Rebuild the target — button row',
    diagnosis: primaryDiagnosis(diagnoseReverse(southTarget, southStudent)),
  },
  {
    id: 'setlayout-timing',
    title: 'Added before setLayout ran',
    situation: 'The learner added the Back button to the toolbar, then installed the toolbar\'s BorderLayout afterwards.',
    mode: 'parsons',
    challengeTitle: timingChallenge.title,
    diagnosis: timingDiagnosis(),
  },
  {
    id: 'grid-order',
    title: 'Grid filled in the wrong order',
    situation: 'All four digit buttons exist and the grid is 2×2, but the learner added them in a different sequence.',
    mode: 'reverse',
    challengeTitle: 'Rebuild the target — keypad',
    diagnosis: primaryDiagnosis(diagnoseReverse(gridPanel(['1', '2', '3', '4']), gridPanel(['1', '3', '2', '4']))),
  },
  {
    id: 'center-expansion',
    title: 'Predicting a CENTER component after a resize',
    situation: 'The learner predicted the body label would stay put when the frame grew from 320×220 to 560×420.',
    mode: 'reflow',
    challengeTitle: reflowChallenge.title,
    diagnosis: diagnoseReflow(reflowChallenge, { pass: false, truth: { x: 0, y: 22, width: 560, height: 398 }, dx: 118, dy: 96 })[0],
  },
]

export function findScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id)
}
