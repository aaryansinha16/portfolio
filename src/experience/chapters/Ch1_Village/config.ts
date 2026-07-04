import type { ChapterConfig } from '../types'

/** Dawn. Warm earth, sage fields, marigold accents; long soft shadows. */
export const villageConfig: ChapterConfig = {
  name: 'Village Dawn',
  seed: 101,
  camera: { height: 1.72, right: 0.92, fov: 46, chase: 6 },
  env: {
    fogColor: '#e0b48c',
    fogDensity: 0.0085,
    skyColor: '#efc79e',
    skyZenith: '#a9b4dd',
    skyHorizon: '#f4c493',
    sunGlow: 0.85,
    sunColor: '#ffc474',
    sunIntensity: 1.3,
    sunAzimuth: 95,
    sunElevation: 10,
    hemiSky: '#c6cfe8',
    hemiGround: '#8a6f4d',
    hemiIntensity: 0.45,
    toneExposure: 1.08,
    groundColor: '#5c5038',
    roadTint: '#3f3a31',
  },
  greybox: {
    spacing: 18,
    offsetMin: 8,
    offsetMax: 26,
    sizeMin: [2.6, 2.2, 2.6],
    sizeMax: [4.6, 3.4, 4.6],
    colors: ['#8a6f4d', '#a5825c', '#7a8b6f'],
    density: 0.55,
  },
  far: {
    kind: 'hills',
    color: '#8d7a5e',
    distMin: 80,
    distMax: 170,
    spacing: 55,
    heightMin: 20,
    heightMax: 40,
  },
}

/**
 * Village-specific look values (terrain/props/movers). Only this biome reads
 * these; shared systems keep using villageConfig.env above.
 */
export const villageArt = {
  terrain: {
    earth: '#7d6647',
    sage: '#71835f',
    shoulder: '#8a7a5c', // worn dust beside the asphalt
    mustardField: '#b3973c',
    mustardRow: '#8f7a2e',
    greenField: '#6f8b4a',
    greenRow: '#5a7440',
  },
  trees: {
    trunk: '#6b4a33',
    canopyA: '#7a8b6f', // sage
    canopyB: '#4e6b4a', // deep leaf
    canopyC: '#8a8b58', // warm olive
  },
  huts: {
    wallA: '#a5825c',
    wallB: '#b3906a',
    wallC: '#8a6f4d',
    roofTerracotta: '#8a4a32',
    roofThatch: '#9a7a4a',
    door: '#3a2c20',
  },
  crops: {
    mustardBloom: '#d8b93e', // the marigold accent carries the chapter
    mustardStem: '#a9973c',
    green: '#7a9a50',
  },
  smoke: { color: '#c4b09a', opacity: 0.32 },
  birds: { color: '#241f1a' },
} as const
