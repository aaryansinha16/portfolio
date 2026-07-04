import type { ChapterConfig } from '../types'

/** Noon. Bleached asphalt, white-hot sky, hard high sun, heat-haze country. */
export const highwayConfig: ChapterConfig = {
  name: 'Highway Noon',
  seed: 103,
  env: {
    fogColor: '#d8dfe2',
    fogDensity: 0.0052,
    skyColor: '#e6eef2',
    sunColor: '#fffdf5',
    sunIntensity: 1.5,
    sunAzimuth: 25,
    sunElevation: 62,
    hemiSky: '#d5e2ea',
    hemiGround: '#9a9282',
    hemiIntensity: 0.55,
    toneExposure: 1.16,
    groundColor: '#7a7263',
    roadTint: '#6d6a5f',
  },
  greybox: {
    // Sparse: hoardings and poles, not buildings.
    spacing: 42,
    offsetMin: 8,
    offsetMax: 14,
    sizeMin: [6, 3, 0.4],
    sizeMax: [9, 4.5, 0.6],
    colors: ['#9aa3a8', '#8a9298'],
    density: 0.5,
  },
  far: {
    kind: 'hills',
    color: '#98a0a4',
    distMin: 120,
    distMax: 240,
    spacing: 80,
    heightMin: 24,
    heightMax: 46,
  },
}
