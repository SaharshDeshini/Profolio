import { PerformanceMonitor, useProgress } from '@react-three/drei'
import { useCallback, useEffect, useState } from 'react'
import type { StoryMode } from '../scroll/storyMode.ts'
import { overallProgress, revealNow, setArrivalProgress } from '../state/arrival.ts'
import { Effects } from './Effects.tsx'
import { resolveTier, stepDown, type QualityTier } from './quality.ts'
import { Scene } from './Scene.tsx'
import { Stage } from './Stage.tsx'
import { QualityContext, StartTierContext } from './useQuality.ts'

/** Feeds the loading manager's asset progress into the arrival screen's bar. */
function LoadBridge() {
  const assetPercent = useProgress((state) => state.progress)
  useEffect(() => {
    setArrivalProgress(overallProgress(assetPercent))
  }, [assetPercent])
  return null
}

const TIERS: readonly QualityTier[] = ['high', 'mid', 'low']

/**
 * Dev only: `?tier=high|mid|low` pins the quality tier and turns off the
 * automatic step-down, so a slow software-rendered test browser can still show
 * what a real GPU will. Compiled out of production builds.
 */
const PINNED_TIER: QualityTier | null = (() => {
  if (!import.meta.env.DEV) return null
  const requested = new URLSearchParams(window.location.search).get('tier')
  return TIERS.find((tier) => tier === requested) ?? null
})()

interface SceneStageProps {
  readonly mode: StoryMode
}

/**
 * Canvas + scene as ONE module so App can load it lazily: three.js, drei and
 * the room live in this chunk, and the landing shell (arrival screen, type,
 * content) paints without waiting for any of it.
 *
 * It also owns the quality tier: a first guess from the device, then one step
 * down (never back up, to avoid flip-flopping) if the frame rate says so, but
 * only while the loading screen still covers the scene (see `decline`).
 */
export default function SceneStage({ mode }: SceneStageProps) {
  const [tier, setTier] = useState(() =>
    PINNED_TIER ??
    resolveTier({
      mode,
      cores: navigator.hardwareConcurrency || 0,
      memoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    }),
  )
  // Captured once: what the visit started on. See StartTierContext.
  const [startTier] = useState(tier)
  // Stepping down rebuilds the effect pipeline and can drop bloom, which reads
  // as the whole image dimming. So it may only happen while the loading screen
  // still hides the scene; once the room starts to appear the tier is locked
  // for the rest of the visit, and the visitor never sees it change.
  const decline = useCallback(() => {
    if (PINNED_TIER === null && revealNow('model') === 0) setTier(stepDown)
  }, [])

  return (
    <Stage>
      <StartTierContext value={startTier}>
        <QualityContext value={tier}>
          <PerformanceMonitor onDecline={decline} flipflops={2} ms={250} />
          <LoadBridge />
          <Scene />
          <Effects />
        </QualityContext>
      </StartTierContext>
    </Stage>
  )
}
