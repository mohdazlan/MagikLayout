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
    notes: [
      'NORTH keeps its preferred height and stretches to the full frame width — that is why the search row sits tight at the top instead of splitting the frame in half.',
      'The row itself is a JPanel on FlowLayout: nesting a panel is how you get two components into one BorderLayout region, because a region only ever shows the last component added to it.',
      'CENTER took every pixel the NORTH row did not claim. Resize the frame and only the status label grows.',
    ],
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
    notes: [
      'GridLayout gave all four digit buttons an identical cell — it ignores preferred sizes completely, which is why they came out the same size even though "1" and "4" are narrow.',
      'Grid order is add order, filling left-to-right then top-to-bottom: 1 2 on the first row, 3 4 on the second.',
      'NORTH and SOUTH kept their preferred height while CENTER absorbed the rest, so the grid is the only part that grows when you resize.',
    ],
  },
  {
    id: 'reverse-ohms-calculator',
    type: 'reverse',
    title: 'Ohms Law calculator',
    prompt:
      'Rebuild this dialog: a header block NORTH (the formula over a prompt label) above a 3 × 2 grid of selectors and value fields in CENTER. The palette has no JRadioButton or JSpinner, so JCheckBox and JTextField stand in for them — the layout lesson is identical.',
    difficulty: 'Analyze',
    frameSize: { width: 460, height: 320 },
    target: {
      id: 't-root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        {
          node: {
            id: 't-header',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 2, cols: 1, hgap: 0, vgap: 0 },
            children: [
              { node: { id: 't-formula', type: 'JLabel', text: 'R = V / I' } },
              { node: { id: 't-prompt', type: 'JLabel', text: 'Select variable to solve for:' } },
            ],
          },
          constraint: 'NORTH',
        },
        {
          node: {
            id: 't-rows',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 3, cols: 2, hgap: 0, vgap: 0 },
            children: [
              { node: { id: 't-r', type: 'JCheckBox', text: 'Resistance (R)' } },
              { node: { id: 't-r-val', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-v', type: 'JCheckBox', text: 'Voltage (V)' } },
              { node: { id: 't-v-val', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-i', type: 'JCheckBox', text: 'Amperage (I)' } },
              { node: { id: 't-i-val', type: 'JTextField', text: '', columns: 10 } },
            ],
          },
          constraint: 'CENTER',
        },
      ],
    },
    notes: [
      'Two nested panels, two different managers: the frame is BorderLayout, the header is a 2 × 1 grid, and the selectors are a 3 × 2 grid. Each container lays out its own children — that is the whole trick to real Swing dialogs.',
      'A 3 × 2 GridLayout fills row by row, so the add order is label, field, label, field, label, field. Pair by pair, not column by column.',
      'Every cell in a GridLayout is identical, so the checkboxes and the text fields all got the same width even though "Resistance (R)" is far wider than "Voltage (V)".',
      'The header went in NORTH so it keeps its preferred height; CENTER absorbed the remaining space, which is why only the selector grid stretches when you resize the frame.',
    ],
  },
  {
    id: 'reverse-canteen-receipt',
    type: 'reverse',
    title: 'Mukah Airport canteen receipt',
    prompt:
      'Rebuild the canteen operator’s receipt panel: a bold title NORTH, a 5 × 2 entry form in CENTER, and a Calculate / Clear button row SOUTH. The last two rows are the points scheme — a balance field and a redeem tick. The palette has no JTextArea, so the printed-receipt area is left out; these three regions are the part being graded.',
    difficulty: 'Analyze',
    frameSize: { width: 520, height: 420 },
    target: {
      id: 't-root',
      type: 'JPanel',
      text: '',
      layout: { kind: 'border', hgap: 0, vgap: 0 },
      children: [
        { node: { id: 't-title', type: 'JLabel', text: 'Mukah Airport Canteen Receipt' }, constraint: 'NORTH' },
        {
          node: {
            id: 't-form',
            type: 'JPanel',
            text: '',
            layout: { kind: 'grid', rows: 5, cols: 2, hgap: 0, vgap: 0 },
            children: [
              { node: { id: 't-l-item', type: 'JLabel', text: 'Item Name' } },
              { node: { id: 't-f-item', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-l-price', type: 'JLabel', text: 'Price (RM)' } },
              { node: { id: 't-f-price', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-l-qty', type: 'JLabel', text: 'Quantity' } },
              { node: { id: 't-f-qty', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-l-bal', type: 'JLabel', text: 'Points Balance' } },
              { node: { id: 't-f-bal', type: 'JTextField', text: '', columns: 10 } },
              { node: { id: 't-l-redeem', type: 'JLabel', text: 'Redeem' } },
              { node: { id: 't-c-redeem', type: 'JCheckBox', text: 'Use my points' } },
            ],
          },
          constraint: 'CENTER',
        },
        {
          node: {
            id: 't-buttons',
            type: 'JPanel',
            text: '',
            layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 },
            children: [
              { node: { id: 't-calc', type: 'JButton', text: 'Calculate' } },
              { node: { id: 't-clear', type: 'JButton', text: 'Clear' } },
            ],
          },
          constraint: 'SOUTH',
        },
      ],
    },
    notes: [
      'This is the three-region skeleton almost every data-entry dialog uses: a title that keeps its height in NORTH, the form that absorbs the leftover space in CENTER, and an action row pinned in SOUTH.',
      'The 5 × 2 GridLayout pairs each label with its control by add order — label, control, label, control — filling row by row. Swap two adds and the labels drift away from the fields they name.',
      'A grid cell does not care what sits in it: the three entry fields, the balance field and the redeem checkbox all got identical cells, which is what lines the whole second column up for free.',
      'The button row is a nested JPanel on FlowLayout. A BorderLayout region shows only the last component added to it, so two buttons in SOUTH need a panel to share the region.',
      'Nothing here stores anything. The balance in that field and the state of the redeem tick live in ordinary variables in your event-handling code — an int for the points, a boolean from isSelected(). The layout only positions them.',
    ],
  },
]
