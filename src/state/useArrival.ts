import { useSyncExternalStore } from 'react'
import { getArrival, subscribeArrival, type ArrivalState } from './arrival.ts'

/** Live arrival state for React. The 3D side reads the getter directly instead. */
export function useArrival(): ArrivalState {
  return useSyncExternalStore(subscribeArrival, getArrival, getArrival)
}
