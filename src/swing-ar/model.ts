import { generateJava } from '../codegen/javaCode'
import { layoutTree } from '../engine/layoutTree'
import { testMeasurer } from '../engine/metrics'
import type { BorderRegion, SwingNode, SwingChild, LayoutSpec } from '../engine/types'
import { gradeReverse } from '../challenges/grade'

export const COMPONENTS = [
  { type: 'JButton', name: 'A button', text: 'Click Me', analogy: 'Like a doorbell. Press it to ask your app to do something.', prompt: 'Try pressing the floating button. A button needs a listener before it can do a job.', width: 2.25, height: .8 },
  { type: 'JTextField', name: 'A place to type', text: 'Your name', analogy: 'Like a blank on a form. It holds one line of text that a person can type.', prompt: 'A text field collects an answer. Its columns suggest how wide it should be.', width: 2.9, height: .7 },
  { type: 'JPanel', name: 'A container', text: 'JPanel', analogy: 'Like a box. Put related components inside it and arrange them together.', prompt: 'A panel lives inside a window. It can have its own layout manager.', width: 2.65, height: 1.7 },
  { type: 'JFrame', name: 'The app window', text: 'My App', analogy: 'Like the whole house. It is the window that holds your interface.', prompt: 'The frame is the outer window. Panels and controls go inside it.', width: 3.3, height: 2.25 },
  { type: 'JLabel', name: 'A piece of text', text: 'My App', analogy: 'Like a name tag. It shows words that the person using the app does not edit.', prompt: 'A label explains something. A text field lets someone enter something.', width: 2.25, height: .65 },
] as const
export type DiscoveryType = typeof COMPONENTS[number]['type']
export type Lesson = 'recognition' | 'layouts' | 'build' | 'debug' | 'events'
export const LESSONS: { id: Lesson; title: string; short: string; instruction: string }[] = [
  { id: 'recognition', title: 'Component Recognition', short: 'Meet the pieces', instruction: 'Start with one small piece. Turn it around, then place it in a window.' },
  { id: 'layouts', title: 'Layout Manager Playground', short: 'Try a layout', instruction: 'Same three buttons. Two ways to arrange them. Switch the manager, then resize the window.' },
  { id: 'build', title: 'Build-a-Frame Challenge', short: 'Build a frame', instruction: 'Match the target: label at the top, text field in the middle, button at the bottom. Choose a piece, then tap a region or drag the piece into it.' },
  { id: 'debug', title: 'Debug the AR Scene', short: 'Fix the scene', instruction: 'Save and Cancel were sent to the same SOUTH region. Only Cancel is visible. Inspect SOUTH, then try a repair.' },
  { id: 'events', title: 'Event Handling Simulation', short: 'Make it respond', instruction: 'Tap Click Me. Then connect a listener and tap again. Watch which Java lines respond.' },
]
export const REGIONS: BorderRegion[] = ['NORTH', 'WEST', 'CENTER', 'EAST', 'SOUTH']
export interface LabState {
  lesson: Lesson; component: number; placed: boolean; layout: 'flow' | 'border'; width: number;
  rotation: number; scale: number; build: SwingChild[]; inspected: boolean; repaired: boolean;
  listener: boolean; clicks: number; revealed: boolean; feedback: string; completed: Lesson[];
  seenLayouts: string[]; seenComponents: number[]; buildPassed: boolean;
}
export function initialState(): LabState {
  return { lesson: 'recognition', component: 0, placed: false, layout: 'flow', width: 400, rotation: -12,
    scale: 1, build: [], inspected: false, repaired: false, listener: false, clicks: 0,
    revealed: true, feedback: COMPONENTS[0].prompt, completed: [], seenLayouts: [], seenComponents: [0], buildPassed: false }
}
const flow: LayoutSpec = { kind: 'flow', align: 'CENTER', hgap: 12, vgap: 12 }
const border: LayoutSpec = { kind: 'border', hgap: 8, vgap: 8 }
export function root(children: SwingChild[], layout: LayoutSpec = border): SwingNode {
  return { id: 'frame', type: 'JPanel', text: '', layout, children }
}
export function componentNode(index: number, id = 'piece'): SwingNode {
  const item = COMPONENTS[index]
  if (item.type === 'JFrame') throw new Error('JFrame is the root window, never a child component.')
  return { id, type: item.type, text: item.type === 'JTextField' ? '' : item.text,
    ...(item.type === 'JTextField' ? { columns: 10 } : {}),
    ...(item.type === 'JPanel' ? { layout: flow, children: [{ node: { id: 'inside-panel', type: 'JButton' as const, text: 'Inside the box' } }] } : {}) }
}
export function buildTarget(): SwingNode {
  return root([
    { node: componentNode(4, 'target-label'), constraint: 'NORTH' },
    { node: componentNode(1, 'target-field'), constraint: 'CENTER' },
    { node: componentNode(0, 'target-button'), constraint: 'SOUTH' },
  ])
}
export function lessonTree(s: LabState, includeFloating = false): SwingNode {
  if (s.lesson === 'recognition') {
    return root(s.component === 3 || (!s.placed && !includeFloating) ? [] : [{ node: componentNode(s.component) }], flow)
  }
  if (s.lesson === 'layouts') return root(['Save', 'Next', 'Help'].map((text, i) => ({
    node: { id: `layout-${i}`, type: 'JButton', text }, constraint: (['NORTH', 'CENTER', 'SOUTH'] as const)[i],
  })), s.layout === 'flow' ? flow : border)
  if (s.lesson === 'build') return root(s.build)
  if (s.lesson === 'debug') {
    const buttons: SwingChild[] = ['Save', 'Cancel'].map(text => ({ node: { id: text.toLowerCase(), type: 'JButton', text }, constraint: 'SOUTH' }))
    return root(s.repaired ? [{ node: { id: 'actions', type: 'JPanel', text: '', layout: flow, children: buttons.map(b => ({ node: b.node })) }, constraint: 'SOUTH' }] : buttons)
  }
  return root([
    { node: { id: 'event-button', type: 'JButton', text: 'Click Me' } },
    { node: { id: 'event-status', type: 'JLabel', text: s.clicks ? 'You clicked the button!' : 'Waiting for a click' } },
  ], flow)
}
export function javaFor(s: LabState): string {
  let code = generateJava(lessonTree(s.lesson === 'events' ? { ...s, clicks: 0 } : s, true), { width: s.width, height: 300 }).code
    .replace('public class LayoutDemo', 'public class MyApp')
    .replace('new JFrame("LayoutLab")', 'new JFrame("My App")')
  if (s.lesson === 'recognition' && !s.placed && s.component !== 3) {
    code = code.replace(/        frame\.add\(\w+\);\n/, '        // Place the component in the frame to connect it.\n')
  }
  if (s.lesson === 'events' && s.listener) {
    code = code.replace('        frame.setSize', '        button1.addActionListener(event -> {\n            label1.setText("You clicked the button!");\n        });\n\n        frame.setSize')
  }
  // Swing UI construction belongs on the event dispatch thread.
  code = code.replace('    public static void main(String[] args) {\n', '    public static void main(String[] args) {\n        SwingUtilities.invokeLater(() -> {\n')
    .replace(/^(        (?!SwingUtilities).*?)$/gm, '    $1')
    .replace('    }\n}', '        });\n    }\n}')
  return code
}
export type Action =
  | { type: 'lesson'; lesson: Lesson } | { type: 'component'; index: number }
  | { type: 'place'; region?: BorderRegion } | { type: 'layout'; layout: 'flow' | 'border' }
  | { type: 'width' | 'rotation' | 'scale'; value: number } | { type: 'check' | 'inspect' | 'repair' | 'listener' | 'tap' | 'reveal' | 'reset' }
