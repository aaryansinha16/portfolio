import { Color, MathUtils, Vector3 } from 'three'
import { CHAPTER_MARKS, ZONE_COUNT, totalLength } from '../spline/roadPath'
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
  skyZenith: Color
  skyHorizon: Color
  sunGlow: number
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
    skyZenith: new Color(env.skyZenith),
    skyHorizon: new Color(env.skyHorizon),
    sunGlow: env.sunGlow,
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
 * The one environment snapshot for the current frame. Atmosphere (mounted
 * first) samples into it; Sky and anything else lighting-aware read it the
 * same frame instead of re-sampling.
 */
export const frameEnv: RuntimeEnv = createEnv()

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
  out.skyZenith.lerpColors(a.skyZenith, b.skyZenith, t)
  out.skyHorizon.lerpColors(a.skyHorizon, b.skyHorizon, t)
  out.sunColor.lerpColors(a.sunColor, b.sunColor, t)
  out.hemiSky.lerpColors(a.hemiSky, b.hemiSky, t)
  out.hemiGround.lerpColors(a.hemiGround, b.hemiGround, t)
  out.fogDensity = lerp(a.fogDensity, b.fogDensity, t)
  out.sunGlow = lerp(a.sunGlow, b.sunGlow, t)
  out.sunIntensity = lerp(a.sunIntensity, b.sunIntensity, t)
  out.hemiIntensity = lerp(a.hemiIntensity, b.hemiIntensity, t)
  out.toneExposure = lerp(a.toneExposure, b.toneExposure, t)
  out.sunDir.lerpVectors(a.sunDir, b.sunDir, t).normalize()
  return out
}

/* ---------- per-chapter camera framing (CLAUDE.md: config-driven) ---------- */

export interface RuntimeCam {
  height: number
  right: number
  fov: number
  chase: number
}

const CAM_DEFAULTS: RuntimeCam = { height: 2.1, right: 1.2, fov: 45, chase: 8.5 }

const ZONE_CAMS: RuntimeCam[] = CHAPTERS.map((c) => ({
  height: c.config.camera?.height ?? CAM_DEFAULTS.height,
  right: c.config.camera?.right ?? CAM_DEFAULTS.right,
  fov: c.config.camera?.fov ?? CAM_DEFAULTS.fov,
  chase: c.config.camera?.chase ?? CAM_DEFAULTS.chase,
}))

/** Writes the interpolated chase-cam framing for progress p into out. */
export function sampleCamera(p: number, out: RuntimeCam): RuntimeCam {
  const zf = zoneFloat(p)
  const i = Math.min(ZONE_COUNT - 1, Math.floor(zf))
  const j = Math.min(ZONE_COUNT - 1, i + 1)
  const t = zf - i
  out.height = lerp(ZONE_CAMS[i].height, ZONE_CAMS[j].height, t)
  out.right = lerp(ZONE_CAMS[i].right, ZONE_CAMS[j].right, t)
  out.fov = lerp(ZONE_CAMS[i].fov, ZONE_CAMS[j].fov, t)
  out.chase = lerp(ZONE_CAMS[i].chase, ZONE_CAMS[j].chase, t)
  return out
}

/**
 * The vehicle rides ahead of the camera's spline coordinate by the
 * chapter's chase distance. Single source of truth — CameraRig, the
 * vehicle, the sun target and the DoF focus all call this.
 */
const chaseTmp: RuntimeCam = { ...CAM_DEFAULTS }
export function vehicleProgressAt(p: number): number {
  sampleCamera(p, chaseTmp)
  return p + chaseTmp.chase / totalLength
}
