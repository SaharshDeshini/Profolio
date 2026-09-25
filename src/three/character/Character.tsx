import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  LoopOnce,
  MeshStandardMaterial,
  type AnimationAction,
  type Group,
  type Object3D,
  type SkinnedMesh,
} from 'three'
import { progress } from '../../scroll/progress.ts'
import { CHARACTER } from '../room/dimensions.ts'
import { typingWeightAt } from './typing.ts'

const isSkinnedMesh = (object: Object3D): object is SkinnedMesh =>
  (object as SkinnedMesh).isSkinnedMesh === true

/** The rig's own materials import at metalness 0.4, which throws a hot specular highlight under
 * the desk's key spotlight — bright enough to trip the bloom threshold and read as "glowing"
 * rather than lit. Capping metalness/raising roughness keeps the same teal/near-black hues, just
 * calmer under strong light, so the laptop screen stays the scene's one clear focal glow. */
const MAX_METALNESS = 0.12
const MIN_ROUGHNESS = 0.8

export const CHARACTER_URL = `${import.meta.env.BASE_URL}models/character.glb`
const SIT_CLIP = 'Sit'
const TYPE_CLIP = 'Type'
/** A dedicated Mixamo transition clip, scrubbed rather than played — see the useFrame below. */
const TRANSITION_CLIP = 'SitToType'

interface TypingClips {
  readonly sit: AnimationAction
  readonly type: AnimationAction
  readonly transition: AnimationAction
}

/**
 * The seated person: the original "Alpha" Mixamo mannequin (`Alpha_Surface`/
 * `Alpha_Joints` meshes), converted and meshopt-compressed straight from the
 * FBX. Its baked-in teal body / dark-joint coloring is the classic plain
 * Mixamo preview look and is kept as-is — only metalness/roughness are
 * capped (see `MAX_METALNESS`/`MIN_ROUGHNESS`) to keep it from blowing out
 * under the key light.
 */
export function Character() {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(CHARACTER_URL)
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    scene.traverse((object) => {
      if (!isSkinnedMesh(object)) return
      // The bind pose is a T-pose/A-pose, so the culling sphere would be wider than the seated body.
      object.frustumCulled = false
      if (object.material instanceof MeshStandardMaterial) {
        object.material.metalness = Math.min(object.material.metalness, MAX_METALNESS)
        object.material.roughness = Math.max(object.material.roughness, MIN_ROUGHNESS)
      }
    })
  }, [scene])

  // Mutated imperatively every frame below (three.js AnimationAction, not React state) — a ref
  // rather than reading `actions` directly, since the compiler forbids writing through a value
  // that still traces back to a hook call.
  const clipsRef = useRef<TypingClips | null>(null)
  // An AnimationAction keeps advancing its own clock on wall-clock time as long as it's
  // `enabled`, regardless of `weight` — so leaving "sit" and "type" perpetually enabled let
  // them drift out of sync with scroll and with each other, popping to whatever pose each
  // happened to be at when its weight snapped in. Only ever one of the three is `enabled` at
  // a time (see the useFrame below), which both fixes that drift and halves-to-thirds the
  // per-frame mixer cost versus blending all three continuously.
  const typeActiveRef = useRef(false)

  useEffect(() => {
    const sit = actions[SIT_CLIP]
    const type = actions[TYPE_CLIP]
    const transition = actions[TRANSITION_CLIP]
    if (!sit || !type || !transition) return

    clipsRef.current = { sit, type, transition }
    const clips = clipsRef.current
    typeActiveRef.current = false

    clips.sit.reset().play()
    clips.type.reset().play()
    // Held paused at a manually-set time each frame below, not played on its own clock: the
    // transition must scrub back and forth with scroll, not run forward on wall-clock time.
    clips.transition.reset().setLoop(LoopOnce, 1).play()
    clips.transition.paused = true
    clips.transition.clampWhenFinished = true

    return () => {
      clips.sit.stop()
      clips.type.stop()
      clips.transition.stop()
      clipsRef.current = null
    }
  }, [actions])

  useFrame(() => {
    const clips = clipsRef.current
    if (!clips) return

    const weight = typingWeightAt(progress.smooth)
    const sitActive = weight <= 0
    const typeActive = weight >= 1
    const inTransition = !sitActive && !typeActive

    // "Type" always starts fresh from the pose the transition clip ends on, rather than
    // resuming wherever its own loop had drifted to — see the comment on typeActiveRef above.
    if (typeActive && !typeActiveRef.current) clips.type.reset().play()
    typeActiveRef.current = typeActive

    clips.sit.enabled = sitActive
    clips.type.enabled = typeActive
    clips.transition.enabled = inTransition

    clips.sit.weight = sitActive ? 1 : 0
    clips.type.weight = typeActive ? 1 : 0
    clips.transition.weight = inTransition ? 1 : 0
    if (inTransition) {
      clips.transition.time = weight * clips.transition.getClip().duration
    }
  })

  return (
    <group ref={group} position={CHARACTER.position} rotation-y={CHARACTER.rotationY} scale={CHARACTER.scale}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(CHARACTER_URL)
