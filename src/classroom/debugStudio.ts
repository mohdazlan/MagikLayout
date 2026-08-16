import { gradeReverse } from '../challenges/grade'
import { diagnoseReverse, primaryDiagnosis, type Diagnosis } from '../coach/misconceptions'
import type { BorderRegion, SwingNode } from '../engine/types'

export type RepairStage = 'broken' | 'tool-ready' | 'repaired'

export interface MissionPrediction {
  id: string
  label: string
  correct: boolean
}

export interface MissionInspector {
  direct: number
  visible: string
  rule: string
  explanation: string
}

export interface StudioMission {
  id: string
  title: string
  manager: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  goal: string
  situation: string
  regionLabel: string
  tool: { name: string; detail: string }
  steps: [{ title: string; detail: string }, { title: string; detail: string }]
  predictions: MissionPrediction[]
  brokenTree: SwingNode
  intermediateTree: SwingNode
  targetTree: SwingNode
  diagnosis: Diagnosis
  inspector: Record<RepairStage, MissionInspector>
  java: Record<RepairStage, { text: string; tone?: 'problem' | 'repair' }[]>
  structure: Record<RepairStage, string>
  ghostLabel?: string
}

const button = (id: string, text: string): SwingNode => ({ id, type: 'JButton', text })
const label = (id: string, text: string): SwingNode => ({ id, type: 'JLabel', text })
const field = (id: string): SwingNode => ({ id, type: 'JTextField', text: '', columns: 10 })
const borderRoot = (children: NonNullable<SwingNode['children']>): SwingNode => ({ id: 'frame', type: 'JPanel', text: '', layout: { kind: 'border', hgap: 0, vgap: 0 }, children })
const flowRoot = (children: NonNullable<SwingNode['children']>): SwingNode => ({ id: 'frame', type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children })
const gridRoot = (rows: number, cols: number, children: NonNullable<SwingNode['children']>): SwingNode => ({ id: 'frame', type: 'JPanel', text: '', layout: { kind: 'grid', rows, cols, hgap: 0, vgap: 0 }, children })
const flowPanel = (id: string, children: NonNullable<SwingNode['children']>): SwingNode => ({ id, type: 'JPanel', text: '', layout: { kind: 'flow', align: 'CENTER', hgap: 5, vgap: 5 }, children })

const defaultPredictions = (region: BorderRegion, last: string): MissionPrediction[] => [
  { id: 'deleted', label: `Java deleted the first component`, correct: false },
  { id: 'collision', label: `${last} took the same ${region} region`, correct: true },
  { id: 'small-frame', label: 'The window is too small', correct: false },
]

