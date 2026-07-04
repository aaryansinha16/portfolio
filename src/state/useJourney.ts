import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { DEBUG, PREFERS_REDUCED_MOTION } from '../utils/query'

export type QualityTier = 'high' | 'medium' | 'low'

interface JourneyState {
  /**
   * Normalized scroll progress 0→1, already scrub-smoothed by the master
   * timeline. This is the single source of truth everything reads from.
   */
  progress: number
  /** d(progress)/dt in progress-units per second, smoothed. For FOV kicks/shake. */
  velocity: number
  /** Current chapter zone index 0..6, derived from progress. */
  chapter: number
  quality: QualityTier
  debug: boolean
  /** Dev free-fly camera (suspends the CameraRig). Toggled with F in ?debug. */
  freeFly: boolean
  reducedMotion: boolean
  /** WebGL context created — the loader fades out on this. */
  ready: boolean
  setProgress: (p: number, velocity: number) => void
  setChapter: (c: number) => void
  setQuality: (q: QualityTier) => void
  toggleFreeFly: () => void
  setReady: () => void
}

export const useJourney = create<JourneyState>()(
  subscribeWithSelector((set) => ({
    progress: 0,
    velocity: 0,
    chapter: 0,
    quality: 'high',
    debug: DEBUG,
    freeFly: false,
    reducedMotion: PREFERS_REDUCED_MOTION,
    ready: false,
    setProgress: (progress, velocity) => set({ progress, velocity }),
    setChapter: (chapter) => set({ chapter }),
    setQuality: (quality) => set({ quality }),
    toggleFreeFly: () => set((s) => ({ freeFly: !s.freeFly })),
    setReady: () => set({ ready: true }),
  })),
)
