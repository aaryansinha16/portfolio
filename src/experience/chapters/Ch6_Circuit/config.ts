import type { ChapterConfig } from '../types'

/** Beyond. PCB-dark void, trace-green and gold-pad accents; transcendence. */
export const circuitConfig: ChapterConfig = {
  name: 'The Circuit Board',
  seed: 106,
  camera: { height: 2.3, right: 1.2, chase: 9.5 },
  env: {
    fogColor: '#05170f',
    fogDensity: 0.011,
    skyColor: '#02100a',
    skyZenith: '#010806',
    skyHorizon: '#0b2e1e',
    sunGlow: 0.3,
    sunColor: '#b8ffd9',
    sunIntensity: 0.55,
    sunAzimuth: 0,
    sunElevation: 55,
    hemiSky: '#0f3d2e',
    hemiGround: '#04150d',
    hemiIntensity: 0.35,
    toneExposure: 1.0,
    groundColor: '#04150d',
    roadTint: '#155c39',
  },
  greybox: {
    // "Components" — chips and capacitors on the board.
    spacing: 16,
    offsetMin: 7,
    offsetMax: 34,
    sizeMin: [3, 1, 3],
    sizeMax: [8, 4, 8],
    colors: ['#0f3d2e', '#0a2a1f', '#123527'],
    density: 0.7,
    emissiveShare: 0.18,
    emissiveColors: ['#39ff88', '#e8b04b'],
  },
  far: {
    kind: 'none',
    color: '#04150d',
    distMin: 0,
    distMax: 0,
    spacing: 0,
    heightMin: 0,
    heightMax: 0,
  },
}

/** The giant board the road runs across (see roadPath finale elevation). */
export const BOARD_Y = 40.4
