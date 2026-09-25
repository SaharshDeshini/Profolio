import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from 'three'
import { progress } from '../scroll/progress.ts'
import { cameraFrameFor, sampleCameraPose } from './cameraPath.ts'

/**
 * Applies the authored camera path to the R3F camera once per frame, from the
 * damped scalar. The dock moves the rig, never the camera, so the two never
 * fight over one transform. The path is framed for the viewport's shape, so a
 * tall phone screen keeps the laptop and person in view.
 */
export function CameraRig() {
  useFrame(({ camera, size }) => {
    const pose = sampleCameraPose(progress.smooth, cameraFrameFor(size.width, size.height))
    camera.position.set(pose.position[0], pose.position[1], pose.position[2])
    camera.lookAt(pose.target[0], pose.target[1], pose.target[2])

    // R3F only refreshes the projection on canvas resize, so a changed FOV has to be applied by hand.
    if (camera instanceof PerspectiveCamera && camera.fov !== pose.fov) {
      camera.fov = pose.fov
      camera.updateProjectionMatrix()
    }
  })

  return null
}
