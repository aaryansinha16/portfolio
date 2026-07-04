import type { ChapterConfig } from '../types'

/** Dawn. Warm earth, sage fields, marigold accents; long soft shadows. */
export const villageConfig: ChapterConfig = {
  name: 'Village Dawn',
  seed: 101,
  env: {
    fogColor: '#e0b48c',
    fogDensity: 0.0085,
    skyColor: '#efc79e',
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
