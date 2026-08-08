import type { BorderRegion, SwingNode } from '../engine/types'

export type LabLanguage = 'en' | 'ms'
export type MissionId = 1 | 2 | 3

export interface ARVisualState {
  mission: MissionId
  placedRegion?: BorderRegion
  selectedRegion?: BorderRegion
  resizeRevealed?: boolean
  collisionRevealed?: boolean
  collisionFixed?: boolean
}

export type ARInteraction =
  | { kind: 'region'; region: BorderRegion }
  | { kind: 'reveal-collision' }
  | { kind: 'repair-panel' }

export interface ARInteractionResult {
  visual: ARVisualState
  status: 'incorrect' | 'progress' | 'passed'
}

/** Deterministic mission state machine driven only by taps on tracked 3D objects. */
export function applyARInteraction(visual: ARVisualState, interaction: ARInteraction): ARInteractionResult {
  if (visual.mission === 1) {
    if (interaction.kind !== 'region') return { visual, status: 'incorrect' }
    const passed = interaction.region === 'NORTH'
    return {
      visual: { mission: 1, placedRegion: interaction.region, selectedRegion: interaction.region },
      status: passed ? 'passed' : 'incorrect',
    }
  }

  if (visual.mission === 2) {
    if (interaction.kind !== 'region') return { visual, status: 'incorrect' }
    const passed = interaction.region === 'CENTER'
    return {
      visual: { mission: 2, selectedRegion: interaction.region, resizeRevealed: passed },
      status: passed ? 'passed' : 'incorrect',
    }
  }

  if (!visual.collisionRevealed) {
    const revealsCollision = interaction.kind === 'reveal-collision'
      || (interaction.kind === 'region' && interaction.region === 'SOUTH')
    return {
      visual: revealsCollision
        ? { mission: 3, selectedRegion: 'SOUTH', collisionRevealed: true }
        : { ...visual, selectedRegion: interaction.kind === 'region' ? interaction.region : visual.selectedRegion },
      status: revealsCollision ? 'progress' : 'incorrect',
    }
  }

  if (interaction.kind === 'repair-panel') {
    return {
      visual: { mission: 3, selectedRegion: 'SOUTH', collisionRevealed: true, collisionFixed: true },
      status: 'passed',
    }
  }

  return { visual, status: 'incorrect' }
}

export function buildMissionTree(visual: ARVisualState): SwingNode {
  const children: NonNullable<SwingNode['children']> = [
    {
      node: { id: 'title', type: 'JLabel', text: 'Mukah Service Desk' },
      constraint: visual.placedRegion ?? 'NORTH',
    },
    {
      node: { id: 'content', type: 'JTextField', text: '', columns: 18 },
      constraint: 'CENTER',
    },
  ]

  if (visual.mission === 3) {
    if (visual.collisionFixed) {
      children.push({
        node: {
          id: 'actions',
          type: 'JPanel',
          text: '',
          layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
          children: [
            { node: { id: 'save', type: 'JButton', text: 'Save' } },
            { node: { id: 'cancel', type: 'JButton', text: 'Cancel' } },
          ],
        },
        constraint: 'SOUTH',
      })
    } else {
      children.push(
        { node: { id: 'save', type: 'JButton', text: 'Save' }, constraint: 'SOUTH' },
        { node: { id: 'cancel', type: 'JButton', text: 'Cancel' }, constraint: 'SOUTH' },
      )
    }
  }

  return {
    id: 'root',
    type: 'JPanel',
    text: '',
    layout: { kind: 'border', hgap: 0, vgap: 0 },
    children,
  }
}

export function missionScore(visual: ARVisualState): number {
  return Number(visual.placedRegion === 'NORTH') + Number(visual.resizeRevealed === true) + Number(visual.collisionFixed === true)
}
