import type { BorderRegion, SwingNode } from '../engine/types'

export type LabLanguage = 'en' | 'ms'
export type MissionId = 1 | 2 | 3

export interface ARVisualState {
  mission: MissionId
  placedRegion?: BorderRegion
  resizeRevealed?: boolean
  collisionRevealed?: boolean
  collisionFixed?: boolean
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
