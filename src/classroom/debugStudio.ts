import type { SwingNode } from '../engine/types'
import { gradeReverse } from '../challenges/grade'

export type RepairStage = 'broken' | 'panel-ready' | 'repaired'
export type PredictionId = 'deleted' | 'collision' | 'small-frame'

const button = (id: string, text: string): SwingNode => ({ id, type: 'JButton', text })
const status: SwingNode = { id: 'status', type: 'JLabel', text: 'Ready' }

export const BROKEN_SOUTH_TREE: SwingNode = {
  id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 },
  children: [
    { node: status, constraint: 'CENTER' },
    { node: button('save', 'Save'), constraint: 'SOUTH' },
    { node: button('cancel', 'Cancel'), constraint: 'SOUTH' },
  ],
}

export const PANEL_READY_TREE: SwingNode = {
  id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 },
  children: [
    { node: status, constraint: 'CENTER' },
    { node: { id: 'button-row', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [] }, constraint: 'SOUTH' },
  ],
}

export const REPAIRED_SOUTH_TREE: SwingNode = {
  id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 },
  children: [
    { node: status, constraint: 'CENTER' },
    {
      node: {
        id: 'button-row', type: 'JPanel', text: '',
        layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
        children: [{ node: button('save', 'Save') }, { node: button('cancel', 'Cancel') }],
      },
      constraint: 'SOUTH',
    },
  ],
}

export const PREDICTIONS: { id: PredictionId; label: string; correct: boolean }[] = [
  { id: 'deleted', label: 'Java deleted Save', correct: false },
  { id: 'collision', label: 'Cancel took the same SOUTH region', correct: true },
  { id: 'small-frame', label: 'The window is too small', correct: false },
]

export function treeForStage(stage: RepairStage): SwingNode {
  if (stage === 'panel-ready') return PANEL_READY_TREE
  if (stage === 'repaired') return REPAIRED_SOUTH_TREE
  return BROKEN_SOUTH_TREE
}

export function nextRepairStage(stage: RepairStage): RepairStage {
  if (stage === 'broken') return 'panel-ready'
  if (stage === 'panel-ready') return 'repaired'
  return 'repaired'
}

/** Completion is a structural engine comparison, never an AI judgement. */
export function repairPasses(stage: RepairStage): boolean {
  return gradeReverse(REPAIRED_SOUTH_TREE, treeForStage(stage)).pass
}

export function isCorrectPrediction(id: PredictionId): boolean {
  return PREDICTIONS.some((prediction) => prediction.id === id && prediction.correct)
}

export function studioProgress(stage: RepairStage): number {
  if (stage === 'panel-ready') return 2
  if (stage === 'repaired') return 3
  return 1
}

export function southInspector(stage: RepairStage): { direct: number; visible: string; explanation: string } {
  if (stage === 'panel-ready') return { direct: 1, visible: 'buttonRow (empty)', explanation: 'The JPanel owns SOUTH now. Move both buttons inside it.' }
  if (stage === 'repaired') return { direct: 1, visible: 'buttonRow', explanation: 'SOUTH receives one JPanel; FlowLayout arranges its two children.' }
  return { direct: 2, visible: 'Cancel', explanation: "Save arrived first. Cancel arrived last and became SOUTH's laid-out occupant." }
}

export function javaLinesForStage(stage: RepairStage): { text: string; tone?: 'problem' | 'repair' }[] {
  if (stage === 'panel-ready') return [
    { text: 'JPanel buttonRow = new JPanel();', tone: 'repair' },
    { text: 'frame.add(buttonRow, BorderLayout.SOUTH);', tone: 'repair' },
    { text: '// The panel is ready. Its buttons still need to move inside.' },
  ]
  if (stage === 'repaired') return [
    { text: 'JPanel buttonRow = new JPanel();', tone: 'repair' },
    { text: 'buttonRow.add(save);', tone: 'repair' },
    { text: 'buttonRow.add(cancel);', tone: 'repair' },
    { text: 'frame.add(buttonRow, BorderLayout.SOUTH);', tone: 'repair' },
  ]
  return [
    { text: 'frame.add(save, BorderLayout.SOUTH);', tone: 'problem' },
    { text: 'frame.add(cancel, BorderLayout.SOUTH);', tone: 'problem' },
  ]
}