function collisionMission(region: BorderRegion, first: string, last: string, index: number): StudioMission {
  const lower = region.toLowerCase()
  const panelId = `${lower}-group`
  const supporting = region === 'CENTER' ? [] : [{ node: label('status', 'Ready'), constraint: 'CENTER' as BorderRegion }]
  const broken = borderRoot([
    ...supporting,
    { node: button('first', first), constraint: region },
    { node: button('last', last), constraint: region },
  ])
  const intermediate = borderRoot([...supporting, { node: flowPanel(panelId, []), constraint: region }])
  const target = borderRoot([...supporting, { node: flowPanel(panelId, [{ node: button('first', first) }, { node: button('last', last) }]), constraint: region }])
  const diagnosis = primaryDiagnosis(diagnoseReverse(target, broken))
  return {
    id: `${lower}-collision`,
    title: `Two controls in ${region}`,
    manager: 'BorderLayout',
    difficulty: index < 2 ? 'Beginner' : 'Intermediate',
    goal: `Keep ${first} and ${last} visible in ${region}.`,
    situation: `${first} and ${last} were both added directly to BorderLayout.${region}; only the last one is visible.`,
    regionLabel: region,
    tool: { name: 'JPanel', detail: 'One container can carry both controls' },
    steps: [
      { title: `Place a JPanel in ${region}`, detail: 'Give the region one direct container.' },
      { title: `Group ${first} + ${last}`, detail: 'Let FlowLayout arrange both children.' },
    ],
    predictions: defaultPredictions(region, last),
    brokenTree: broken,
    intermediateTree: intermediate,
    targetTree: target,
    diagnosis,
    inspector: {
      broken: { direct: 2, visible: last, rule: 'One direct component per BorderLayout region', explanation: `${first} arrived first. ${last} arrived last and became the laid-out occupant.` },
      'tool-ready': { direct: 1, visible: `${panelId} (empty)`, rule: 'A JPanel can own a region and arrange children', explanation: `The JPanel owns ${region}. Move both controls inside it.` },
      repaired: { direct: 1, visible: panelId, rule: 'The outer manager sees one child', explanation: `${region} receives one JPanel; FlowLayout arranges its two children.` },
    },
    java: {
      broken: [
        { text: `frame.add(${first.toLowerCase()}, BorderLayout.${region});`, tone: 'problem' },
        { text: `frame.add(${last.toLowerCase()}, BorderLayout.${region});`, tone: 'problem' },
      ],
      'tool-ready': [
        { text: `JPanel ${panelId.replace('-', '')} = new JPanel();`, tone: 'repair' },
        { text: `frame.add(${panelId.replace('-', '')}, BorderLayout.${region});`, tone: 'repair' },
      ],
      repaired: [
        { text: `JPanel ${panelId.replace('-', '')} = new JPanel();`, tone: 'repair' },
        { text: `${panelId.replace('-', '')}.add(${first.toLowerCase()});`, tone: 'repair' },
        { text: `${panelId.replace('-', '')}.add(${last.toLowerCase()});`, tone: 'repair' },
        { text: `frame.add(${panelId.replace('-', '')}, BorderLayout.${region});`, tone: 'repair' },
      ],
    },
    structure: {
      broken: `JFrame (BorderLayout)\n├─ ${region}: ${first}  ← hidden\n└─ ${region}: ${last} ← visible`,
      'tool-ready': `JFrame (BorderLayout)\n└─ ${region}: JPanel (FlowLayout)\n   └─ empty`,
      repaired: `JFrame (BorderLayout)\n└─ ${region}: JPanel (FlowLayout)\n   ├─ ${first}\n   └─ ${last}`,
    },
    ghostLabel: first,
  }
}

function diagnosedMission(base: Omit<StudioMission, 'diagnosis'>): StudioMission {
  return { ...base, diagnosis: primaryDiagnosis(diagnoseReverse(base.targetTree, base.brokenTree)) }
}

const nestedTarget = borderRoot([
  { node: flowPanel('search-row', [{ node: field('query') }, { node: button('search', 'Search') }]), constraint: 'NORTH' },
  { node: label('status', 'No results yet'), constraint: 'CENTER' },
])
const nestedBroken = borderRoot([
  { node: field('query'), constraint: 'NORTH' },
  { node: button('search', 'Search'), constraint: 'EAST' },
  { node: label('status', 'No results yet'), constraint: 'CENTER' },
])
const nestedIntermediate = borderRoot([
  { node: flowPanel('search-row', []), constraint: 'NORTH' },
  { node: label('status', 'No results yet'), constraint: 'CENTER' },
])

const flowTarget = flowRoot([{ node: button('back', 'Back') }, { node: button('next', 'Next') }, { node: button('finish', 'Finish') }])
const flowBroken = flowRoot([{ node: button('finish', 'Finish') }, { node: button('back', 'Back') }, { node: button('next', 'Next') }])
const gridTarget = gridRoot(2, 2, ['1', '2', '3', '4'].map((text) => ({ node: button(`b${text}`, text) })))
const gridBroken = gridRoot(2, 2, ['1', '3', '2', '4'].map((text) => ({ node: button(`b${text}`, text) })))

const managerTarget = borderRoot([{ node: flowPanel('actions', [{ node: button('ok', 'OK') }, { node: button('cancel', 'Cancel') }]), constraint: 'SOUTH' }])
const managerBroken = borderRoot([{ node: { id: 'actions', type: 'JPanel', text: '', layout: { kind: 'grid', rows: 2, cols: 1, hgap: 0, vgap: 0 }, children: [{ node: button('ok', 'OK') }, { node: button('cancel', 'Cancel') }] }, constraint: 'SOUTH' }])

const regionTarget = borderRoot([{ node: label('title', 'Student Profile'), constraint: 'NORTH' }, { node: field('body'), constraint: 'CENTER' }])
const regionBroken = borderRoot([{ node: label('title', 'Student Profile'), constraint: 'SOUTH' }, { node: field('body'), constraint: 'CENTER' }])

