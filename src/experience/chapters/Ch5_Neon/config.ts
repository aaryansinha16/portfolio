import type { ChapterConfig } from '../types'

/** Night. Near-black indigo, cyan + magenta neon; the AI era, electric. */
export const neonConfig: ChapterConfig = {
  name: 'Neon Night',
  seed: 105,
  env: {
    // Fog sits a step lighter than the towers so silhouettes separate.
    fogColor: '#141931',
    fogDensity: 0.012,
    skyColor: '#090c1e',
    skyZenith: '#04060f',
    skyHorizon: '#182040',
    sunGlow: 0.15,
    sunColor: '#7d90d6',
    sunIntensity: 0.34,
    sunAzimuth: -40,
    sunElevation: 45,
    hemiSky: '#232c52',
    hemiGround: '#0d1021',
    hemiIntensity: 0.42,
    toneExposure: 0.95,
    groundColor: '#0f1326',
    roadTint: '#1a1c30',
  },
  greybox: {
    spacing: 12,
    offsetMin: 9,
    offsetMax: 30,
    sizeMin: [7, 12, 7],
    sizeMax: [12, 40, 12],
    colors: ['#1a2140', '#212a4e', '#161c38'],
    density: 0.9,
    emissiveShare: 0.35,
    emissiveColors: ['#00e5ff', '#ff2e88'],
  },
  far: {
    kind: 'towers',
    color: '#171d3d',
    distMin: 60,
    distMax: 150,
    spacing: 24,
    heightMin: 35,
    heightMax: 80,
  },
}
