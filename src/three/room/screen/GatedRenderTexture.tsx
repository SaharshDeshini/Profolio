import { useFBO } from '@react-three/drei'
import { createPortal, useFrame, type RenderCallback } from '@react-three/fiber'
import { useRef, useState, type ReactNode } from 'react'
import { LinearMipmapLinearFilter, Scene } from 'three'

interface GatedRenderTextureProps {
  readonly width: number
  readonly height: number
  readonly samples: number
  readonly anisotropy: number
  readonly attach: string
  readonly children: ReactNode
  /** Checked every frame before the sub-scene is rendered; skip the render entirely when it returns false. */
  readonly shouldRender: () => boolean
}

/**
 * A trimmed copy of drei's `RenderTexture` (see `node_modules/@react-three/drei/core/RenderTexture.js`):
 * same FBO-into-a-portal-scene approach, minus the pointer-raycasting support
 * this screen never needs, plus a `shouldRender` gate drei has no hook for.
 * When the gate is closed the FBO/portal/scene all stay mounted (so there is
 * never a remount flash or a stale first-frame pop) and only the render call
 * itself, the expensive part, is skipped.
 */
export function GatedRenderTexture({
  width,
  height,
  samples,
  anisotropy,
  attach,
  children,
  shouldRender,
}: GatedRenderTextureProps) {
  // Unlike drei's version, the size is NOT multiplied by the device pixel
  // ratio: `width` is already far more pixels than the screen ever covers on
  // the canvas, and scaling it by DPR made it a ~2300px, 4x-multisampled
  // render every frame on an ordinary laptop. Mipmaps let the GPU shrink it
  // smoothly: without them the text shimmered as the camera moved, and the
  // bloom picked that shimmer up as the room's glow flickering.
  const fbo = useFBO(width, height, { samples, generateMipmaps: true, minFilter: LinearMipmapLinearFilter })
  const [scene] = useState(() => new Scene())

  return (
    <>
      {createPortal(<GatedContainer fbo={fbo} shouldRender={shouldRender}>{children}</GatedContainer>, scene)}
      <primitive object={fbo.texture} attach={attach} anisotropy={anisotropy} />
    </>
  )
}

interface GatedContainerProps {
  readonly fbo: ReturnType<typeof useFBO>
  readonly shouldRender: () => boolean
  readonly children: ReactNode
}

function GatedContainer({ fbo, shouldRender, children }: GatedContainerProps) {
  // The first frame always renders, even with the gate shut: that compiles the
  // screen's shaders and lays out its text while the arrival screen still hides
  // the room, instead of freezing the scroll the moment the lid opens.
  const warmed = useRef(false)
  const render: RenderCallback = (state) => {
    if (warmed.current && !shouldRender()) return
    warmed.current = true
    const previousTarget = state.gl.getRenderTarget()
    state.gl.setRenderTarget(fbo)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(previousTarget)
  }
  useFrame(render)
  return children
}
