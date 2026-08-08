import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import type { BorderRegion } from '../engine/types'
import type { ARInteraction, ARVisualState } from './arLabModel'

interface MindARAnchor {
  group: THREE.Group
  onTargetFound: (() => void) | null
  onTargetLost: (() => void) | null
}

interface MindARInstance {
  scene: THREE.Scene
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  addAnchor(index: number): MindARAnchor
  start(): Promise<void>
  stop(): void
}

interface MindARConstructor {
  new (options: Record<string, unknown>): MindARInstance
}

const REGION_GEOMETRY: Record<BorderRegion, { x: number; y: number; w: number; h: number }> = {
  NORTH: { x: 0, y: 0.205, w: 0.9, h: 0.14 },
  SOUTH: { x: 0, y: -0.205, w: 0.9, h: 0.14 },
  WEST: { x: -0.355, y: 0, w: 0.19, h: 0.27 },
  EAST: { x: 0.355, y: 0, w: 0.19, h: 0.27 },
  CENTER: { x: 0, y: 0, w: 0.5, h: 0.27 },
}

const REGION_COLORS: Record<BorderRegion, number> = {
  NORTH: 0x1c7ed6,
  SOUTH: 0x2f9e44,
  WEST: 0x7048e8,
  EAST: 0xd9480f,
  CENTER: 0xe8590c,
}

function textTexture(text: string, background: string, foreground = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = foreground
  ctx.font = '600 42px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function labelledPlate(region: BorderRegion, label: string = region, opacity = 0.86): THREE.Mesh {
  const r = REGION_GEOMETRY[region]
  const color = `#${REGION_COLORS[region].toString(16).padStart(6, '0')}`
  const material = new THREE.MeshBasicMaterial({
    map: textTexture(label, color),
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.h), material)
  mesh.position.set(r.x, r.y, 0.035)
  return mesh
}

function actionPlate(label: string): THREE.Mesh {
  const material = new THREE.MeshBasicMaterial({
    map: textTexture(label, '#f5b700', '#17202a'),
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.085), material)
  mesh.position.set(0, -0.335, 0.095)
  mesh.userData.interaction = { kind: 'repair-panel' } satisfies ARInteraction
  mesh.userData.pulseAction = true
  return mesh
}

function rebuildScene(group: THREE.Group, visual: ARVisualState): THREE.Mesh[] {
  while (group.children.length) {
    const child = group.children.pop()!
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (material instanceof THREE.MeshBasicMaterial) material.map?.dispose()
        material.dispose()
      })
    }
  }

  const animated: THREE.Mesh[] = []
  ;(['NORTH', 'SOUTH', 'WEST', 'EAST', 'CENTER'] as BorderRegion[]).forEach((region) => {
    const selected = visual.selectedRegion === region
    const mesh = labelledPlate(region, region, selected ? 0.95 : visual.mission === 1 ? 0.72 : 0.45)
    mesh.userData.interaction = { kind: 'region', region } satisfies ARInteraction
    group.add(mesh)
  })

  if (visual.placedRegion) {
    const title = labelledPlate(visual.placedRegion, 'JLabel: TITLE', 1)
    title.position.z = 0.065
    group.add(title)
  }

  if (visual.mission === 2 && visual.resizeRevealed) {
    const center = labelledPlate('CENTER', 'CENTER STRETCHES', 1)
    center.position.z = 0.075
    center.scale.x = 0.42
    center.userData.animateResize = true
    group.add(center)
    animated.push(center)
  }

  if (visual.mission === 3) {
    const save = labelledPlate('SOUTH', 'Save', visual.collisionRevealed ? 0.35 : 1)
    save.position.z = 0.07
    group.add(save)
    const cancel = labelledPlate('SOUTH', visual.collisionFixed ? 'JPanel: Save + Cancel' : 'Cancel', 1)
    cancel.position.z = visual.collisionFixed ? 0.09 : 0.085
    cancel.userData.interaction = visual.collisionRevealed
      ? ({ kind: 'region', region: 'SOUTH' } satisfies ARInteraction)
      : ({ kind: 'reveal-collision' } satisfies ARInteraction)
    if (visual.collisionRevealed && !visual.collisionFixed) {
      save.position.x -= 0.05
      save.material = (save.material as THREE.MeshBasicMaterial).clone()
      ;(save.material as THREE.MeshBasicMaterial).wireframe = true
    }
    group.add(cancel)
    if (visual.collisionRevealed && !visual.collisionFixed) {
      const repair = actionPlate('TAP: BUILD NESTED JPanel')
      group.add(repair)
      animated.push(repair)
    }
  }

  return animated
}

