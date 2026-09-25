import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace, type MeshBasicMaterial } from 'three'
import { beat, smoothstep, type BeatRange } from '../../scroll/beats.ts'
import { progress } from '../../scroll/progress.ts'
import { revealNow } from '../../state/arrival.ts'
import { Glow } from './Atmosphere.tsx'
import { generateCityscape, type CityLayer } from './cityscape.ts'
import { ROOM } from './dimensions.ts'

/**
 * A floor-to-ceiling glass wall on the room's left side with a night city
 * beyond it: the one view out of the room. It is out of frame in the opening
 * shot (the camera faces the back wall) and is discovered during the turn,
 * when the camera swings round to look across the room at it: there was
 * another world behind you. Its lights come up as the camera turns toward it
 * (`CITY_WAKE`), so the reveal reads as the city coming into view, not a
 * picture that was always there. The skyline is painted once into a canvas
 * texture from `generateCityscape` (deterministic), dim enough that the laptop
 * stays the brightest thing in the room.
 */

/**
 * Where the glass sits on the left wall (x = -ROOM.width / 2), along z. The
 * turning camera looks down at the rig, so it only ever sees the lower half of
 * this wall (about y 0.6..1.8): the glass runs nearly floor to ceiling so the
 * skyline lands in that band.
 */
const WINDOW = { centerZ: -2.5, width: 6, bottom: 0.12, height: 3.2 } as const
const WALL_X = -ROOM.width / 2
const TEXTURE = { width: 1536, height: 820 } as const
/** The span of the story over which the city's lights come up: the camera turning toward the glass (see ACT1_BEATS.orbit). */
const CITY_WAKE: BeatRange = [0.3, 0.5]
/** How lit the city is before the camera has turned to it. */
const CITY_ASLEEP = 0.45

/**
 * The sky is lit a little by the city itself, so the towers read as
 * silhouettes against it: a skyline, not a field of dots.
 */
const SKY = { top: '#060b12', horizon: '#1a2d3e', glow: 'rgba(120, 85, 50, 0.22)' } as const
const LAYER_FILL: Readonly<Record<CityLayer, string>> = { far: '#122030', mid: '#0b1520', near: '#050a10' }
/** Window light per layer: nearer is brighter, farther recedes into the haze. Kept low: a city at night, not a switchboard. */
const LAYER_LIGHT: Readonly<Record<CityLayer, number>> = { far: 0.18, mid: 0.3, near: 0.42 }
const WINDOW_PX = { width: 4, height: 7 } as const

function paintCity(): CanvasTexture | null {
  const canvas = document.createElement('canvas')
  canvas.width = TEXTURE.width
  canvas.height = TEXTURE.height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const { width: W, height: H } = TEXTURE

  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, SKY.top)
  sky.addColorStop(0.75, SKY.horizon)
  sky.addColorStop(1, SKY.horizon)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)
  // The city's own light pollution, warm, low over the rooftops.
  const glow = ctx.createRadialGradient(W * 0.5, H * 1.05, 0, W * 0.5, H * 1.05, H * 0.8)
  glow.addColorStop(0, SKY.glow)
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const { buildings, streetLights } = generateCityscape()
  for (const layer of ['far', 'mid', 'near'] as const) {
    for (const building of buildings.filter((candidate) => candidate.layer === layer)) {
      const top = H - building.height * H
      ctx.fillStyle = LAYER_FILL[layer]
      ctx.fillRect(building.x * W, top, building.width * W, H - top)
      const light = LAYER_LIGHT[layer]
      for (const window of building.windows) {
        ctx.fillStyle = window.warm ? `rgba(255, 210, 160, ${light})` : `rgba(170, 215, 250, ${light * 0.85})`
        ctx.fillRect(window.x * W, H - window.y * H - WINDOW_PX.height, WINDOW_PX.width, WINDOW_PX.height)
      }
      if (building.beacon) {
        ctx.fillStyle = 'rgba(255, 60, 50, 0.85)'
        ctx.beginPath()
        ctx.arc((building.x + building.width / 2) * W, top - 3, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // Haze between the far towers and the rest, so they recede. A translucent
    // wash, not ctx.filter blur: a filtered canvas stays GPU-backed and made
    // the whole scene several times slower to draw.
    if (layer === 'far') {
      ctx.fillStyle = 'rgba(26, 45, 62, 0.35)'
      ctx.fillRect(0, 0, W, H)
    }
  }
  // Street level: out-of-focus lights, the bokeh of a city at night.
  for (const lamp of streetLights) {
    const x = lamp.x * W
    const y = H - lamp.y * H
    const r = lamp.radius * W
    const blob = ctx.createRadialGradient(x, y, 0, x, y, r)
    blob.addColorStop(0, lamp.warm ? 'rgba(255, 170, 90, 0.55)' : 'rgba(170, 220, 255, 0.45)')
    blob.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = blob
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const FRAME = { color: '#101113', roughness: 0.45, metalness: 0.6 } as const
const BAR = 0.06
const DEPTH = 0.08
/** Vertical mullions: the glass is four tall panes. */
const PANES = 4

type Vec3 = [number, number, number]

/** Lays a Glow flat on the floor. */
const FLAT: Vec3 = [-Math.PI / 2, 0, 0]

export function CityWindow() {
  const texture = useMemo(() => paintCity(), [])
  const material = useRef<MeshBasicMaterial>(null)

  // The view arrives with the room (the opening's model layer), then its
  // lights come up as the camera turns toward it; both reverse on scroll-back.
  useFrame(() => {
    const view = material.current
    if (!view) return
    const awake = CITY_ASLEEP + (1 - CITY_ASLEEP) * smoothstep(beat(progress.smooth, CITY_WAKE))
    view.opacity = revealNow('model')
    view.color.setScalar(awake)
  })

  const { centerZ, width, bottom, height } = WINDOW
  const centerY = bottom + height / 2
  // In the group's frame: x runs along the wall, y up, +z points into the room.
  const bars: readonly { readonly position: Vec3; readonly size: Vec3 }[] = [
    { position: [0, bottom + height, DEPTH / 2], size: [width + BAR, BAR, DEPTH] },
    { position: [0, bottom, DEPTH / 2], size: [width + BAR, BAR, DEPTH] },
    ...Array.from({ length: PANES + 1 }, (_, index): { position: Vec3; size: Vec3 } => ({
      position: [-width / 2 + (index * width) / PANES, centerY, DEPTH / 2],
      size: [index === 0 || index === PANES ? BAR : BAR * 0.6, height, DEPTH],
    })),
  ]

  return (
    <group>
      {/* Turned to face into the room from the left wall. */}
      <group position={[WALL_X + 0.02, 0, centerZ]} rotation-y={Math.PI / 2}>
        <mesh position={[0, centerY, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial ref={material} map={texture} transparent opacity={0} toneMapped={false} fog={false} />
        </mesh>
        {bars.map(({ position, size }, index) => (
          <mesh key={index} position={position}>
            <boxGeometry args={size} />
            <meshStandardMaterial {...FRAME} />
          </mesh>
        ))}
      </group>
      {/* The city's cool light falling through the glass across the floor. */}
      <Glow
        position={[WALL_X + 1.3, 0.006, centerZ]}
        rotation={FLAT}
        size={[2.8, width * 1.05]}
        color="#5f8aa6"
        peak={0.09}
        layer="model"
      />
    </group>
  )
}
