/**
 * Reverse-challenge seeds: a target tree the student rebuilds in an embedded
 * builder made of the real Playground components. Grading is deterministic
 * structural equivalence (spec §7.3); the AI coach layer arrives with the
 * Phase 2 proxy. Every node here is reachable with the palette + text
 * editing, and JTextFields use the palette default of 10 columns.
 */
import type { ReverseChallenge } from '../types'

export const REVERSE_CHALLENGES: ReverseChallenge[] = [
  {
    id: 'reverse-search-bar',
    type: 'reverse',
    title: 'Search header',
    prompt:
      'Rebuild the target: a search row pinned NORTH (field + button in a flow panel) over a status label in CENTER. Structure is graded, not pixels — resize your frame freely.',
    difficulty: 'Apply',
    frameSize: { width: 420, height: 260 },
    target: {
      id: 't-root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        {
          node: {
            id: 't-bar',
            type: 'JPanel',
            text: '',
            layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
            children: [
              { node: { id: 't-field', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-search', type: 'JButton', text: 'Search' } },
            ],
          },
          constraint: 'NORTH',
        },
        { node: { id: 't-status', type: 'JLabel', text: 'No results yet' }, constraint: 'CENTER' },
      ],
    },
  },
  {
    id: 'reverse-calculator',
    type: 'reverse',
    title: 'Calculator shell',
    prompt:
      'Rebuild the target: a display field NORTH, a 2×2 grid of digit buttons in CENTER, and a Clear button SOUTH. Grid order is add order — 1 2 / 3 4, row by row.',
    difficulty: 'Analyze',
    frameSize: { width: 380, height: 320 },
    target: {
      id: 't-root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: { id: 't-display', type: 'JTextField', text: '', columns: 10 }, constraint: 'NORTH' },
        {
          node: {
            id: 't-grid',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 2, cols: 2, hgap: 0, vgap: 0 },
            children: [
              { node: { id: 't-b1', type: 'JButton', text: '1' } },
              { node: { id: 't-b2', type: 'JButton', text: '2' } },
              { node: { id: 't-b3', type: 'JButton', text: '3' } },
              { node: { id: 't-b4', type: 'JButton', text: '4' } },
            ],
          },
          constraint: 'CENTER',
        },
        { node: { id: 't-clear', type: 'JButton', text: 'Clear' }, constraint: 'SOUTH' },
      ],
    },
  },
]