export function ARCameraExperience({
  visual,
  onTargetState,
  onInteraction,
  interactionHint,
}: {
  visual: ARVisualState
  onTargetState: (found: boolean) => void
  onInteraction: (interaction: ARInteraction) => void
  interactionHint: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<{ instance: MindARInstance; anchor: MindARAnchor; animated: THREE.Mesh[]; start: number; targetVisible: boolean } | null>(null)
  const interactionRef = useRef(onInteraction)
  const raycasterRef = useRef(new THREE.Raycaster())
  const pointerRef = useRef(new THREE.Vector2())
  const [status, setStatus] = useState<'ready' | 'starting' | 'running' | 'error'>('ready')

  useEffect(() => { interactionRef.current = onInteraction }, [onInteraction])

  useEffect(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    runtime.animated = rebuildScene(runtime.anchor.group, visual)
    runtime.start = performance.now()
  }, [visual])

  useEffect(() => () => {
    const runtime = runtimeRef.current
    runtime?.instance.renderer.setAnimationLoop(null)
    try { runtime?.instance.stop() } catch { /* camera may not have started */ }
    runtimeRef.current = null
  }, [])

  const tapTrackedObject = (event: ReactPointerEvent<HTMLDivElement>) => {
    const runtime = runtimeRef.current
    if (!runtime?.targetVisible) return
    const canvas = runtime.instance.renderer.domElement
    const rect = canvas.getBoundingClientRect()
    pointerRef.current.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycasterRef.current.setFromCamera(pointerRef.current, runtime.instance.camera)
    const hits = raycasterRef.current.intersectObjects(runtime.anchor.group.children, true)
    for (const hit of hits) {
      let object: THREE.Object3D | null = hit.object
      while (object && object !== runtime.anchor.group) {
        const interaction = object.userData.interaction as ARInteraction | undefined
        if (interaction) {
          interactionRef.current(interaction)
          return
        }
        object = object.parent
      }
    }
  }

  const start = async () => {
    if (!mountRef.current || status === 'starting' || status === 'running') return
    setStatus('starting')
    try {
      const module = await import('../vendor/mindar/mindar-image-three.prod.js') as unknown as { MindARThree: MindARConstructor }
      const instance = new module.MindARThree({
        container: mountRef.current,
        imageTargetSrc: '/ar/layoutlab-target.mind',
        maxTrack: 1,
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
        filterMinCF: 0.001,
        filterBeta: 0.01,
      })
      const anchor = instance.addAnchor(0)
      const runtime = { instance, anchor, animated: rebuildScene(anchor.group, visual), start: performance.now(), targetVisible: false }
      anchor.onTargetFound = () => {
        runtime.targetVisible = true
        onTargetState(true)
      }
      anchor.onTargetLost = () => {
        runtime.targetVisible = false
        onTargetState(false)
      }
      runtimeRef.current = runtime
      await instance.start()
      instance.renderer.setAnimationLoop(() => {
        const t = Math.min(1, (performance.now() - runtime.start) / 900)
        runtime.animated.forEach((mesh) => {
          if (mesh.userData.animateResize) mesh.scale.x = 0.42 + 0.58 * (1 - Math.pow(1 - t, 3))
          if (mesh.userData.pulseAction) {
            const pulse = 1 + 0.045 * Math.sin(performance.now() / 180)
            mesh.scale.set(pulse, pulse, 1)
          }
        })
        instance.renderer.render(instance.scene, instance.camera)
      })
      setStatus('running')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <div className="ar-camera-shell">
      <div className="ar-camera" ref={mountRef} onPointerUp={tapTrackedObject} aria-label="Interactive camera view with tracked BorderLayout model" />
      {status === 'running' && <div className="ar-touch-cue">◎ {interactionHint}</div>}
      {status !== 'running' && (
        <div className="ar-camera-start">
          <p>{status === 'error' ? 'Camera could not start. Check Safari camera permission and reload.' : 'Place the target card on a desk, then start the camera.'}</p>
          <button type="button" className="ar-primary" onClick={start} disabled={status === 'starting'}>
            {status === 'starting' ? 'Starting camera…' : status === 'error' ? 'Try camera again' : 'Start AR camera'}
          </button>
        </div>
      )}
    </div>
  )
}
