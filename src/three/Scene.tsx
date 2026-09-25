import { Suspense } from 'react'
import { Character } from './character/Character.tsx'
import { CharacterProxy } from './character/CharacterProxy.tsx'
import { CameraRig } from './CameraRig.tsx'
import { DockRig } from './DockRig.tsx'
import { SceneLights } from './lighting/SceneLights.tsx'
import { FloorPool, LightShaft, Washes } from './room/Atmosphere.tsx'
import { Chair } from './room/Chair.tsx'
import { CityWindow } from './room/CityWindow.tsx'
import { DeskItems } from './room/DeskItems.tsx'
import { Desk } from './room/Desk.tsx'
import { Laptop } from './room/Laptop.tsx'
import { Dust, Props } from './room/Props.tsx'
import { ProblemWall } from './room/ProblemWall.tsx'
import { Room } from './room/Room.tsx'
import { SceneReady } from './SceneReady.tsx'
import { useSetDressing } from './useQuality.ts'

/** How far the room's far walls fade into haze. Cheap, and it reads the 16m room as a place with depth, not a hard-edged box. */
const FOG_NEAR = 6
const FOG_FAR = 15

/**
 * Everything inside the canvas. The room stays put; the rig (desk, chair,
 * laptop, person and their lights) docks as one unit into the left band.
 */
export function Scene() {
  const setDressing = useSetDressing()

  return (
    <>
      <CameraRig />
      {/* A faint cool haze rather than pure black: distance reads as air. Cheap,
          so on every tier: without it (and the atmosphere below) a low-tier
          device drops back to a black void behind the content. */}
      <fog attach="fog" args={['#07090c', FOG_NEAR, FOG_FAR]} />
      <Room />
      {setDressing && <Props />}
      {setDressing && <Dust />}
      <Washes />
      {/* The one view out of the room: a night city through the back wall. */}
      <CityWindow />
      {/* Act 2's backdrop: the questions behind the work, lighting up section by section. */}
      <ProblemWall />
      <DockRig>
        <SceneLights />
        <LightShaft />
        <FloorPool />
        <Desk />
        {setDressing && <DeskItems />}
        <Chair />
        <Suspense fallback={<CharacterProxy />}>
          <Character />
          <SceneReady />
        </Suspense>
        <Laptop />
      </DockRig>
    </>
  )
}
