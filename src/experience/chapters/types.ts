/**
 * Per-chapter look/feel config. Every magic number for a chapter's look lives
 * in its `config.ts` (CLAUDE.md convention) — biomes declare values, they
 * never touch renderer/camera/fog directly. ColorScript/ChapterManager
 * interpolate between chapters.
 */

export interface EnvConfig {
  fogColor: string
  /** FogExp2 density. Visibility ≈ 3 / density meters. */
  fogDensity: number
  /** scene.background — placeholder for the Phase 2 gradient sky shader. */
  skyColor: string
  sunColor: string
  sunIntensity: number
  /** Degrees around +Y; 0 = behind the start (+Z), 90 = rider's left (+X). */
  sunAzimuth: number
  /** Degrees above horizon. */
  sunElevation: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  toneExposure: number
  /** Terrain tint under this zone (vertex-colored into the shared ground plane). */
  groundColor: string
  /**
   * Asphalt tint for this zone, vertex-colored into the road ribbon —
   * DESIGN palette: bleached at noon, near-black wet at night, trace-green
   * on the circuit board.
   */
  roadTint: string
}

export interface GreyboxPropsConfig {
  /** Meters of road per prop sample (one prop each side max per sample). */
  spacing: number
  offsetMin: number
  offsetMax: number
  /** Box size ranges in meters: [w, h, d]. */
  sizeMin: [number, number, number]
  sizeMax: [number, number, number]
  colors: string[]
  /** 0..1 chance a sample gets a prop on a given side. */
  density: number
  /** Fraction of props that glow (neon/circuit accents). */
  emissiveShare?: number
  emissiveColors?: string[]
}

export interface FarSilhouetteConfig {
  kind: 'hills' | 'towers' | 'none'
  color: string
  distMin: number
  distMax: number
  spacing: number
  heightMin: number
  heightMax: number
}

export interface ChapterConfig {
  name: string
  env: EnvConfig
  greybox: GreyboxPropsConfig
  far: FarSilhouetteConfig
  seed: number
}