const missingTarget = flowRoot([{ node: button('save', 'Save') }, { node: button('cancel', 'Cancel') }, { node: button('help', 'Help') }])
const missingBroken = flowRoot([{ node: button('save', 'Save') }, { node: button('cancel', 'Cancel') }])

const otherMissions: StudioMission[] = [
  diagnosedMission({
    id: 'nested-search-row', title: 'Build a search row', manager: 'Nested layouts', difficulty: 'Intermediate',
    goal: 'Keep the search field and button together at the top.',
    situation: 'The correct components exist, but they are scattered across two BorderLayout regions.', regionLabel: 'NORTH',
    tool: { name: 'JPanel', detail: 'Create a local layout inside NORTH' },
    steps: [{ title: 'Create the search panel', detail: 'Give the row its own FlowLayout.' }, { title: 'Move field + button', detail: 'Add the finished panel to NORTH.' }],
    predictions: [
      { id: 'font', label: 'The button text is too wide', correct: false },
      { id: 'nesting', label: 'The row needs its own container', correct: true },
      { id: 'frame', label: 'The JFrame needs a new size', correct: false },
    ],
    brokenTree: nestedBroken, intermediateTree: nestedIntermediate, targetTree: nestedTarget,
    inspector: {
      broken: { direct: 3, visible: 'Field + Search split', rule: 'Different local arrangements require nested containers', explanation: 'The frame manager cannot make two controls behave like one row without a nested panel.' },
      'tool-ready': { direct: 2, visible: 'search-row (empty)', rule: 'A JPanel is both component and container', explanation: 'The local row now exists; its children still need to move inside.' },
      repaired: { direct: 2, visible: 'search-row', rule: 'Each container manages only its direct children', explanation: 'BorderLayout places the panel; FlowLayout places the field and button.' },
    },
    java: {
      broken: [{ text: 'frame.add(query, BorderLayout.NORTH);', tone: 'problem' }, { text: 'frame.add(search, BorderLayout.EAST);', tone: 'problem' }],
      'tool-ready': [{ text: 'JPanel searchRow = new JPanel();', tone: 'repair' }],
      repaired: [{ text: 'searchRow.add(query);', tone: 'repair' }, { text: 'searchRow.add(search);', tone: 'repair' }, { text: 'frame.add(searchRow, BorderLayout.NORTH);', tone: 'repair' }],
    },
    structure: { broken: 'JFrame\n├─ NORTH: query\n├─ EAST: Search\n└─ CENTER: status', 'tool-ready': 'JFrame\n├─ NORTH: JPanel (empty)\n└─ CENTER: status', repaired: 'JFrame\n├─ NORTH: JPanel\n│  ├─ query\n│  └─ Search\n└─ CENTER: status' },
  }),
  diagnosedMission({
    id: 'flow-reading-order', title: 'Repair button order', manager: 'FlowLayout', difficulty: 'Beginner',
    goal: 'Arrange Back, Next, Finish in reading order.', situation: 'All controls are present, but FlowLayout displays the add sequence.', regionLabel: 'FLOW ROW',
    tool: { name: 'Add order', detail: 'Sequence is position in FlowLayout' },
    steps: [{ title: 'Read left to right', detail: 'Choose the intended visual sequence.' }, { title: 'Reorder add calls', detail: 'Make code order match reading order.' }],
    predictions: [{ id: 'align', label: 'CENTER alignment reversed them', correct: false }, { id: 'order', label: 'The add sequence controls position', correct: true }, { id: 'size', label: 'Button width changed the order', correct: false }],
    brokenTree: flowBroken, intermediateTree: flowBroken, targetTree: flowTarget,
    inspector: {
      broken: { direct: 3, visible: 'Finish, Back, Next', rule: 'FlowLayout position follows add order', explanation: 'The first add appears first in the row.' },
      'tool-ready': { direct: 3, visible: 'Sequence selected', rule: 'Read the desired row before editing code', explanation: 'Back should be the first component in the container list.' },
      repaired: { direct: 3, visible: 'Back, Next, Finish', rule: 'Add order is visual order', explanation: 'The component list now matches the intended reading sequence.' },
    },
    java: {
      broken: [{ text: 'row.add(finish);', tone: 'problem' }, { text: 'row.add(back);', tone: 'problem' }, { text: 'row.add(next);', tone: 'problem' }],
      'tool-ready': [{ text: '// Desired: Back → Next → Finish', tone: 'repair' }],
      repaired: [{ text: 'row.add(back);', tone: 'repair' }, { text: 'row.add(next);', tone: 'repair' }, { text: 'row.add(finish);', tone: 'repair' }],
    },
    structure: { broken: 'FlowLayout\n├─ Finish\n├─ Back\n└─ Next', 'tool-ready': 'Desired sequence\nBack → Next → Finish', repaired: 'FlowLayout\n├─ Back\n├─ Next\n└─ Finish' },
  }),
  diagnosedMission({
    id: 'grid-row-major', title: 'Repair keypad order', manager: 'GridLayout', difficulty: 'Intermediate',
    goal: 'Produce a 1 2 / 3 4 keypad.', situation: 'GridLayout filled the right components into the wrong cells.', regionLabel: '2 × 2 GRID',
    tool: { name: 'Row-major order', detail: 'GridLayout fills left-to-right, row-by-row' },
    steps: [{ title: 'Trace the cells', detail: 'Read the grid like a page.' }, { title: 'Reorder add calls', detail: 'Use 1, 2, 3, 4.' }],
    predictions: [{ id: 'random', label: 'GridLayout chooses cells randomly', correct: false }, { id: 'order', label: 'The add sequence fills the cells', correct: true }, { id: 'text', label: 'Button labels choose their cells', correct: false }],
    brokenTree: gridBroken, intermediateTree: gridBroken, targetTree: gridTarget,
    inspector: {
      broken: { direct: 4, visible: '1, 3 / 2, 4', rule: 'GridLayout fills row by row', explanation: 'The second add occupies the top-right cell.' },
      'tool-ready': { direct: 4, visible: 'Target sequence selected', rule: 'Cell number comes from list index', explanation: 'The target must read 1, 2, 3, 4 in code order.' },
      repaired: { direct: 4, visible: '1, 2 / 3, 4', rule: 'Row-major add order', explanation: 'The component sequence now maps to the intended cells.' },
    },
    java: {
      broken: ['1', '3', '2', '4'].map((n) => ({ text: `grid.add(b${n});`, tone: 'problem' as const })),
      'tool-ready': [{ text: '// Target cells: 1, 2, 3, 4', tone: 'repair' }],
      repaired: ['1', '2', '3', '4'].map((n) => ({ text: `grid.add(b${n});`, tone: 'repair' as const })),
    },
    structure: { broken: 'GridLayout(2, 2)\n├─ 1  ├─ 3\n├─ 2  └─ 4', 'tool-ready': 'Row-major target\n1 → 2 → 3 → 4', repaired: 'GridLayout(2, 2)\n├─ 1  ├─ 2\n├─ 3  └─ 4' },
  }),
  diagnosedMission({
    id: 'panel-manager', title: 'Choose the row manager', manager: 'Nested JPanel', difficulty: 'Intermediate',
    goal: 'Arrange OK and Cancel side by side.', situation: 'The panel exists, but GridLayout stacks the controls vertically.', regionLabel: 'SOUTH PANEL',
    tool: { name: 'FlowLayout', detail: 'A natural manager for compact rows' },
    steps: [{ title: 'Inspect the panel', detail: 'The outer BorderLayout is already correct.' }, { title: 'Change its manager', detail: 'Use FlowLayout for a button row.' }],
    predictions: [{ id: 'outer', label: 'The JFrame manager is wrong', correct: false }, { id: 'inner', label: 'The nested panel manager is wrong', correct: true }, { id: 'buttons', label: 'JButton cannot sit in a row', correct: false }],
    brokenTree: managerBroken, intermediateTree: managerBroken, targetTree: managerTarget,
    inspector: {
      broken: { direct: 1, visible: 'Vertical button panel', rule: 'Every container owns a separate manager', explanation: 'The frame places the panel correctly; the panel arranges its children incorrectly.' },
      'tool-ready': { direct: 1, visible: 'Panel selected', rule: 'Fix the manager closest to the wrong geometry', explanation: 'Only the nested panel needs to change.' },
      repaired: { direct: 1, visible: 'Horizontal button row', rule: 'FlowLayout packs a row', explanation: 'BorderLayout still owns SOUTH while FlowLayout owns the buttons.' },
    },
    java: { broken: [{ text: 'new JPanel(new GridLayout(2, 1));', tone: 'problem' }], 'tool-ready': [{ text: '// actions is the container to repair', tone: 'repair' }], repaired: [{ text: 'JPanel actions = new JPanel(new FlowLayout());', tone: 'repair' }] },
    structure: { broken: 'SOUTH: JPanel (GridLayout 2×1)', 'tool-ready': 'Selected: actions JPanel', repaired: 'SOUTH: JPanel (FlowLayout)' },
  }),
  diagnosedMission({
    id: 'wrong-border-region', title: 'Move the title home', manager: 'BorderLayout', difficulty: 'Beginner',
    goal: 'Pin the title above the content.', situation: 'The title is visible, but it was added to SOUTH instead of NORTH.', regionLabel: 'NORTH',
    tool: { name: 'Region constraint', detail: 'Choose the semantic edge' },
    steps: [{ title: 'Compare the target', detail: 'The title belongs above the content.' }, { title: 'Change the constraint', detail: 'Move SOUTH to NORTH.' }],
    predictions: [{ id: 'font', label: 'The title font pushed it down', correct: false }, { id: 'region', label: 'The title uses the wrong region', correct: true }, { id: 'center', label: 'CENTER always moves titles', correct: false }],
    brokenTree: regionBroken, intermediateTree: regionBroken, targetTree: regionTarget,
    inspector: {
      broken: { direct: 2, visible: 'Title at bottom', rule: 'BorderLayout regions express edge placement', explanation: 'SOUTH pins the title below the expanding CENTER.' },
      'tool-ready': { direct: 2, visible: 'Title selected', rule: 'Choose the region from intended behaviour', explanation: 'A header belongs in NORTH.' },
      repaired: { direct: 2, visible: 'Title at top', rule: 'NORTH keeps preferred height and spans width', explanation: 'The title now stays above the content.' },
    },
    java: { broken: [{ text: 'frame.add(title, BorderLayout.SOUTH);', tone: 'problem' }], 'tool-ready': [{ text: '// Intended edge: NORTH', tone: 'repair' }], repaired: [{ text: 'frame.add(title, BorderLayout.NORTH);', tone: 'repair' }] },
    structure: { broken: 'JFrame\n├─ CENTER: body\n└─ SOUTH: title', 'tool-ready': 'Selected: title\nCurrent: SOUTH', repaired: 'JFrame\n├─ NORTH: title\n└─ CENTER: body' },
  }),
  diagnosedMission({
    id: 'grid-dimensions', title: 'Restore the 2 × 2 grid', manager: 'GridLayout', difficulty: 'Advanced',
    goal: 'Turn one long row into two balanced rows.', situation: 'The component inventory is correct, but the grid settings describe 1 × 4.', regionLabel: 'GRID SETTINGS',
    tool: { name: 'Rows × columns', detail: 'Geometry comes from manager settings' },
    steps: [{ title: 'Count the target cells', detail: 'Two rows and two columns.' }, { title: 'Change dimensions', detail: 'Use GridLayout(2, 2).' }],
    predictions: [{ id: 'order', label: 'The add order creates a second row', correct: false }, { id: 'dimensions', label: 'The rows and columns are wrong', correct: true }, { id: 'resize', label: 'A narrower window creates Grid rows', correct: false }],
    brokenTree: gridRoot(1, 4, ['1', '2', '3', '4'].map((n) => ({ node: button(`d${n}`, n) }))), intermediateTree: gridRoot(1, 4, ['1', '2', '3', '4'].map((n) => ({ node: button(`d${n}`, n) }))), targetTree: gridRoot(2, 2, ['1', '2', '3', '4'].map((n) => ({ node: button(`d${n}`, n) }))),
    inspector: {
      broken: { direct: 4, visible: '1 × 4 row', rule: 'Grid dimensions determine its cell matrix', explanation: 'Four components do not imply a 2 × 2 grid.' },
      'tool-ready': { direct: 4, visible: 'Dimensions selected', rule: 'Rows × columns must match the intended matrix', explanation: 'The target needs two rows and two columns.' },
      repaired: { direct: 4, visible: '2 × 2 grid', rule: 'Every cell remains uniform', explanation: 'The same four components now occupy a balanced matrix.' },
    },
    java: { broken: [{ text: 'new GridLayout(1, 4);', tone: 'problem' }], 'tool-ready': [{ text: '// Target matrix: 2 rows × 2 columns', tone: 'repair' }], repaired: [{ text: 'new GridLayout(2, 2);', tone: 'repair' }] },
    structure: { broken: 'GridLayout(1, 4)', 'tool-ready': 'Target: 2 rows × 2 columns', repaired: 'GridLayout(2, 2)' },
  }),
  diagnosedMission({
    id: 'missing-help-button', title: 'Find the missing component', manager: 'FlowLayout', difficulty: 'Beginner',
    goal: 'Match the target component inventory.', situation: 'The row layout is correct, but the Help button was never added.', regionLabel: 'COMPONENT LIST',
    tool: { name: 'JButton Help', detail: 'Restore the missing component' },
    steps: [{ title: 'Compare inventories', detail: 'Target has three buttons; build has two.' }, { title: 'Add Help', detail: 'Append it to the FlowLayout row.' }],
    predictions: [{ id: 'hidden', label: 'Help is hidden behind Cancel', correct: false }, { id: 'missing', label: 'Help is absent from the component tree', correct: true }, { id: 'wrap', label: 'Help wrapped outside the window', correct: false }],
    brokenTree: missingBroken, intermediateTree: missingBroken, targetTree: missingTarget,
    inspector: {
      broken: { direct: 2, visible: 'Save, Cancel', rule: 'A layout manager can only arrange components that exist', explanation: 'The target inventory contains one more JButton.' },
      'tool-ready': { direct: 2, visible: 'Missing: Help', rule: 'Compare types and labels before geometry', explanation: 'The layout is not the cause of an absent node.' },
      repaired: { direct: 3, visible: 'Save, Cancel, Help', rule: 'FlowLayout displays every child in add order', explanation: 'The component inventory now matches the target.' },
    },
    java: { broken: [{ text: 'row.add(save);' }, { text: 'row.add(cancel);' }], 'tool-ready': [{ text: 'JButton help = new JButton("Help");', tone: 'repair' }], repaired: [{ text: 'row.add(save);' }, { text: 'row.add(cancel);' }, { text: 'row.add(help);', tone: 'repair' }] },
    structure: { broken: 'FlowLayout\n├─ Save\n└─ Cancel', 'tool-ready': 'Inventory diff\nMissing: JButton “Help”', repaired: 'FlowLayout\n├─ Save\n├─ Cancel\n└─ Help' },
  }),
]

