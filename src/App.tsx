import { lazy, Suspense, useRef, useState, type CSSProperties } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Route, Routes, useMatch } from 'react-router'
import { PROJECT_ROUTE } from './content/projectLookup.ts'
import { Arrival } from './dom/Arrival.tsx'
import { ChapterIndex } from './dom/ChapterIndex.tsx'
import { ContentColumn } from './dom/ContentColumn.tsx'
import { DebugHud } from './dom/DebugHud.tsx'
import { Hero } from './dom/Hero.tsx'
import { ProjectOverlay } from './dom/ProjectOverlay.tsx'
import { COMPACT_QUERY, SPLIT_RATIO } from './layout.ts'
import { ACT1_LAYOUT, type ActOneLayout } from './scroll/sections.ts'
import { playsActOne, type StoryMode } from './scroll/storyMode.ts'
import { useDeepLinkStart } from './scroll/useDeepLinkStart.ts'
import { useLenis } from './scroll/useLenis.ts'
import { useMediaQuery } from './scroll/useMediaQuery.ts'
import { useSkipToContent } from './scroll/useSkipToContent.ts'
import { useStoryMode } from './scroll/useStoryMode.ts'
import { useStoryScroll } from './scroll/useStoryScroll.ts'
import { CODE_LOADED, setArrivalProgress } from './state/arrival.ts'
import { useArrival } from './state/useArrival.ts'

// three.js, drei and the whole room live behind this import, so the landing
// shell (arrival screen, type, content) paints without waiting for any of it.
// A failed chunk load rejects here and lands in the ErrorBoundary below, which
// drops to the static layout like any other scene failure.
const SceneStage = lazy(async () => {
  const module = await import('./three/SceneStage.tsx')
  setArrivalProgress(CODE_LOADED)
  return module
})

type LayoutVars = CSSProperties & Record<'--split' | '--runway' | '--overlap', number>

// The CSS reads the same numbers the 3D side does, so they cannot drift apart.
const varsFor = ({ runwaySvh, overlapSvh }: ActOneLayout): LayoutVars => ({
  '--split': SPLIT_RATIO,
  '--runway': runwaySvh,
  '--overlap': overlapSvh,
})

const WIDE_VARS = varsFor(ACT1_LAYOUT.wide)
const COMPACT_VARS = varsFor(ACT1_LAYOUT.compact)

// Dev-only, and even then opt-in: without the query param it was showing up
// unannounced on every local `npm run dev` visit, which read as a stray
// on-screen readout rather than a tool anyone asked for.
const SHOW_DEBUG_HUD = import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug')

// Without Act 1 there is no runway to scroll through, so the column must start
// at the top of the page. Both must be zero: zeroing only the runway would
// leave the column's negative overlap margin pulling it above the page.
const STATIC_VARS: LayoutVars = { '--split': SPLIT_RATIO, '--runway': 0, '--overlap': 0 }

function layoutVarsFor(mode: StoryMode, compact: boolean): LayoutVars {
  if (!playsActOne(mode)) return STATIC_VARS
  return compact ? COMPACT_VARS : WIDE_VARS
}

export default function App() {
  const detectedMode = useStoryMode()
  const compact = useMediaQuery(COMPACT_QUERY)
  const [sceneFailed, setSceneFailed] = useState(false)
  const mode: StoryMode = sceneFailed ? 'static' : detectedMode
  const runwayRef = useRef<HTMLDivElement>(null)
  const overlayOpen = useMatch(PROJECT_ROUTE) !== null
  // Captured once: was this page opened straight onto a project?
  const [openedOnProject] = useState(overlayOpen)
  useDeepLinkStart(openedOnProject)
  const hasScene = mode !== 'static'
  const arrivalDismissed = useArrival().dismissed
  // Only a mode that loads the scene shows the arrival screen; without WebGL
  // there is nothing to wait for, so the page is usable immediately.
  const arriving = hasScene && !arrivalDismissed
  const skipToContent = useSkipToContent()

  useLenis(mode === 'cinematic')
  useStoryScroll(runwayRef, mode)

  return (
    <>
      <a
        className="skip-link"
        href="#intro"
        onClick={(event) => {
          event.preventDefault()
          skipToContent()
        }}
      >
        Skip to content
      </a>
      {hasScene ? (
        // A failing scene must never take the content down with it: on any
        // error the canvas goes, the layout drops to static, the page stays.
        <ErrorBoundary fallback={null} onError={() => setSceneFailed(true)}>
          <Suspense fallback={null}>
            <SceneStage mode={mode} />
          </Suspense>
        </ErrorBoundary>
      ) : null}
      {playsActOne(mode) ? <Hero /> : null}
      {/* `inert` takes the page out of the tab order and the accessibility tree while a project or the arrival screen is open. */}
      <main
        className="scroll-root"
        style={layoutVarsFor(mode, compact)}
        inert={overlayOpen || arriving}
      >
        <div ref={runwayRef} className="act-one-runway" aria-hidden="true" />
        <ContentColumn />
        <ChapterIndex />
      </main>
      <Routes>
        <Route path={PROJECT_ROUTE} element={<ProjectOverlay />} />
      </Routes>
      {hasScene ? <Arrival /> : null}
      {SHOW_DEBUG_HUD ? <DebugHud /> : null}
    </>
  )
}
