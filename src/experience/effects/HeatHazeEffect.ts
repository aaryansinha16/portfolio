import { Effect } from 'postprocessing'
import { Uniform, type WebGLRenderer, type WebGLRenderTarget } from 'three'

/**
 * Noon heat shimmer (DESIGN Ch3): a subtle horizontal UV wobble in a band
 * around the horizon. Runs in the merged effect pass — near-free. Intensity
 * is driven per frame from zoneFloat so it fades in/out with the highway.
 */

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uIntensity;

void mainUv(inout vec2 uv) {
  float band = smoothstep(0.32, 0.5, uv.y) * (1.0 - smoothstep(0.5, 0.72, uv.y));
  float w = sin(uv.y * 130.0 + uTime * 2.6) + 0.6 * sin(uv.y * 71.0 - uTime * 1.9 + uv.x * 9.0);
  uv.x += w * 0.0013 * band * uIntensity;
}
`

export class HeatHazeEffect extends Effect {
  constructor() {
    super('HeatHazeEffect', FRAG, {
      uniforms: new Map<string, Uniform>([
        ['uTime', new Uniform(0)],
        ['uIntensity', new Uniform(0)],
      ]),
    })
  }

  setIntensity(v: number): void {
    this.uniforms.get('uIntensity')!.value = v
  }

  override update(
    _renderer: WebGLRenderer,
    _inputBuffer: WebGLRenderTarget,
    deltaTime?: number,
  ): void {
    this.uniforms.get('uTime')!.value += deltaTime ?? 0.016
  }
}
