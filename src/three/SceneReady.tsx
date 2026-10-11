import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect } from 'react'
import { WebGLRenderTarget } from 'three'
import { markArrivalReady } from '../state/arrival.ts'
import { useQuality } from './useQuality.ts'

/**
 * Renders nothing. Placed inside the Suspense boundary that holds the
 * character, so React only mounts it once everything in that boundary has
 * resolved: the moment the whole room first exists.
 *
 * Drawing that first frame straight away makes three.js compile every shader
 * in the room synchronously, each one blocking the main thread until the
 * driver finishes (measured at ~2.5s on integrated graphics), which froze the
 * arrival bar mid-way and then made it jump. So the frame loop pauses (in a
 * layout effect, before the next frame can start) while `compileAsync` lets
 * the GPU compile them in parallel off the main thread, then resumes. Two
 * frames after that the first real frame has been drawn, which is the moment
 * the arrival screen is allowed to lift.
 *
 * With post-processing on, the room is drawn into the composer's buffer, not
 * the canvas, and three builds a different program for that (linear output,
 * tone mapping left to the composer). Compiling against the canvas would warm
 * programs the room never uses, so it compiles against an offscreen target too.
 */
export function SceneReady() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)
  const setFrameloop = useThree((state) => state.setFrameloop)
  const { postFx } = useQuality()

  useLayoutEffect(() => {
    setFrameloop('never')
  }, [setFrameloop])

  useEffect(() => {
    let cancelled = false
    let first = 0
    let second = 0
    const resume = () => {
      if (cancelled) return
      setFrameloop('always')
      first = requestAnimationFrame(() => {
        second = requestAnimationFrame(markArrivalReady)
      })
    }
    const previous = gl.getRenderTarget()
    const offscreen = postFx ? new WebGLRenderTarget(1, 1) : null
    gl.setRenderTarget(offscreen)
    // A compile failure must never trap the visitor: fall back to drawing
    // (and compiling) on the first frame, exactly as before.
    gl.compileAsync(scene, camera)
      .finally(() => offscreen?.dispose())
      .then(resume, resume)
    gl.setRenderTarget(previous)
    return () => {
      cancelled = true
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
      setFrameloop('always')
    }
  }, [gl, scene, camera, setFrameloop, postFx])

  return null
}
