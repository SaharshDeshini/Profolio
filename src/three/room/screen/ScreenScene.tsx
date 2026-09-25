import { PerspectiveCamera } from '@react-three/drei'
import { MottoScreen } from './MottoScreen.tsx'
import { ProjectScreens } from './ProjectScreen.tsx'
import { SectionScreen } from './SectionScreen.tsx'
import { SCREEN_TEXTURE, SCREEN_THEME } from './screenTheme.ts'

const SCREEN_ASPECT = SCREEN_TEXTURE.width / SCREEN_TEXTURE.height

/**
 * What is drawn on the laptop screen: one scene for the whole site. The motto
 * plays in Act 1 and stays as About's resting state; once docked, whichever
 * Act 2 section is being read shows its own short readout (`SectionScreen`),
 * and the project at the centre of the page takes over on top of that. All
 * three layers share `screenCover`'s mix registry, so only one is ever
 * visible at a time and each cedes to the others in the right order.
 */
export function ScreenScene() {
  return (
    <>
      <color attach="background" args={[SCREEN_THEME.background]} />
      <PerspectiveCamera makeDefault manual aspect={SCREEN_ASPECT} fov={50} position={[0, 0, 5]} />
      <ProjectScreens />
      <SectionScreen />
      <MottoScreen />
    </>
  )
}
