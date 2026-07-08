/**
 * Predict-the-Reflow seed challenges. The tree is fixed; the code panel shows
 * generateJava(root, startSize); grading and the reveal animation both come
 * from layoutTree at endSize — the same engine the Playground renders with.
 */
import type { ReflowChallenge } from '../types'

export const REFLOW_CHALLENGES: ReflowChallenge[] = [
  {
    id: 'reflow-pinned-east',
    type: 'reflow',
    title: 'Pinned to the edge',
    prompt:
      'The window is resized from 440 to 620 px wide — drag the ghost of the Send button to where it will land.',
    difficulty: 'Apply',
    root: {
      id: 'frame',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: { id: 'searchField', type: 'JTextField', text: '', columns: 16 }, constraint: 'NORTH' },
        { node: { id: 'sendButton', type: 'JButton', text: 'Send' }, constraint: 'EAST' },
        { node: { id: 'messageLabel', type: 'JLabel', text: 'Messages will appear here' }, constraint: 'CENTER' },
      ],
    },
    startSize: { width: 440, height: 280 },
    endSize: { width: 620, height: 280 },
    targetId: 'sendButton',
    tolerance: 24,
  },
  {
    id: 'reflow-flow-wrap',
    type: 'reflow',
    title: 'The wrap',
    prompt:
      'The window is resized from 460 down to 300 px wide — drag the ghost of the Delete button to where it will land.',
    difficulty: 'Analyze',
    root: {
      id: 'frame',
      type: 'JPanel',
      text: '',
      layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
      children: [
        { node: { id: 'newButton', type: 'JButton', text: 'New' } },
        { node: { id: 'openButton', type: 'JButton', text: 'Open' } },
        { node: { id: 'saveButton', type: 'JButton', text: 'Save' } },
        { node: { id: 'exportButton', type: 'JButton', text: 'Export…' } },
        { node: { id: 'deleteButton', type: 'JButton', text: 'Delete' } },
      ],
    },
    startSize: { width: 460, height: 220 },
    endSize: { width: 300, height: 220 },
    targetId: 'deleteButton',
    tolerance: 24,
  },
]
