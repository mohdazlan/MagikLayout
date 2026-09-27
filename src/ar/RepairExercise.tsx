import { useEffect, useRef, useState } from 'react'
import { generateJava } from '../codegen/javaCode'
import { emptyRepair, repairScene, repairStep, repairTree, type RepairAction } from './repairGame'
import './repairExercise.css'

export function RepairExercise({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState(emptyRepair)
  const [mode, setMode] = useState<'preview' | 'ar'>('preview')
  const [ready, setReady] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [intro, setIntro] = useState(false)
  const [seen, setSeen] = useState(false)
  const [selected, setSelected] = useState<RepairAction | null>(null)
  const [feedback, setFeedback] = useState('Watch the bug, then rebuild the button container.')
  const [width, setWidth] = useState(400)
  const [prediction, setPrediction] = useState(false)
  const frame = useRef<HTMLIFrameElement>(null)
  const current = useRef({ state, intro, selected, mode, tracked })
  current.current = { state, intro, selected, mode, tracked }
  const active = ready && (mode === 'preview' || tracked)
  function act(action: RepairAction) {
    const c = current.current
    if (c.intro || (c.mode === 'ar' && !c.tracked)) return
    const next = repairStep(c.state, action)
    if (next === c.state) { setFeedback('Build a panel, set FlowLayout, and move both buttons inside before placing it in SOUTH.'); return }
    setState(next); setSelected(null)
    setFeedback(next.placed ? 'Repaired: SOUTH now holds one JPanel containing both buttons.' : action === 'panel' ? 'Panel created. Tap it to choose its layout.' : action === 'flow' ? 'FlowLayout selected. Select a button from the inventory, then tap the panel.' : 'Button placed inside JPanel. Add the other button, then select the panel and tap SOUTH.')
  }
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'state', state: repairScene(state, width, intro) }, location.origin)
  }, [state, ready, width, intro])
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.channel !== 'swing-discovery') return
      const d = e.data, c = current.current
      if (d.type === 'ready' && d.mode === c.mode) setReady(true)
      if (d.type === 'tracking') setTracked(d.found)
      if (d.type === 'bug-ready') { setIntro(false); setSeen(true); setFeedback('Two buttons were added to SOUTH. Cancel receives its layout; Submit is hidden. The squash was a teaching animation.') }
      if (d.type === 'repair-hit' && !c.intro) {
        if (d.piece === 'actions' && !c.state.flow) setSelected('flow')
        else if (d.piece === 'actions' && (c.selected === 'submit' || c.selected === 'cancel')) act(c.selected)
        else if (d.region === 'SOUTH' && c.selected === 'SOUTH') act('SOUTH')
      }
      if (['camera-error', 'load-error', 'model-error'].includes(d.type)) {
        setFeedback('Camera or 3D content could not load. Allow camera access in this browser and retry, or use 3D practice.'); setReady(false)
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])
  useEffect(() => {
    const stop = () => { frame.current?.contentWindow?.postMessage({ channel: 'swing-discovery', type: 'stop' }, location.origin) }
    const hide = () => { if (document.hidden) { stop(); setMode('preview'); setReady(false); setTracked(false); setIntro(false) } }
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', stop)
    return () => { stop(); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', stop) }
  }, [])
  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => setFeedback('Still loading. Check your connection and use Retry scene.'), 20000)
    return () => clearTimeout(timer)
  }, [ready, mode])
  const changeMode = () => { setReady(false); setTracked(false); setIntro(false); setMode(mode === 'ar' ? 'preview' : 'ar') }
  const hint = !seen ? '1 · Watch the collision' : !state.panel ? '2 · Add a JPanel' : !state.flow ? '3 · Choose FlowLayout' : !state.submit || !state.cancel ? '4 · Move both buttons into JPanel' : !state.placed ? '5 · Place JPanel in SOUTH' : '6 · Predict and test resizing'
  return <main className="repair-exercise">
    <button onClick={onExit}>← All AR exercises</button>
    <p className="ar-eyebrow">AR exercise 2 · Repair the missing button</p>
    <h1>One region. Two buttons.</h1>
    <p>Build a container for Submit and Cancel. Every placement changes the structure.</p>
    <details><summary>Use your iPhone camera</summary><p>Open this exercise in Safari on your phone. Display or print the Hiro marker on another screen. Tap Start AR camera here, allow access, and keep the complete square visible. The model follows the marker placed on your table.</p><a href="/swing-ar/hiro.png" target="_blank" rel="noreferrer">Open Hiro marker ↗</a><img src="/swing-ar/hiro.png" width="160" height="160" alt="Hiro tracking marker" /></details>
    <div className="repair-toolbar"><button onClick={changeMode}>{mode === 'ar' ? 'Stop camera · use 3D practice' : 'Start AR camera'}</button><span role="status">{!ready ? 'Loading scene…' : mode === 'preview' ? '3D practice · camera off' : tracked ? 'Hiro found · ready' : 'Find the complete Hiro marker'}</span>{!ready && <button onClick={() => { if (frame.current) frame.current.src = `/swing-ar/scene.html?mode=${mode}&retry=${Date.now()}` }}>Retry scene</button>}</div>
    <iframe ref={frame} className="repair-scene" src={`/swing-ar/scene.html?mode=${mode}`} allow="camera; fullscreen" title="Interactive AR button repair" />
    <h2>{hint}</h2><p role="status" aria-live="polite">{feedback}</p>
    <div className="repair-inventory" aria-label="AR inventory">
      {!seen && <button disabled={!active || intro} onClick={() => setIntro(true)}>{intro ? 'Watch the animation…' : 'Watch the bug'}</button>}
      {seen && !state.panel && <button disabled={!active} onClick={() => act('panel')}>Add JPanel</button>}
      {state.panel && !state.flow && <><label>Panel layout <select value={selected === 'flow' ? 'flow' : ''} onChange={e => setSelected(e.target.value === 'flow' ? 'flow' : null)}><option value="">Choose…</option><option value="border">BorderLayout</option><option value="flow">FlowLayout</option></select></label><button disabled={!active} onClick={() => selected === 'flow' ? act('flow') : setFeedback('Choose FlowLayout so both buttons can sit together in a row.')}>Set panel layout</button></>}
      {state.flow && !state.placed && <>{(['submit', 'cancel'] as const).map(id => <button key={id} disabled={state[id] || !active} aria-pressed={selected === id} onClick={() => setSelected(id)}>{id === 'submit' ? 'Submit' : 'Cancel'}{state[id] ? ' ✓' : ''}</button>)}{(selected === 'submit' || selected === 'cancel') && <button disabled={!active} onClick={() => act(selected)}>Place selected button in JPanel</button>}{state.submit && state.cancel && <><button aria-pressed={selected === 'SOUTH'} onClick={() => setSelected('SOUTH')}>Select JPanel</button>{selected === 'SOUTH' && <button disabled={!active} onClick={() => act('SOUTH')}>Place in SOUTH</button>}</>}</>}
    </div>
    {state.placed && <section><p>When the frame gets wider, what happens?</p><button onClick={() => setFeedback('FlowLayout keeps the preferred button sizes. Try the other prediction.')}>Both buttons stretch</button> <button onClick={() => { setPrediction(true); setFeedback('Correct. The SOUTH panel widens; its FlowLayout keeps the buttons at their preferred sizes and centres the row.') }}>The panel widens; buttons stay centred</button>{prediction && <label className="repair-width">Frame width: {width}px <input type="range" min="320" max="640" value={width} onChange={e => setWidth(Number(e.target.value))} /></label>}<details><summary>Java evidence · repaired structure</summary><pre>{generateJava(repairTree(state), { width, height: 270 }).code}</pre></details></section>}
    <button onClick={() => { setState(emptyRepair()); setSeen(false); setIntro(false); setSelected(null); setPrediction(false); setWidth(400); setFeedback('Watch the bug, then build your repair.') }}>Restart exercise</button>
  </main>
}
