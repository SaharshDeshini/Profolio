import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useState, type ReactNode } from 'react'
import { ScrollDriver } from '../scroll/ScrollDriver.tsx'
import { sampleCameraPose } from './cameraPath.ts'

// Hoisted so the Canvas's props keep one identity across renders. The camera
// starts exactly where the path does, so there is no first-frame pop.
const START_POSE = sampleCameraPose(0)
const CANVAS_STYLE = { position: 'fixed', inset: 0, width: '100%', height: '100lvh', zIndex: 0 } as const
const CAMERA = { fov: START_POSE.fov, near: 0.1, far: 80, position: START_POSE.position }
const GL = { antialias: true, alpha: false, powerPreference: 'high-performance' } as const
const DPR: [number, number] = [1, 1.75]
// The canvas is fixed and never moves, so there is nothing to re-measure on scroll.
const RESIZE = { scroll: false }

interface StageProps {
  readonly children: ReactNode
}

/**
 * Losing the WebGL context (driver crash, GPU process restart, tab
 * backgrounding) is an async DOM event, not a render-time throw, so it never
 * reaches the ErrorBoundary that wraps <SceneStage> in App.tsx on its own —
 * without this, the canvas goes blank and the page is stuck. Re-throwing on
 * the next render lets that same boundary catch it and drop to the static
 * layout exactly like any other scene failure.
 */
function ContextLossWatcher() {
  const gl = useThree((state) => state.gl)
  const [lost, setLost] = useState(false)
  if (lost) throw new Error('WebGL context lost')

  useEffect(() => {
    const canvas = gl.domElement
    const onContextLost = (event: Event) => {
      // Allow the browser to attempt its own recovery; the scene still drops
      // to static either way; there is nothing to resume once unmounted.
      event.preventDefault()
      setLost(true)
    }
    canvas.addEventListener('webglcontextlost', onContextLost)
    return () => canvas.removeEventListener('webglcontextlost', onContextLost)
  }, [gl])

  return null
}

/**
 * The one canvas. Fixed, full-bleed and never resized: the dock animates the
 * rig inside it, so there is no gl.setSize churn or aspect-ratio drift.
 * `100lvh` (not `vh`) keeps mobile browser chrome from resizing it either.
 * It is decorative to assistive tech: the DOM carries all the content.
 */
export function Stage({ children }: StageProps) {
  return (
    <Canvas
      aria-hidden="true"
      style={CANVAS_STYLE}
      dpr={DPR}
      camera={CAMERA}
      gl={GL}
      resize={RESIZE}
    >
      <color attach="background" args={['#050505']} />
      <ScrollDriver />
      <ContextLossWatcher />
      {children}
    </Canvas>
  )
}
