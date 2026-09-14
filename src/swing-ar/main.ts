import { COMPONENTS, LESSONS, REGIONS, initialState, javaFor, sceneFor, update, type Action, type Lesson } from './model'
import './style.css'

const mount = document.querySelector<HTMLDivElement>('#discovery-lab')!
mount.innerHTML = `
  <header class="lab-header">
    <a class="brand" href="/#/ar-lab" aria-label="MagikLayout AR Lab">Magik<em>Layout</em></a>
    <span class="header-divider" aria-hidden="true">/</span><span class="header-name">Swing Discovery Lab</span>
    <a class="back-link" href="/#/ar-lab">← All AR labs</a>
  </header>
  <main class="lab-main">
    <section class="lab-intro" aria-labelledby="lab-title">
      <div><p class="intro-note">JAVA SWING, ONE PIECE AT A TIME</p><h1 id="lab-title">Make your first interface tangible.</h1>
      <p>See what a component does. Put it in a window. Let the code follow.</p></div>
      <div class="progress"><span id="progress-text">0 of 5 activities explored</span><progress id="progress" max="5" value="0" aria-label="Activities explored"></progress></div>
    </section>
    <nav class="lesson-rail" aria-label="Learning activities">${LESSONS.map((l, i) => `<button data-lesson="${l.id}" aria-pressed="${i === 0}"><span class="lesson-number">0${i + 1}</span><span>${l.short}</span><span class="lesson-check" aria-hidden="true"></span></button>`).join('')}</nav>
    <section class="workspace" aria-label="Interactive Swing learning workspace">
      <div class="visual-column">
        <div class="pane-heading"><span id="activity-title">Component Recognition</span><span id="mode-status" class="mode-status">3D preview · camera off</span></div>
        <div class="scene-wrap" id="scene-wrap">
          <iframe id="scene" title="Interactive 3D Swing components" src="/swing-ar/scene.html" allow="camera; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe>
          <div id="scene-loading" class="scene-loading" role="status">Preparing your 3D component…</div>
          <div class="scene-top"><span class="scene-label" id="scene-label">JButton</span><button id="camera-toggle" class="camera-button">◉ Start AR camera</button></div>
          <div class="scene-bottom"><span id="scene-hint">Drag to turn · Tap to explore</span><button id="view-reset" aria-label="Reset the 3D view">↺ Reset view</button></div>
        </div>
        <div class="view-controls">
          <label>Turn <input id="rotation" type="range" min="-180" max="180" value="-12" aria-label="Rotate 3D view"><output id="rotation-value">−12°</output></label>
          <label>View size <input id="scale" type="range" min="60" max="160" value="100" aria-label="Scale 3D view"><output id="scale-value">100%</output></label>
        </div>
        <div id="component-switch" class="component-switch"><span id="piece-count">Piece 1 of 5</span><button id="next-component" class="next-button">Next Component <span aria-hidden="true">→</span></button></div>
        <div id="activity-controls" class="activity-controls"></div>
        <section class="teaching-strip" aria-label="Learning feedback"><span class="teaching-symbol" aria-hidden="true">↳</span><div><strong id="feedback-title">Small action. Real understanding.</strong><p id="feedback" role="status" aria-live="polite"></p></div></section>
      </div>
      <section class="code-column" aria-label="Live Java code">
        <div class="pane-heading"><span><span class="java-mark">J</span> MyApp.java</span><div class="code-actions"><button id="copy-code">Copy</button><button id="download-code" aria-label="Download MyApp.java">↓ Save</button></div></div>
        <div class="code-summary"><span id="code-status">Your actions become Java.</span><button id="toggle-code">Hide code</button></div>
        <div class="editor-wrap"><pre id="code-fallback" tabindex="0" aria-label="Generated Java source"></pre><div id="monaco-editor" aria-label="Monaco Java editor" hidden></div>
          <div id="code-cover" class="code-cover" hidden><span class="code-cover-icon" aria-hidden="true">{ }</span><h2>First, see what happens.</h2><p id="code-cover-text">Try the activity. Reveal the Java when you are ready.</p><button id="reveal-code" class="primary">Reveal the Java</button></div>
        </div>
        <div class="code-footer"><span id="editor-status">Readable Java preview</span><span>Java · Swing</span></div>
      </section>
    </section>
    <section class="component-library" aria-labelledby="library-title"><div class="section-heading"><div><h2 id="library-title">Five pieces. A whole interface.</h2><p>Choose a piece to see what it is for.</p></div></div>
      <div class="component-list">${COMPONENTS.map((c, i) => `<button data-component="${i}" aria-pressed="${i === 0}"><span class="component-drawing drawing-${c.type}" aria-hidden="true">${c.type === 'JTextField' ? 'Type here |' : c.type === 'JPanel' ? '□  □' : c.type === 'JFrame' ? '−  □  ×' : c.type === 'JLabel' ? 'Your name' : 'Click Me'}</span><strong>${c.type}</strong><span>${c.name}</span></button>`).join('')}</div>
    </section>
    <details class="marker-help"><summary>Bring it onto your desk <span>Print a Hiro marker & setup tips</span></summary><div class="marker-content"><img src="/swing-ar/hiro.png" alt="Hiro marker: a black square border surrounding the Hiro symbol" width="180" height="180"><div><h3>One marker is all you need.</h3><ol><li>Print the Hiro marker, or open it on a second screen.</li><li>Open this lab on your phone and tap <strong>Start AR camera</strong>.</li><li>Allow the camera. Keep the whole marker in view in even light.</li><li>Tap <strong>Next Component</strong>. The same marker shows the next piece.</li></ol><a href="/swing-ar/marker.html" target="_blank" rel="noreferrer">Open printable worksheet ↗</a><p class="muted">Use an HTTPS link on your phone. Camera permission is requested only when you start AR. If tracking is difficult, switch back to the 3D preview and keep learning.</p></div></div></details>
    <footer class="lab-footer"><span>A small step before your first line of Java.</span><span>MagikLayout · Free component library</span></footer>
  </main>`

