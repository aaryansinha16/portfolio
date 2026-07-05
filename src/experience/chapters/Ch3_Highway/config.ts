import type { ChapterConfig } from '../types'

/** Night run. A starry vault over the open plains — moonlit asphalt,
 * lit hoardings, galaxies overhead (owner: noon read boring). */
export const highwayConfig: ChapterConfig = {
  name: 'Highway Night',
  seed: 103,
  camera: { height: 1.9, right: 1.0, fov: 46, chase: 7.2 },
  env: {
    fogColor: '#0a0f1e',
    fogDensity: 0.0032,
    skyColor: '#0a1024',
    skyZenith: '#03050e',
    skyHorizon: '#1a2240',
    sunGlow: 0.1,
    sunColor: '#c4d6ff',
    sunIntensity: 0.55,
    sunAzimuth: 25,
    sunElevation: 58,
    hemiSky: '#1a2340',
    hemiGround: '#12141a',
    hemiIntensity: 0.4,
    toneExposure: 1.05,
    groundColor: '#23231f',
    roadTint: '#2a2c33',
  },
  greybox: {
    // Sparse: hoardings and poles, not buildings.
    spacing: 42,
    offsetMin: 8,
    offsetMax: 14,
    sizeMin: [6, 3, 0.4],
    sizeMax: [9, 4.5, 0.6],
    colors: ['#1c2130', '#181d2a'],
    density: 0.5,
  },
  far: {
    kind: 'hills',
    color: '#0e1424',
    distMin: 120,
    distMax: 240,
    spacing: 80,
    heightMin: 24,
    heightMax: 46,
  },
}
