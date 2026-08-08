import { useEffect, useMemo, useRef, useState } from 'react'
import { generateJava } from '../codegen/javaCode'
import { CodePanel } from '../components/CodePanel'
import { SurfaceNav } from '../components/SurfaceNav'
import { ARCameraExperience } from './ARCameraExperience'
import { applyARInteraction, buildMissionTree, type ARInteraction, type ARVisualState, type LabLanguage, type MissionId } from './arLabModel'
import './arLab.css'

const COPY = {
  en: {
    title: 'BorderLayout AR Prototype Lab',
    kicker: 'NOSS-aligned immersive module · 15–20 minutes',
    intro: 'Make an invisible Java layout algorithm visible on your desk. Build, resize, diagnose, and connect every AR action to real Java code.',
    start: 'Begin AR module',
    outcomes: 'You will learn to',
    mission: 'Mission',
    targetFound: 'Target found — the virtual JFrame is anchored.',
    targetLost: 'Point the camera at the target card.',
    speak: 'Hear instruction',
    next: 'Next mission',
    complete: 'Module complete',
    targetLabel: 'AR target card',
    targetHelp: 'Open this target on a second screen or print it on A4 paper. Your iPhone camera anchors the virtual JFrame to it.',
    targetOpen: 'Open target card',
    completeNote: 'You constructed, tested, and diagnosed a BorderLayout prototype.',
    arAction: 'Required AR action',
    hints: {
      place: 'Tap a region on the tracked 3D model to place the title.',
      resize: 'Tap the 3D region that should absorb the extra width.',
      reveal: 'Tap SOUTH in the 3D model to activate X-ray mode.',
      repair: 'Tap the glowing yellow repair control in AR.',
      complete: 'AR repair complete.',
    },
  },
  ms: {
    title: 'Makmal Prototaip AR BorderLayout',
    kicker: 'Modul imersif sejajar NOSS · 15–20 minit',
    intro: 'Jadikan algoritma susun atur Java yang tidak kelihatan dapat dilihat di atas meja. Bina, ubah saiz, diagnosis dan hubungkan setiap tindakan AR kepada kod Java sebenar.',
    start: 'Mulakan modul AR',
    outcomes: 'Anda akan belajar untuk',
    mission: 'Misi',
    targetFound: 'Sasaran ditemui — JFrame maya telah ditambat.',
    targetLost: 'Halakan kamera kepada kad sasaran.',
    speak: 'Dengar arahan',
    next: 'Misi seterusnya',
    complete: 'Modul selesai',
    targetLabel: 'Kad sasaran AR',
    targetHelp: 'Buka sasaran ini pada skrin kedua atau cetak pada kertas A4. Kamera iPhone akan menambat JFrame maya kepadanya.',
    targetOpen: 'Buka kad sasaran',
    completeNote: 'Anda telah membina, menguji dan mendiagnosis prototaip BorderLayout.',
    arAction: 'Tindakan AR diperlukan',
    hints: {
      place: 'Sentuh kawasan pada model 3D yang dijejak untuk meletakkan tajuk.',
      resize: 'Sentuh kawasan 3D yang patut menyerap lebar tambahan.',
      reveal: 'Sentuh SOUTH pada model 3D untuk mengaktifkan mod X-ray.',
      repair: 'Sentuh kawalan pembaikan kuning yang bercahaya dalam AR.',
      complete: 'Pembaikan AR selesai.',
    },
  },
} as const