const get = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
let state = initialState()
let mode: 'preview' | 'ar' = 'preview'
let sceneReady = false
let cameraMessage = ''
let loadTimer: ReturnType<typeof setTimeout>
const frame = get<HTMLIFrameElement>('scene')
const fallback = get<HTMLPreElement>('code-fallback')
interface Editor {
  getValue(): string; setValue(value: string): void; dispose(): void;
  deltaDecorations(old: string[], decorations: { range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; options: { isWholeLine: boolean; className: string } }[]): string[];
  revealLineInCenter(line: number): void
}
let editor: Editor | undefined
let decorations: string[] = []
let flashTimer: ReturnType<typeof setTimeout>
const sendScene = () => {
  if (sceneReady) frame.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'state', state: sceneFor(state) }, location.origin)
}
function dispatch(action: Action) {
  state = update(state, action)
  render(!['rotation', 'scale', 'width'].includes(action.type))
  if (action.type === 'tap' && state.lesson === 'events' && state.listener) flashListener()
}
function render(controls = true) {
  const component = COMPONENTS[state.component]
  const lesson = LESSONS.find(l => l.id === state.lesson)!
  get('activity-title').textContent = lesson.title
  get('scene-label').textContent = state.lesson === 'recognition' ? component.type : 'My App · JFrame'
  get('feedback').textContent = state.feedback
  get('feedback-title').textContent = state.lesson === 'recognition' ? component.analogy : lesson.title
  get('progress-text').textContent = `${state.completed.length} of 5 activities explored`
  get<HTMLProgressElement>('progress').value = state.completed.length
  document.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lesson === state.lesson))
    b.querySelector('.lesson-check')!.textContent = state.completed.includes(b.dataset.lesson as Lesson) ? '✓' : ''
  })
  document.querySelectorAll<HTMLButtonElement>('[data-component]').forEach(b => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.component) === state.component))
    b.disabled = !['recognition', 'build'].includes(state.lesson) || (state.lesson === 'build' && Number(b.dataset.component) === 3)
  })
  get<HTMLButtonElement>('next-component').disabled = !['recognition', 'build'].includes(state.lesson)
  get('component-switch').hidden = !['recognition', 'build'].includes(state.lesson)
  get('piece-count').textContent = `${component.type} · Piece ${state.component + 1} of 5`
  get('scene-hint').textContent = mode === 'ar' ? 'Keep the full Hiro marker in view' : state.lesson === 'build' ? 'Drag the selected piece to a region · Or tap a region' : 'Drag to turn · Tap to explore'
  get<HTMLButtonElement>('copy-code').disabled = !state.revealed
  get<HTMLButtonElement>('download-code').disabled = !state.revealed
  get('code-cover').hidden = state.revealed
  get('toggle-code').textContent = state.revealed ? 'Hide code' : 'Show code'
  const locked = state.lesson === 'build' && !state.buildPassed
  get<HTMLButtonElement>('toggle-code').disabled = locked
  get('reveal-code').hidden = locked
  get('code-cover-text').textContent = locked ? 'Match the target and check your build. Your Java appears when the structure matches.' : 'Try the activity. Reveal the Java when you are ready.'
  get('code-status').textContent = state.lesson === 'recognition' && !state.placed && state.component !== 3 ? 'Create the piece, then connect it with add().' : 'Generated from your current interface.'
  get<HTMLInputElement>('rotation').value = String(state.rotation)
  get('rotation-value').textContent = `${Math.round(state.rotation)}°`
  get<HTMLInputElement>('scale').value = String(state.scale * 100)
  get('scale-value').textContent = `${Math.round(state.scale * 100)}%`
  const code = javaFor(state)
  fallback.textContent = code
  if (editor && editor.getValue() !== code) editor.setValue(code)
  if (controls) renderControls()
  else { const output = document.getElementById('width-value'); if (output) output.textContent = `${state.width} px` }
  sendScene()
}
function renderControls() {
  const active = get('activity-controls').contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.action : undefined
  let html = ''
  if (state.lesson === 'recognition') html = `<div><strong>${COMPONENTS[state.component].name}</strong><p>${COMPONENTS[state.component].prompt}</p></div><button class="primary" data-action="place" ${state.placed || state.component === 3 ? 'disabled' : ''}>${state.component === 3 ? 'This is the outer window' : state.placed ? 'Placed in the frame ✓' : 'Place in JFrame'}</button>`
  if (state.lesson === 'layouts') html = `<div><strong>Who arranges the pieces?</strong><p>The layout manager does. Try both, then make the window narrower.</p></div><div class="segmented" role="group" aria-label="Layout manager"><button data-layout="flow" aria-pressed="${state.layout === 'flow'}">FlowLayout</button><button data-layout="border" aria-pressed="${state.layout === 'border'}">BorderLayout</button></div><label class="width-control">Window width <input id="width" type="range" min="260" max="600" step="10" value="${state.width}"><output id="width-value">${state.width} px</output></label>`
  if (state.lesson === 'build') html = `<div class="build-guidance"><div class="target-ui" role="img" aria-label="Target window: My App label in NORTH, text field in CENTER, Click Me button in SOUTH"><span>Target · My App</span><strong>My App</strong><div class="target-field"></div><div class="target-button">Click Me</div></div><div><strong>Match this small window.</strong><p>Choose a component below. Tap a region in the scene to place it.</p><div class="placement"><label for="region">Or choose a region</label><select id="region">${REGIONS.map(r => `<option>${r}</option>`).join('')}</select><button data-action="place">Place ${COMPONENTS[state.component].type}</button></div></div></div><div class="activity-buttons"><button class="primary" data-action="check">Check my build</button><button data-action="reset">Start again</button></div>`
  if (state.lesson === 'debug') html = `<div><strong>Where did Save go?</strong><p>${state.repaired ? 'The panel gives both buttons a place. The Java shows the repair.' : 'Two buttons, one SOUTH region. Inspect the scene before fixing it.'}</p></div><div class="activity-buttons"><button data-action="inspect" ${state.inspected ? 'disabled' : ''}>${state.inspected ? 'SOUTH inspected ✓' : 'Inspect SOUTH'}</button><button class="primary" data-action="repair" ${!state.inspected || state.repaired ? 'disabled' : ''}>${state.repaired ? 'Repaired ✓' : 'Group in a JPanel'}</button><button data-action="reset">Try again</button></div>`
  if (state.lesson === 'events') html = `<div><strong>${state.listener ? 'A listener is ready.' : 'A button needs a listener.'}</strong><p>${state.listener ? 'Tap the 3D button and watch the label change. The responding lines light up in Java.' : 'Try the 3D button first. Then give it a job with an ActionListener.'}</p></div><div class="activity-buttons"><button class="primary" data-action="listener" ${state.listener ? 'disabled' : ''}>${state.listener ? 'Listener connected ✓' : 'Connect ActionListener'}</button><button data-action="tap">Press the button</button><button data-action="reset">Start again</button></div>`
  get('activity-controls').innerHTML = html
  if (active) {
    const replacement = get('activity-controls').querySelector<HTMLButtonElement>(`[data-action="${active}"]:not(:disabled)`) ?? get('activity-controls').querySelector<HTMLButtonElement>('button:not(:disabled)')
    replacement?.focus({ preventScroll: true })
  }
}
mount.addEventListener('click', e => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>('button')
  if (!button || button.disabled) return
  if (button.dataset.lesson) dispatch({ type: 'lesson', lesson: button.dataset.lesson as Lesson })
  if (button.dataset.component) dispatch({ type: 'component', index: Number(button.dataset.component) })
  if (button.dataset.layout) dispatch({ type: 'layout', layout: button.dataset.layout as 'flow' | 'border' })
  if (button.dataset.action === 'place') dispatch({ type: 'place', region: get<HTMLSelectElement>('region')?.value as typeof REGIONS[number] | undefined })
  else if (button.dataset.action) dispatch({ type: button.dataset.action } as Action)
})
mount.addEventListener('input', e => {
  const input = e.target as HTMLInputElement
  if (input.id === 'rotation' || input.id === 'width') dispatch({ type: input.id, value: Number(input.value) })
  if (input.id === 'scale') dispatch({ type: 'scale', value: Number(input.value) / 100 })
})
get('next-component').addEventListener('click', () => {
  let next = (state.component + 1) % COMPONENTS.length
  if (state.lesson === 'build' && next === 3) next = 4
  dispatch({ type: 'component', index: next })
})
get('view-reset').addEventListener('click', () => { dispatch({ type: 'rotation', value: -12 }); dispatch({ type: 'scale', value: 1 }) })
for (const id of ['toggle-code', 'reveal-code']) get(id).addEventListener('click', () => dispatch({ type: 'reveal' }))
get('copy-code').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(javaFor(state)); get('editor-status').textContent = 'Java copied' }
  catch { fallback.hidden = false; const r = document.createRange(); r.selectNodeContents(fallback); const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r); fallback.focus(); get('editor-status').textContent = 'Select the Java and use your browser’s Copy command.' }
})
get('download-code').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([javaFor(state)], { type: 'text/x-java-source' }))
  const a = document.createElement('a'); a.href = url; a.download = 'MyApp.java'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
})
function armTimeout() {
  clearTimeout(loadTimer)
  loadTimer = setTimeout(() => {
    if (!sceneReady) {
      get('scene-loading').textContent = 'The 3D library could not load. Check your connection, then use Retry 3D.'
      get('scene-loading').hidden = false
      get('camera-toggle').textContent = '↻ Retry 3D'
    }
  }, 20000)
}
function setMode(next: 'preview' | 'ar') {
  frame.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'stop' }, location.origin)
  mode = next; sceneReady = false
  get('scene-loading').textContent = mode === 'ar' ? 'Starting the camera. Allow access when your browser asks…' : 'Preparing your 3D component…'
  get('scene-loading').hidden = false
  get('camera-toggle').textContent = mode === 'ar' ? '◉ Stop camera' : '◉ Start AR camera'
  get('mode-status').textContent = mode === 'ar' ? 'Starting camera…' : '3D preview · camera off'
  get('scene-hint').textContent = mode === 'ar' ? 'Keep the full Hiro marker in view' : 'Drag to turn · Tap to explore'
  frame.src = `/swing-ar/scene.html?mode=${mode}`
  armTimeout()
}
get('camera-toggle').addEventListener('click', () => {
  if (!sceneReady && mode === 'preview') { setMode('preview'); return }
  if (mode === 'ar') { setMode('preview'); return }
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    get('feedback').textContent = 'Open this lab through HTTPS in Safari or Chrome to use the camera. You can keep exploring in 3D here.'; return
  }
  cameraMessage = ''; setMode('ar')
})
window.addEventListener('message', e => {
  if (e.source !== frame.contentWindow || e.origin !== location.origin || e.data?.channel !== 'swing-discovery') return
  const data = e.data
  if (data.type === 'ready' && data.mode === mode) {
    sceneReady = true; clearTimeout(loadTimer); get('scene-loading').hidden = true; sendScene()
  } else if (data.type === 'camera-ready' && mode === 'ar') get('mode-status').textContent = 'Camera on · find the Hiro marker'
  else if (data.type === 'tracking' && mode === 'ar') get('mode-status').textContent = data.found ? 'Hiro found · component anchored' : 'Camera on · find the Hiro marker'
  else if (data.type === 'camera-error' && mode === 'ar') {
    cameraMessage = data.name === 'NotAllowedError' ? 'Camera access was not allowed. Enable it in your browser’s site settings and try again, or keep using 3D preview.' : 'The camera could not start. Close other camera apps, check browser permissions, and try again. 3D preview is available.'
    setMode('preview'); get('feedback').textContent = cameraMessage
  } else if (data.type === 'model-error' || data.type === 'load-error') {
    sceneReady = false; clearTimeout(loadTimer)
    get('feedback').textContent = 'The 3D scene could not load. Check your connection and use Retry 3D. The Java and activity controls remain available.'
    frame.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'stop' }, location.origin)
    mode = 'preview'; get('mode-status').textContent = '3D unavailable · camera off'; get('camera-toggle').textContent = '↻ Retry 3D'
  }
  else if (data.type === 'rotate' && Number.isFinite(data.value)) dispatch({ type: 'rotation', value: data.value })
  else if (data.type === 'scale' && Number.isFinite(data.value)) dispatch({ type: 'scale', value: data.value })
  else if (data.type === 'place' && REGIONS.includes(data.region)) dispatch({ type: 'place', region: data.region })
  else if (data.type === 'tap') {
    if (state.lesson === 'debug') dispatch({ type: 'inspect' })
    else dispatch({ type: 'tap' })
  }
})
function flashListener() {
  if (!editor || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const line = javaFor(state).split('\n').findIndex(l => l.includes('addActionListener')) + 1
  if (line < 1) return
  decorations = editor.deltaDecorations(decorations, [{ range: { startLineNumber: line, startColumn: 1, endLineNumber: line + 2, endColumn: 1 }, options: { isWholeLine: true, className: 'event-code-flash' } }])
  editor.revealLineInCenter(line); clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { if (editor) decorations = editor.deltaDecorations(decorations, []) }, 1400)
}