export const STUDIO_MISSIONS: StudioMission[] = [
  collisionMission('SOUTH', 'Save', 'Cancel', 0),
  collisionMission('NORTH', 'Search', 'Filter', 1),
  collisionMission('EAST', 'Next', 'Finish', 2),
  collisionMission('WEST', 'Back', 'Menu', 3),
  collisionMission('CENTER', 'Canvas', 'Preview', 4),
  ...otherMissions,
]

export function missionById(id: string): StudioMission {
  return STUDIO_MISSIONS.find((mission) => mission.id === id) ?? STUDIO_MISSIONS[0]
}

export function treeForStage(mission: StudioMission, stage: RepairStage): SwingNode {
  if (stage === 'tool-ready') return mission.intermediateTree
  if (stage === 'repaired') return mission.targetTree
  return mission.brokenTree
}

export function nextRepairStage(stage: RepairStage): RepairStage {
  if (stage === 'broken') return 'tool-ready'
  if (stage === 'tool-ready') return 'repaired'
  return 'repaired'
}

export function isCorrectPrediction(mission: StudioMission, id: string): boolean {
  return mission.predictions.some((prediction) => prediction.id === id && prediction.correct)
}

export function studioProgress(stage: RepairStage): number {
  if (stage === 'tool-ready') return 2
  if (stage === 'repaired') return 3
  return 1
}

export function repairPasses(mission: StudioMission, stage: RepairStage): boolean {
  return gradeReverse(mission.targetTree, treeForStage(mission, stage)).pass
}