export function update(s: LabState, a: Action): LabState {
  if ('value' in a && !Number.isFinite(a.value)) return s
  let n = { ...s }
  const complete = (lesson: Lesson) => { n.completed = [...new Set([...n.completed, lesson])] }
  if (a.type === 'lesson') {
    return { ...s, lesson: a.lesson, component: a.lesson === 'build' ? 4 : s.component,
      revealed: a.lesson === 'recognition' || (a.lesson === 'events' && s.listener), feedback: LESSONS.find(l => l.id === a.lesson)!.instruction }
  }
  if (a.type === 'component') {
    if (!Number.isInteger(a.index) || a.index < 0 || a.index >= COMPONENTS.length) return s
    n.component = a.index; n.placed = false; n.feedback = COMPONENTS[a.index].prompt
    n.seenComponents = [...new Set([...s.seenComponents, a.index])]
    if (n.seenComponents.length === COMPONENTS.length && s.lesson === 'recognition') complete('recognition')
  } else if (a.type === 'place') {
    if (s.component === 3) { n.feedback = 'JFrame is already the outer window. Choose a component to put inside it.'; return n }
    if (s.lesson === 'build') {
      const region = a.region ?? 'CENTER'
      n.build = [...s.build.filter(c => c.constraint !== region), { node: componentNode(s.component, `build-${region}`), constraint: region }]
      n.buildPassed = false; n.revealed = false; n.completed = s.completed.filter(l => l !== 'build')
      n.feedback = `${COMPONENTS[s.component].type} placed in ${region}. Compare your window with the target.`
    } else if (s.lesson === 'recognition') {
      n.placed = true; n.feedback = 'It is inside the window. Find frame.add(...) in the Java: that line connects the two.'
    }
  } else if (a.type === 'layout') {
    n.layout = a.layout; n.seenLayouts = [...new Set([...s.seenLayouts, a.layout])]
    n.feedback = a.layout === 'flow' ? 'FlowLayout puts buttons in a row and wraps them when space runs out.' : 'BorderLayout has five regions. NORTH and SOUTH stretch across the window; CENTER takes the space left over.'
    if (n.seenLayouts.length === 2) complete('layouts')
  } else if (a.type === 'width') n.width = Math.round(Math.max(260, Math.min(600, a.value)))
  else if (a.type === 'rotation') n.rotation = Math.max(-180, Math.min(180, a.value))
  else if (a.type === 'scale') n.scale = Math.max(.6, Math.min(1.6, a.value))
  else if (a.type === 'check' && s.lesson === 'build') {
    const grade = gradeReverse(buildTarget(), lessonTree(s))
    n.buildPassed = grade.pass; n.revealed = grade.pass
    n.feedback = grade.pass ? 'You built it! The label is NORTH, the field is CENTER, and the button is SOUTH. Your Java is ready.' : `Keep going. ${grade.findings.join(' ')}`
    if (grade.pass) complete('build')
  } else if (a.type === 'inspect') {
    n.inspected = true; n.feedback = 'Save is still in the component tree. Cancel was added last to SOUTH, so Save never received a visible space.'
  } else if (a.type === 'repair') {
    if (!s.inspected) { n.feedback = 'First inspect SOUTH to find out why Save disappeared.'; return n }
    n.repaired = true; n.revealed = true; complete('debug')
    n.feedback = 'Fixed. One JPanel owns SOUTH. Its FlowLayout arranges Save and Cancel side by side.'
  } else if (a.type === 'listener') {
    n.listener = true; n.revealed = true; n.feedback = 'The listener is connected. Tap Click Me in the scene to run its response.'
  } else if (a.type === 'tap') {
    if (s.lesson === 'events') {
      if (s.listener) { n.clicks++; complete('events'); n.feedback = 'Button pressed → ActionListener called → label changed. That is an event.' }
      else n.feedback = 'You pressed the button. Nothing is listening yet. Connect an ActionListener, then try again.'
    } else n.feedback = COMPONENTS[s.component].type === 'JButton' ? 'You pressed a JButton! In “Make it respond”, you will connect the code that listens.' : COMPONENTS[s.component].analogy
  } else if (a.type === 'reveal') {
    if (s.lesson === 'build' && !s.buildPassed) return s
    n.revealed = !s.revealed
  }
  else if (a.type === 'reset') {
    const fresh = initialState()
    return { ...fresh, lesson: s.lesson, component: s.lesson === 'build' ? 4 : 0, completed: s.completed.filter(l => l !== s.lesson), revealed: s.lesson === 'recognition', feedback: 'Fresh start. Try one small step.' }
  }
  return n
}

