import type { ChapterConfig } from '../types'

/** Pre-dawn. Deep indigo, first light of the marigold sun on the horizon. */
export const prologueConfig: ChapterConfig = {
  name: 'Prologue',
  seed: 100,
  camera: { height: 1.72, right: 0.92, fov: 46, chase: 6 },
  env: {
    fogColor: '#171b2c',
    fogDensity: 0.015,
    skyColor: '#10142a',
    skyZenith: '#0a0d1f',
    skyHorizon: '#313a66',
    sunGlow: 0.5,
    sunColor: '#e8b04b',
    sunIntensity: 0.35,
    sunAzimuth: 100,
    sunElevation: 4,
    hemiSky: '#2e3450',
    hemiGround: '#141826',
    hemiIntensity: 0.35,
    toneExposure: 0.95,
    groundColor: '#14171f',
    roadTint: '#2a2b33',
  },
  greybox: {
    spacing: 26,
    offsetMin: 9,
    offsetMax: 26,
    sizeMin: [2.5, 2, 2.5],
    sizeMax: [4, 3.2, 4],
    colors: ['#3c3a4a', '#464253'],
    density: 0.35,
  },
  far: {
    kind: 'hills',
    color: '#232840',
    distMin: 70,
    distMax: 150,
    spacing: 60,
    heightMin: 18,
    heightMax: 34,
  },
}
