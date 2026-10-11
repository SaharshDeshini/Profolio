import { describe, expect, it } from 'vitest'
import { featuresFor, isIntegratedGpu, resolveTier, stepDown } from './quality.ts'

const desktop = { mode: 'cinematic', cores: 12, memoryGb: 16, gpu: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)' } as const
const IRIS_XE = 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A6) Direct3D11 vs_5_0 ps_5_0, D3D11)'

describe('resolveTier', () => {
  it('gives a capable desktop the full finish', () => {
    expect(resolveTier(desktop)).toBe('high')
  })

  it('never post-processes phones or reduced-motion visitors', () => {
    expect(resolveTier({ ...desktop, mode: 'mobile' })).toBe('low')
    expect(resolveTier({ ...desktop, mode: 'reduced' })).toBe('low')
  })

  it('drops to mid on a modest machine', () => {
    expect(resolveTier({ ...desktop, cores: 4 })).toBe('mid')
    expect(resolveTier({ ...desktop, memoryGb: 4 })).toBe('mid')
  })

  it('drops to low on a weak machine', () => {
    expect(resolveTier({ ...desktop, cores: 2 })).toBe('low')
    expect(resolveTier({ ...desktop, memoryGb: 2 })).toBe('low')
  })

  it('treats values a browser will not reveal as capable', () => {
    expect(resolveTier({ mode: 'cinematic', cores: 0, memoryGb: null, gpu: null })).toBe('high')
  })

  it('caps integrated graphics at mid however many cores the machine has', () => {
    expect(resolveTier({ ...desktop, gpu: IRIS_XE })).toBe('mid')
    expect(resolveTier({ ...desktop, gpu: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device))' })).toBe('mid')
  })
})

describe('isIntegratedGpu', () => {
  it('recognises built-in and software renderers, not discrete cards or an unknown GPU', () => {
    expect(isIntegratedGpu(IRIS_XE)).toBe(true)
    expect(isIntegratedGpu('Mali-G78')).toBe(true)
    expect(isIntegratedGpu(desktop.gpu)).toBe(false)
    expect(isIntegratedGpu('ANGLE (AMD, AMD Radeon RX 6700 XT)')).toBe(false)
    expect(isIntegratedGpu(null)).toBe(false)
  })
})

describe('featuresFor', () => {
  it('only the high tier pays for depth of field', () => {
    expect(featuresFor('high').depthOfField).toBe(true)
    expect(featuresFor('mid').depthOfField).toBe(false)
    expect(featuresFor('low').depthOfField).toBe(false)
  })

  it('the low tier skips post-processing entirely', () => {
    const low = featuresFor('low')
    expect(low.postFx).toBe(false)
    expect(low.bloom).toBe(false)
    expect(low.grain).toBe(false)
  })

  it('a better tier never has a smaller screen texture', () => {
    expect(featuresFor('high').screenTextureWidth).toBeGreaterThan(featuresFor('mid').screenTextureWidth)
    expect(featuresFor('mid').screenTextureWidth).toBeGreaterThan(featuresFor('low').screenTextureWidth)
  })

  it('only the low tier skips the room set dressing and fog', () => {
    expect(featuresFor('high').setDressing).toBe(true)
    expect(featuresFor('mid').setDressing).toBe(true)
    expect(featuresFor('low').setDressing).toBe(false)
  })
})

describe('stepDown', () => {
  it('drops one rung at a time and bottoms out at low', () => {
    expect(stepDown('high')).toBe('mid')
    expect(stepDown('mid')).toBe('low')
    expect(stepDown('low')).toBe('low')
  })
})