const MISSION_COPY = {
  en: {
    1: { title: 'Place the application title', prompt: 'A title should remain across the top of the interface. Select its BorderLayout region.', lesson: 'NORTH spans the frame width and keeps its preferred height.' },
    2: { title: 'Predict the resize', prompt: 'The JFrame becomes wider. Which region absorbs the remaining horizontal space?', lesson: 'CENTER absorbs the remaining space after the edge regions receive their preferred sizes.' },
    3: { title: 'Diagnose the disappearing button', prompt: 'Save and Cancel were both added to SOUTH, but only Cancel is visible. Identify the cause, reveal the hidden button, then choose the correct structural fix.', lesson: 'A BorderLayout region displays only its last component. A nested JPanel lets multiple buttons share SOUTH.' },
  },
  ms: {
    1: { title: 'Letakkan tajuk aplikasi', prompt: 'Tajuk perlu kekal merentasi bahagian atas antaramuka. Pilih kawasan BorderLayout yang betul.', lesson: 'NORTH merentasi lebar bingkai dan mengekalkan ketinggian pilihannya.' },
    2: { title: 'Ramalkan perubahan saiz', prompt: 'JFrame menjadi lebih lebar. Kawasan manakah yang menyerap baki ruang mendatar?', lesson: 'CENTER menyerap baki ruang selepas kawasan tepi menerima saiz pilihan masing-masing.' },
    3: { title: 'Diagnosis butang yang hilang', prompt: 'Save dan Cancel ditambah ke SOUTH, tetapi hanya Cancel kelihatan. Kenal pasti punca, dedahkan butang tersembunyi, kemudian pilih pembetulan struktur yang betul.', lesson: 'Satu kawasan BorderLayout hanya memaparkan komponen terakhir. JPanel bersarang membolehkan beberapa butang berkongsi SOUTH.' },
  },
} as const

const OUTCOMES = {
  en: ['Identify the five BorderLayout regions.', 'Predict resize behaviour.', 'Construct and test a Java UI prototype.', 'Diagnose duplicate-region collisions.', 'Relate the prototype to generated Java.'],
  ms: ['Mengenal pasti lima kawasan BorderLayout.', 'Meramal tingkah laku perubahan saiz.', 'Membina dan menguji prototaip UI Java.', 'Mendiagnosis konflik kawasan berganda.', 'Menghubungkan prototaip dengan kod Java yang dijana.'],
}