// Pin the CDN build; keep readable, copyable source available if it is blocked.
const MONACO = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
type MonacoWindow = Window & {
  require?: { (dependencies: string[], ready: () => void, error: () => void): void; config(options: unknown): void };
  monaco?: { editor: { create(element: HTMLElement, options: unknown): Editor } };
  MonacoEnvironment?: { getWorkerUrl(): string }
}
const browser = window as MonacoWindow
const workerURL = URL.createObjectURL(new Blob([`self.MonacoEnvironment={baseUrl:'${MONACO}/../'};importScripts('${MONACO}/base/worker/workerMain.js');`], { type: 'text/javascript' }))
browser.MonacoEnvironment = { getWorkerUrl: () => workerURL }
const loader = document.createElement('script'); loader.src = `${MONACO}/loader.js`; loader.async = true
loader.onload = () => {
  if (!browser.require) return
  browser.require.config({ paths: { vs: MONACO } })
  browser.require(['vs/editor/editor.main'], () => {
    if (!browser.monaco) return
    const host = get('monaco-editor'); host.hidden = false
    editor = browser.monaco.editor.create(host, { value: javaFor(state), language: 'java', theme: 'vs', readOnly: true,
      automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineHeight: 22, scrollBeyondLastLine: false,
      wordWrap: 'off', lineNumbersMinChars: 3, folding: false, renderLineHighlight: 'none', overviewRulerLanes: 0, hideCursorInOverviewRuler: true,
      padding: { top: 20 }, ariaLabel: 'Live Java Swing code. Read only. Use Copy to take it to your IDE.' })
    fallback.hidden = true; get('editor-status').textContent = 'Monaco · live Java preview'
  }, () => { get('editor-status').textContent = 'Monaco unavailable · Java preview ready' })
}
loader.onerror = () => { get('editor-status').textContent = 'Monaco unavailable · Java preview ready' }
document.head.append(loader)
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'ar') setMode('preview') })
window.addEventListener('pagehide', () => {
  frame.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'stop' }, location.origin)
  clearTimeout(loadTimer); clearTimeout(flashTimer)
})
window.addEventListener('pageshow', e => { if (e.persisted) setMode('preview') })
render(); armTimeout()
