import type { ChapterConfig } from '../types'

/** Morning. Plaster, slate blue, brick-rust accents; crisp clear light. */
export const townConfig: ChapterConfig = {
  name: 'Town Morning',
  seed: 102,
  env: {
    fogColor: '#c3d5e2',
    fogDensity: 0.007,
    skyColor: '#bfdcef',
    sunColor: '#fff2dc',
    sunIntensity: 1.35,
    sunAzimuth: 70,
    sunElevation: 26,
    hemiSky: '#bfd8ea',
    hemiGround: '#8c8272',
    hemiIntensity: 0.5,
    toneExposure: 1.1,
    groundColor: '#6e6553',
    roadTint: '#474850',
  },
  greybox: {
    spacing: 12,
    offsetMin: 7,
    offsetMax: 22,
    sizeMin: [4, 4, 4],
    sizeMax: [7, 9, 7],
    colors: ['#c9b79c', '#b3a184', '#4e6e81', '#c1442e'],
    density: 0.8,
  },
  far: {
    kind: 'hills',
    color: '#7d8a96',
    distMin: 90,
    distMax: 180,
    spacing: 65,
    heightMin: 16,
    heightMax: 30,
  },
}
