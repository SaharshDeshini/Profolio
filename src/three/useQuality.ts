import { createContext, useContext } from 'react'
import { featuresFor, type QualityFeatures, type QualityTier } from './quality.ts'

export const QualityContext = createContext<QualityTier>('mid')

export const useQualityTier = (): QualityTier => useContext(QualityContext)

export const useQuality = (): QualityFeatures => featuresFor(useQualityTier())

/**
 * The tier the visit started on. Set dressing (props, dust) is decided from
 * this alone, never from the live tier: a mid-visit step-down would otherwise
 * make the shelves and the reading corner vanish in front of the visitor.
 * Stepping down still cheapens everything invisible to remove (post-processing,
 * screen texture size).
 */
export const StartTierContext = createContext<QualityTier>('mid')

export const useSetDressing = (): boolean => featuresFor(useContext(StartTierContext)).setDressing
