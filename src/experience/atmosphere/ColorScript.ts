import { Color, MathUtils, Vector3 } from 'three'
import { CHAPTER_MARKS, ZONE_COUNT } from '../spline/roadPath'
import { lerp, normRange, smoothstep } from '../../utils/math'
import type { EnvConfig } from '../chapters/types'
import { CHAPTERS } from '../chapters/registry'

/**
 * The color script (ADR-5): one day of light, dawn → night → beyond.
 * sampleEnv() returns the fully interpolated environment for any progress —
 * chapter boundaries blend over ±BLEND_HALF of progress so lighting shifts
 * feel like driving into different air, never like a scene cut.
 */

const BLEND_HALF = 0.014

interface RuntimeEnv {
  fogColor: Color
  fogDensity: number
  skyColor: Color
  sunColor: Color
  sunIntensity: number
  sunDir: Vector3
  hemiSky: Color
  hemiGround: Color
  hemiIntensity: number
  toneExposure: number
}

function toRuntime(env: EnvConfig): RuntimeEnv {
  const az = MathUtils.degToRad(env.sunAzimuth)
  const el = MathUtils.degToRad(env.sunElevation)
  return {
    fogColor: new Color(env.fogColor),
    fogDensity: env.fogDensity,
    skyColor: new Color(env.skyColor),
    sunColor: new Color(env.sunColor),
    sunIntensity: env.sunIntensity,
    sunDir: new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)),
    hemiSky: new Color(env.hemiSky),
    hemiGround: new Color(env.hemiGround),
    hemiIntensity: env.hemiIntensity,
    toneExposure: env.toneExposure,
  }
}

const ZONE_ENVS: RuntimeEnv[] = CHAPTERS.map((c) => toRuntime(c.config.env))

export function createEnv(): RuntimeEnv {
  return toRuntime(CHAPTERS[0].config.env)
}

/**
 * Continuous zone coordinate: sums a smoothstep ramp at every boundary, so
 * mid-zone it's exactly the zone index and near boundaries it's fractional.
 */
export function zoneFloat(p: number): number {
  let z = 0
  for (let k = 1; k < ZONE_COUNT; k++) {
    z += smoothstep(normRange(p, CHAPTER_MARKS[k] - BLEND_HALF, CHAPTER_MARKS[k] + BLEND_HALF))
  }
  return z
}

/** Writes the interpolated environment for progress p into out (no allocation). */
export function sampleEnv(p: number, out: RuntimeEnv): RuntimeEnv {
  const zf = zoneFloat(p)
  const i = Math.min(ZONE_COUNT - 1, Math.floor(zf))
  const j = Math.min(ZONE_COUNT - 1, i + 1)
  const t = zf - i
  const a = ZONE_ENVS[i]
  const b = ZONE_ENVS[j]

  out.fogColor.lerpColors(a.fogColor, b.fogColor, t)
  out.skyColor.lerpColors(a.skyColor, b.skyColor, t)
  out.sunColor.lerpColors(a.sunColor, b.sunColor, t)
  out.hemiSky.lerpColors(a.hemiSky, b.hemiSky, t)
  out.hemiGround.lerpColors(a.hemiGround, b.hemiGround, t)
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t)
  out.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, t)
  out.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, t)
  out.toneExposure = lerp(a.toneExposure, b.toneExposure, t)
  out.sunDir.lerpVectors(a.sunDir, b.sunDir, t).normalize()
  return out
}
