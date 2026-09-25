import { useFrame } from '@react-three/fiber'
import { useRef, useState, type RefObject } from 'react'
import { AdditiveBlending, Color, DoubleSide, type IUniform, type ShaderMaterial } from 'three'
import type { RevealLayer } from '../../scroll/reveal.ts'
import { revealNow } from '../../state/arrival.ts'
import { READING_LAMP } from './dimensions.ts'

/**
 * Light made visible, so the room reads as a space with air and falloff
 * instead of a void: every piece here is motivated by a light that already
 * exists, is additive and faint, casts nothing and writes no depth. All of it
 * arrives on its layer of the opening (scroll/reveal.ts).
 */

type Vec3 = readonly [number, number, number]

/** `uColor` and `uOpacity`, in the index-signature shape three's ShaderMaterial expects. */
type GlowUniforms = Record<string, IUniform>

/** Per-instance uniforms (never shared between meshes), starting invisible. */
function useGlowUniforms(color: string): GlowUniforms {
  const [uniforms] = useState<GlowUniforms>(() => ({ uColor: { value: new Color(color) }, uOpacity: { value: 0 } }))
  return uniforms
}

/**
 * A ref for a shader material whose `uOpacity` fades in on a reveal layer of
 * the opening, and stops being touched once it has arrived.
 */
function useRevealMaterial(layer: RevealLayer, peak: number): RefObject<ShaderMaterial | null> {
  const material = useRef<ShaderMaterial>(null)
  useFrame(() => {
    const uniform = material.current?.uniforms.uOpacity
    if (!uniform || uniform.value === peak) return
    uniform.value = peak * revealNow(layer)
  })
  return material
}

const SHAFT_VERTEX = /* glsl */ `
  varying float vHeight;
  varying float vFacing;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 normalWorld = normalize(mat3(modelMatrix) * normal);
    vFacing = abs(dot(normalWorld, normalize(cameraPosition - world.xyz)));
    vHeight = uv.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const SHAFT_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vHeight;
  varying float vFacing;
  void main() {
    // Brightest near the lamp, gone before the floor; soft at the silhouette
    // edges (where the surface turns away from the eye), so it reads as a
    // volume of lit air rather than a cone of plastic.
    float along = smoothstep(0.0, 0.9, vHeight);
    float edge = pow(vFacing, 1.6);
    gl_FragColor = vec4(uColor, uOpacity * along * edge);
  }
`

/**
 * Straight down over the middle of the person and the laptop (x 0, z -0.25:
 * the same point `DOCK.anchor` treats as the rig's centre), from the key
 * light's height, so the beam frames the figure dead centre in the opening shot.
 */
// Dim on purpose: the user preferred the beam faint rather than bright. Kept
// this low it reads the same with or without bloom, so a quality step-down
// never visibly changes it.
const SHAFT = { x: 0, z: -0.25, top: 3.6, height: 3.5, radius: 1.25, peak: 0.03, color: '#d6ecff' } as const

/**
 * The overhead key light's beam, visible in the air: the "spotlight on him"
 * of the opening. Lives inside the rig (like the key light itself), so it
 * docks and shrinks with the desk.
 */
export function LightShaft() {
  const material = useRevealMaterial('spotlight', SHAFT.peak)
  const uniforms = useGlowUniforms(SHAFT.color)

  // Apex at the key light (SceneLights KEY_POSITION), opening straight down.
  return (
    <mesh position={[SHAFT.x, SHAFT.top - SHAFT.height / 2, SHAFT.z]}>
      <coneGeometry args={[SHAFT.radius, SHAFT.height, 48, 1, true]} />
      <shaderMaterial
        ref={material}
        vertexShader={SHAFT_VERTEX}
        fragmentShader={SHAFT_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float falloff = 1.0 - smoothstep(0.0, 1.0, r);
    gl_FragColor = vec4(uColor, uOpacity * falloff * falloff);
  }
`

interface GlowProps {
  readonly position: Vec3
  readonly rotation?: Vec3
  readonly size: readonly [number, number]
  readonly color: string
  readonly peak: number
  readonly layer: RevealLayer
}

/** A soft radial pool of light on a surface: where a light would fall, drawn rather than computed. */
export function Glow({ position, rotation = [0, 0, 0], size, color, peak, layer }: GlowProps) {
  const material = useRevealMaterial(layer, peak)
  const uniforms = useGlowUniforms(color)

  return (
    <mesh position={[position[0], position[1], position[2]]} rotation={[rotation[0], rotation[1], rotation[2]]}>
      <planeGeometry args={[size[0], size[1]]} />
      <shaderMaterial
        ref={material}
        vertexShader={GLOW_VERTEX}
        fragmentShader={GLOW_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

const FLAT: Vec3 = [-Math.PI / 2, 0, 0]

/** The key light's pool on the floor under the desk. Inside the rig, so it docks with it. */
export function FloorPool() {
  return <Glow position={[0, 0.004, -0.25]} rotation={FLAT} size={[4.2, 4.2]} color="#9fdfff" peak={0.05} layer="spotlight" />
}

/**
 * Washes on the surfaces the camera actually sees: the back wall in Act 1's
 * opening shot, lit cool like the rim lights, and the open floor toward the
 * far corner that fills the frame once docked, warm from the lamp. Room
 * fixtures, outside the rig.
 */
export function Washes() {
  return (
    <>
      <Glow position={[0.5, 2.4, -7.94]} size={[11, 6]} color="#7fd8ff" peak={0.07} layer="model" />
      {/* Once docked the camera looks down across this floor: it IS the backdrop
          behind the content, so it carries a broad cool falloff... */}
      <Glow position={[-3.6, 0.003, 4.8]} rotation={FLAT} size={[15, 15]} color="#6f9fb5" peak={0.15} layer="model" />
      {/* ...and the lamp's warm pool on the rug, the one warm note in the room. */}
      <Glow
        position={[READING_LAMP.x, 0.005, READING_LAMP.z]}
        rotation={FLAT}
        size={[3.2, 3.2]}
        color="#ffb46e"
        peak={0.1}
        layer="particles"
      />
    </>
  )
}
