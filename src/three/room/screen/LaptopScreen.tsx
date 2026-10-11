import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { MeshBasicMaterial } from 'three'
import { progress } from '../../../scroll/progress.ts'
import { moodAt } from '../../lighting/presets.ts'
import { LAPTOP } from '../dimensions.ts'
import { lidAngleAt } from '../lid.ts'
import { GatedRenderTexture } from './GatedRenderTexture.tsx'
import { ScreenScene } from './ScreenScene.tsx'
import { SCREEN_TEXTURE } from './screenTheme.ts'
import { useQuality } from '../../useQuality.ts'

/** Below this the lid reads as shut: the screen plane faces away from the camera, so rendering it is wasted work. */
const LID_VISIBLE_ANGLE = 1e-4

const SCREEN_ASPECT = SCREEN_TEXTURE.width / SCREEN_TEXTURE.height

/**
 * The screen surface, built once and used for both acts. It is a real 3D plane
 * showing a rendered texture rather than a DOM overlay, so the lid and the
 * person's arm occlude it per pixel, the text stays sharp at any size, and its
 * brightness can light the room.
 *
 * `toneMapped={false}` keeps the cyan true rather than letting the scene's tone
 * mapping darken it. The plane is rotated so it faces down when the lid is shut
 * and its top edge is the lid's free edge, which reads upright to the person.
 */
export function LaptopScreen() {
  const material = useRef<MeshBasicMaterial>(null)
  const { screenTextureWidth: textureWidth, screenSamples } = useQuality()

  useFrame(() => {
    material.current?.color.setScalar(moodAt(progress.smooth).screen)
  })

  return (
    <mesh position={[0, -0.0002, -LAPTOP.depth / 2]} rotation={[Math.PI / 2, 0, Math.PI]}>
      <planeGeometry args={[LAPTOP.screenWidth, LAPTOP.screenHeight]} />
      <meshBasicMaterial ref={material} color="#000000" toneMapped={false}>
        <GatedRenderTexture
          attach="map"
          width={textureWidth}
          height={Math.round(textureWidth / SCREEN_ASPECT)}
          samples={screenSamples}
          anisotropy={8}
          shouldRender={() => lidAngleAt(progress.smooth) > LID_VISIBLE_ANGLE}
        >
          <ScreenScene />
        </GatedRenderTexture>
      </meshBasicMaterial>
    </mesh>
  )
}
