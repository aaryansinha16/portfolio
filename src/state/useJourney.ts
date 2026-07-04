import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { DEBUG, PREFERS_REDUCED_MOTION } from '../utils/query'

export type QualityTier = 'high' | 'medium' | 'low'

interface JourneyState {
  /**
   * Normalized scroll progress 0→1, already scrub-smoothed by the master
   * timeline. Drives UI (rail, hints) and the detour strips.
   */
  progress: number
  /**
   * Spline progress 0→1 — scroll remapped through the detour plateaus
   * (DetourManager.splineOf). THE coordinate for everything in the world:
   * camera, vehicles, env, chapter detection.
   */
  splineProgress: number
  /** vehicle ground speed in m/s, smoothed. For FOV kicks/shake/wheels. */
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
  setProgress: (scroll: number, spline: number) => void
  setChapter: (c: number) => void
  setQuality: (q: QualityTier) => void
  toggleFreeFly: () => void
  setReady: () => void
}

export const useJourney = create<JourneyState>()(
  subscribeWithSelector((set) => ({
    progress: 0,
    splineProgress: 0,
    velocity: 0,
    chapter: 0,
    quality: 'high',
    debug: DEBUG,
    freeFly: false,
    reducedMotion: PREFERS_REDUCED_MOTION,
    ready: false,
    setProgress: (progress, splineProgress) => set({ progress, splineProgress }),
    setChapter: (chapter) => set({ chapter }),
    setQuality: (quality) => set({ quality }),
    toggleFreeFly: () => set((s) => ({ freeFly: !s.freeFly })),
    setReady: () => set({ ready: true }),
  })),
)