export function ARLab() {
  const [language, setLanguage] = useState<LabLanguage>('en')
  const [started, setStarted] = useState(false)
  const [mission, setMission] = useState<MissionId>(1)
  const [targetFound, setTargetFound] = useState(false)
  const [visual, setVisual] = useState<ARVisualState>({ mission: 1 })
  const [feedback, setFeedback] = useState<string | null>(null)
  const [missionPassed, setMissionPassed] = useState(false)
  const [completed, setCompleted] = useState<Set<MissionId>>(() => new Set())
  const missionPanelRef = useRef<HTMLElement>(null)
  const copy = COPY[language]
  const task = MISSION_COPY[language][mission]
  const interactionHint = mission === 1
    ? copy.hints.place
    : mission === 2
      ? copy.hints.resize
      : visual.collisionFixed
        ? copy.hints.complete
        : visual.collisionRevealed
          ? copy.hints.repair
          : copy.hints.reveal
  const code = useMemo(() => generateJava(buildMissionTree(visual), { width: 480, height: 340 }).code, [visual])

  useEffect(() => {
    missionPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [mission])

  const say = () => {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(`${task.title}. ${task.prompt}`)
    utterance.lang = language === 'ms' ? 'ms-MY' : 'en-MY'
    speechSynthesis.speak(utterance)
  }

  const handleARInteraction = (interaction: ARInteraction) => {
    const result = applyARInteraction(visual, interaction)
    setVisual(result.visual)
    if (result.status === 'passed') {
      setMissionPassed(true)
      setCompleted((current) => new Set(current).add(mission))
      setFeedback(task.lesson)
      return
    }
    setMissionPassed(false)
    if (result.status === 'progress') {
      setFeedback(language === 'ms'
        ? 'Betul. Mod X-ray mendedahkan butang Save di bawah Cancel. Sekarang sentuh kawalan pembaikan kuning.'
        : 'Correct. X-ray mode reveals Save beneath Cancel. Now tap the glowing yellow repair control.')
      return
    }
    const incorrect = mission === 1
      ? language === 'ms' ? 'Belum tepat. Sentuh kawasan yang merentasi bahagian atas.' : 'Not yet. Tap the region spanning the top edge.'
      : mission === 2
        ? language === 'ms' ? 'Cuba lagi. Kawasan tepi menerima saiz pilihan dahulu.' : 'Try again. The edge regions receive their preferred sizes first.'
        : language === 'ms' ? 'Ikut petunjuk AR dan sentuh objek yang diserlahkan.' : 'Follow the AR cue and tap the highlighted object.'
    setFeedback(incorrect)
  }

  const nextMission = () => {
    if (mission >= 3) return
    const next = (mission + 1) as MissionId
    setMission(next)
    setVisual({ mission: next })
    setMissionPassed(false)
    setFeedback(null)
  }

  if (!started) {
    return (
      <div className="ar-lab ar-lab-intro">
        <header className="app-header">
          <h1 className="wordmark">Layout<em>Lab</em> <span>AR</span></h1>
          <SurfaceNav current="ar" />
          <div className="ar-lang" role="group" aria-label="Language">
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button className={language === 'ms' ? 'active' : ''} onClick={() => setLanguage('ms')}>BM</button>
          </div>
        </header>
        <main className="ar-intro-main">
          <div className="ar-intro-copy">
            <p className="ar-eyebrow">{copy.kicker}</p>
            <h2>{copy.title}</h2>
            <p className="ar-lead">{copy.intro}</p>
            <dl className="ar-noss">
              <div><dt>NOSS</dt><dd>IT-010-3:2016 · Pembangunan Aplikasi · Tahap 3</dd></div>
              <div><dt>CU</dt><dd>IT-010-3:2016-C01 · Application Prototype Development</dd></div>
              <div><dt>Work Activity</dt><dd>Implement Application Prototype Mock-Up Flow</dd></div>
            </dl>
            <h3>{copy.outcomes}</h3>
            <ol>{OUTCOMES[language].map((outcome) => <li key={outcome}>{outcome}</li>)}</ol>
            <button type="button" className="ar-primary" onClick={() => setStarted(true)}>{copy.start}</button>
          </div>
          <aside className="ar-target-card">
            <span>{copy.targetLabel}</span>
            <img src="/ar/layoutlab-target.png" alt="Image-tracking target card for the LayoutLab AR activity" />
            <p>{copy.targetHelp}</p>
            <a href="/ar/layoutlab-target.png" target="_blank" rel="noreferrer">{copy.targetOpen}</a>
          </aside>
        </main>
      </div>
    )
  }

  return (
    <div className="ar-lab ar-lab-session">
      <header className="ar-session-header">
        <a href="#/ar-lab" onClick={() => setStarted(false)} aria-label="Exit AR module">←</a>
        <div><strong>{copy.mission} {mission}/3</strong><span>{task.title}</span></div>
        <span className="ar-score">{completed.size}/3</span>
      </header>
      <ARCameraExperience visual={visual} onTargetState={setTargetFound} onInteraction={handleARInteraction} interactionHint={interactionHint} />
      <section ref={missionPanelRef} className="ar-mission-panel" aria-live="polite">
        <div className={`ar-tracking ${targetFound ? 'found' : ''}`}>{targetFound ? copy.targetFound : copy.targetLost}</div>
        <div className="ar-mission-title"><div><span>{copy.mission} {mission}</span><h2>{task.title}</h2></div><button type="button" onClick={say}>🔊 {copy.speak}</button></div>
        <p>{task.prompt}</p>
        <div className={`ar-required-action ${targetFound ? 'ready' : ''}`}><strong>{copy.arAction}</strong><span>{interactionHint}</span></div>
        {feedback && <div className={`ar-feedback ${missionPassed ? 'pass' : ''}`}>{feedback}</div>}
        {missionPassed && mission < 3 && <button type="button" className="ar-primary ar-next" onClick={nextMission}>{copy.next}</button>}
        {missionPassed && mission === 3 && <div className="ar-complete"><strong>{copy.complete}: 3/3</strong><p>{copy.completeNote}</p></div>}
        <details className="ar-code"><summary>Java evidence — generated from this AR state</summary><CodePanel code={code} selectedVar={null} /></details>
      </section>
    </div>
  )
}
