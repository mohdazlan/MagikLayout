import type { SwingNode } from '../engine/types'
import { layoutTree } from '../engine/layoutTree'
import { testMeasurer } from '../engine/metrics'
import type { ScenePiece } from '../swing-ar/model'

export interface RepairState { panel: boolean; flow: boolean; submit: boolean; cancel: boolean; placed: boolean }
export const emptyRepair = (): RepairState => ({ panel: false, flow: false, submit: false, cancel: false, placed: false })
export type RepairAction = 'panel' | 'flow' | 'submit' | 'cancel' | 'SOUTH'
export function repairStep(s: RepairState, action: RepairAction): RepairState {
  if (s.placed) return s
  if (action === 'panel') return { ...s, panel: true }
  if (action === 'flow' && s.panel) return { ...s, flow: true }
  if ((action === 'submit' || action === 'cancel') && s.flow) return { ...s, [action]: true }
  if (action === 'SOUTH' && s.submit && s.cancel && s.flow) return { ...s, placed: true }
  return s
}
const button = (id: string): SwingNode => ({ id, type: 'JButton', text: id === 'submit' ? 'Submit' : 'Cancel' })
export function repairTree(s: RepairState): SwingNode {
  return { id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children: s.placed
    ? [{ constraint: 'SOUTH', node: { id: 'actions', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children: [{ node: button('submit') }, { node: button('cancel') }] } }]
    : [{ node: button('submit'), constraint: 'SOUTH' }, { node: button('cancel'), constraint: 'SOUTH' }] }
}
export function repairScene(s: RepairState, width: number, intro: boolean) {
  const pieces: ScenePiece[] = []
  if (s.placed) {
    const tree = repairTree(s), geometry = layoutTree(tree, { width, height: 270 }, testMeasurer), f = 3.5 / 400
    const visit = (node: SwingNode, depth: number) => {
      const r = geometry.abs.get(node.id)
      if (node.id !== 'frame' && r) pieces.push({ id: node.id, type: node.type as ScenePiece['type'], text: node.text, x: (r.x + r.width / 2 - width / 2) * f, y: (135 - r.y - r.height / 2) * f, w: r.width * f, h: r.height * f, depth: .15 + depth * .15 })
      node.children?.forEach(c => visit(c.node, depth + 1))
    }
    visit(tree, 0)
  } else {
    if (s.panel) pieces.push({ id: 'actions', type: 'JPanel', text: s.flow ? 'JPanel · FlowLayout' : 'JPanel · choose layout', x: 0, y: .25, w: 2.8, h: .95, depth: .3 })
    if (intro || s.submit) pieces.push({ id: 'submit', type: 'JButton', text: 'Submit', x: s.submit ? -.65 : 0, y: s.submit ? .1 : -1.03, w: s.submit ? 1.05 : 2.6, h: .28, depth: .6 })
    pieces.push({ id: 'cancel', type: 'JButton', text: 'Cancel', x: s.cancel ? .65 : 0, y: s.cancel ? .1 : -1.03, w: s.cancel ? 1.05 : 2.6, h: .28, depth: .65 })
  }
  return { lesson: 'repair-game', specimen: false, pieces, width: width * 3.5 / 400, rotation: 0, scale: 1, regions: !s.placed, repairIntro: intro }
}
