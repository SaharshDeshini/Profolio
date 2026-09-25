import { Achievements } from './sections/Achievements.tsx'
import { Connect } from './sections/Connect.tsx'
import { Education } from './sections/Education.tsx'
import { Intro } from './sections/Intro.tsx'
import { Projects } from './sections/Projects.tsx'
import { Skills } from './sections/Skills.tsx'

/**
 * The right-hand column: normal document flow beside the docked 3D rig. Order
 * matches SECTION_IDS in scroll/sections.ts.
 */
export function ContentColumn() {
  return (
    <div className="content-column">
      <Intro />
      <Skills />
      <Projects />
      <Achievements />
      <Education />
      <Connect />
    </div>
  )
}
