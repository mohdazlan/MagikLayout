import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { BorderRegion } from '../engine/types'
import type { ARVisualState } from './arLabModel'

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
    const mesh = labelledPlate(region, region, visual.mission === 1 ? 0.72 : 0.45)
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
    if (visual.collisionRevealed && !visual.collisionFixed) {
      save.position.x -= 0.05
      save.material = (save.material as THREE.MeshBasicMaterial).clone()
      ;(save.material as THREE.MeshBasicMaterial).wireframe = true
    }
    group.add(cancel)
  }

  return animated
}

export function ARCameraExperience({
  visual,
  onTargetState,
}: {
  visual: ARVisualState
  onTargetState: (found: boolean) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<{ instance: MindARInstance; anchor: MindARAnchor; animated: THREE.Mesh[]; start: number } | null>(null)
  const [status, setStatus] = useState<'ready' | 'starting' | 'running' | 'error'>('ready')

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
      const runtime = { instance, anchor, animated: rebuildScene(anchor.group, visual), start: performance.now() }
      anchor.onTargetFound = () => onTargetState(true)
      anchor.onTargetLost = () => onTargetState(false)
      runtimeRef.current = runtime
      await instance.start()
      instance.renderer.setAnimationLoop(() => {
        const t = Math.min(1, (performance.now() - runtime.start) / 900)
        runtime.animated.forEach((mesh) => {
          if (mesh.userData.animateResize) mesh.scale.x = 0.42 + 0.58 * (1 - Math.pow(1 - t, 3))
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
      <div className="ar-camera" ref={mountRef} aria-label="Camera view with tracked BorderLayout model" />
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