export interface ScenePiece { id: string; type: DiscoveryType; text: string; x: number; y: number; w: number; h: number; depth: number; ghost?: boolean }
export function sceneFor(s: LabState) {
  const specimen = s.lesson === 'recognition' && !s.placed
  const selected = COMPONENTS[s.component]
  const pieces: ScenePiece[] = []
  if (specimen) pieces.push({ id: 'specimen', type: selected.type, text: selected.text, x: 0, y: .1, w: selected.width, h: selected.height, depth: .08 })
  else {
    const tree = lessonTree(s)
    const geometry = layoutTree(tree, { width: s.width, height: 270 }, testMeasurer)
    const factor = 3.5 / 400
    const visit = (node: SwingNode, depth: number) => {
      if (node.id !== 'frame') {
        const r = geometry.abs.get(node.id)
        if (r && r.width > 0 && r.height > 0) pieces.push({ id: node.id, type: node.type as DiscoveryType,
          text: node.id === 'event-status' && s.clicks ? 'You clicked the button!' : node.text,
          x: (r.x + r.width / 2 - s.width / 2) * factor, y: (135 - r.y - r.height / 2) * factor,
          w: r.width * factor, h: r.height * factor, depth: .13 + depth * .1 })
      }
      node.children?.forEach(c => visit(c.node, depth + 1))
    }
    visit(tree, 0)
    if (s.lesson === 'build' && selected.type !== 'JFrame') pieces.push({ id: 'build-tray', type: selected.type, text: `Drag ${selected.type}`, x: 0, y: -1.65, w: 1.65, h: .30, depth: .35 })
    if (s.lesson === 'debug' && s.inspected && !s.repaired) pieces.push({ id: 'hidden-save', type: 'JButton', text: 'Save · hidden', x: 0, y: -.65, w: 1.6, h: .32, depth: .4, ghost: true })
  }
  return { lesson: s.lesson, specimen, pieces, width: s.width * 3.5 / 400, rotation: s.rotation, scale: s.scale,
    regions: s.lesson === 'build', inspected: s.inspected, repaired: s.repaired, pulse: s.clicks }
}
