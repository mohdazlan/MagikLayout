import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { buildBorderLayoutScene, type RegionOccupant } from './buildLayoutScene'
import './ARDeskView.css'

interface ARDeskViewProps {
  /** current BorderLayout arrangement from the Playground, one entry per occupied region */
  occupants: RegionOccupant[]
  onClose: () => void
}

type SupportState = 'checking' | 'ar-supported' | 'ar-unsupported'

/**
 * Scope note: this view renders ONLY the active BorderLayout arrangement.
 * FlowLayout/GridLayout AR views are a follow-on, not part of this feature —
 * matching the "scoped to one layout manager" brief exactly.
 */
export function ARDeskView({ occupants, onClose }: ARDeskViewProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [support, setSupport] = useState<SupportState>('checking')
  const [placed, setPlaced] = useState(false)

  // Esc closes the overlay (keyboard parity with the ✕ button).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    const nav = navigator as Navigator & { xr?: XRSystem }
    if (nav.xr?.isSessionSupported) {
      nav.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => {
          if (!cancelled) setSupport(supported ? 'ar-supported' : 'ar-unsupported')
        })
        .catch(() => {
          if (!cancelled) setSupport('ar-unsupported')
        })
    } else {
      setSupport('ar-unsupported')
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (support === 'checking' || !mountRef.current) return
    const mount = mountRef.current

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, mount.clientWidth / mount.clientHeight, 0.01, 20)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
    scene.add(light)

    const plates = buildBorderLayoutScene(occupants)
    const group = new THREE.Group()
    plates.forEach((plate) => {
      const geometry = new THREE.BoxGeometry(plate.size.w, plate.size.h, plate.size.d)
      const material = new THREE.MeshStandardMaterial({ color: plate.colorHex })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(plate.position.x, plate.position.y, plate.position.z)
      group.add(mesh)
    })
    group.visible = false
    scene.add(group)

    let session: XRSession | null = null
    let hitTestSource: XRHitTestSource | null = null
    let localSpace: XRReferenceSpace | null = null
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.03, 0.035, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xe8590c }),
    )
    reticle.visible = false
    scene.add(reticle)

    function onSelect() {
      if (!reticle.visible) return
      group.position.setFromMatrixPosition(reticle.matrix)
      group.visible = true
      setPlaced(true)
    }

    async function startAR() {
      const nav = navigator as Navigator & { xr?: XRSystem }
      if (!nav.xr) return
      renderer.xr.enabled = true
      session = await nav.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
      })
      renderer.xr.setReferenceSpaceType('local')
      await renderer.xr.setSession(session)

      const viewerSpace = await session.requestReferenceSpace('viewer')
      hitTestSource = (await session.requestHitTestSource!({ space: viewerSpace })) ?? null
      localSpace = await session.requestReferenceSpace('local')

      session.addEventListener('select', onSelect)
      session.addEventListener('end', () => {
        hitTestSource = null
        setPlaced(false)
      })

      renderer.setAnimationLoop((_time, frame) => {
        if (frame && hitTestSource && localSpace) {
          const results = frame.getHitTestResults(hitTestSource)
          if (results.length > 0) {
            const pose = results[0].getPose(localSpace)
            if (pose) {
              reticle.visible = true
              reticle.matrix.fromArray(pose.transform.matrix)
            }
          } else {
            reticle.visible = false
          }
        }
        renderer.render(scene, camera)
      })
    }

    function startOrbitFallback() {
      camera.position.set(0, 0.25, 0.35)
      camera.lookAt(0, 0, 0)
      group.visible = true
      // Respect the user's motion preference — the app claims reduced-motion
      // support, so hold a fixed three-quarter angle instead of auto-rotating.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        group.rotation.y = 0.6
        renderer.render(scene, camera)
        return () => {}
      }
      group.rotation.y = 0
      let raf = 0
      const animate = () => {
        group.rotation.y += 0.006
        renderer.render(scene, camera)
        raf = requestAnimationFrame(animate)
      }
      animate()
      return () => cancelAnimationFrame(raf)
    }

    let stopFallback: (() => void) | undefined
    if (support === 'ar-supported') {
      startAR().catch(() => setSupport('ar-unsupported'))
    } else {
      stopFallback = startOrbitFallback()
    }

    return () => {
      stopFallback?.()
      renderer.setAnimationLoop(null)
      session?.end().catch(() => {})
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [support, occupants])

  return (
    <div className="ar-desk-view" role="dialog" aria-modal="true" aria-label="Layout in augmented reality">
      <div className="ar-desk-view__header">
        <span>
          {support === 'ar-supported'
            ? placed
              ? 'Placed — move your phone to view from any angle'
              : 'Point your camera at a flat surface, then tap to place'
            : '3D preview — AR not supported on this device/browser'}
        </span>
        <button onClick={onClose} aria-label="Close AR view">
          ✕
        </button>
      </div>
      <div className="ar-desk-view__canvas" ref={mountRef} />
    </div>
  )
}
