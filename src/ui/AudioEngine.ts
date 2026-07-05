import { CHAPTER_MARKS } from '../experience/spline/roadPath'
import { vehicleProgressAt, zoneFloat } from '../experience/atmosphere/ColorScript'
import { useJourney } from '../state/useJourney'
import { clamp01, lerp, normRange, smoothstep } from '../utils/math'

/**
 * Synthesized road audio — zero asset downloads. Each vehicle has its own
 * voice, crossfaded exactly where the swap choreography hands over:
 *   bicycle — NO engine: freewheel ticks (pitched tick-loop buffer) + wind
 *   motorcycle — small single-cylinder: low saw + slow gain lope
 *   R15 — sportier: higher base pitch, brighter filter, fast smooth rev
 *   Safari — heavier: sub-heavy saws, darker filter
 * The wind bed opens with speed and darkens at night. Sound is ON by
 * default but the context can only start on a user gesture — armOnGesture()
 * starts it with the first scroll/click/keypress (with the ignition whirr).
 */

interface VehicleVoice {
  /** engine base pitch at rest + per-m/s slope */
  pitch: number
  pitchSlope: number
  filter: number
  filterSlope: number
  gain: number
  gainSlope: number
  /** gain-LFO (engine lope): rate Hz + depth 0..1 */
  lopeRate: number
  lopeDepth: number
  /** freewheel tick loudness (bicycle only) */
  tick: number
  windMul: number
}

const VOICES: VehicleVoice[] = [
  // bicycle
  {
    pitch: 0,
    pitchSlope: 0,
    filter: 300,
    filterSlope: 0,
    gain: 0,
    gainSlope: 0,
    lopeRate: 0,
    lopeDepth: 0,
    tick: 1,
    windMul: 1.25,
  },
  // motorcycle
  {
    pitch: 52,
    pitchSlope: 0.42,
    filter: 300,
    filterSlope: 6,
    gain: 0.055,
    gainSlope: 0.0006,
    lopeRate: 11,
    lopeDepth: 0.5,
    tick: 0,
    windMul: 1,
  },
  // r15
  {
    pitch: 84,
    pitchSlope: 0.8,
    filter: 520,
    filterSlope: 10,
    gain: 0.05,
    gainSlope: 0.0007,
    lopeRate: 26,
    lopeDepth: 0.2,
    tick: 0,
    windMul: 1,
  },
  // safari
  {
    pitch: 38,
    pitchSlope: 0.32,
    filter: 240,
    filterSlope: 4.5,
    gain: 0.07,
    gainSlope: 0.0006,
    lopeRate: 8,
    lopeDepth: 0.14,
    tick: 0,
    windMul: 0.9,
  },
]

/** blended voice weights for the current spline position (swap-aware) */
function voiceWeights(spline: number): [number, number, number, number] {
  const m = vehicleProgressAt(spline)
  const w = 0.008 // blend half-width, roughly the swap window
  const t12 = smoothstep(normRange(m, CHAPTER_MARKS[2] - w, CHAPTER_MARKS[2] + w))
  const t23 = smoothstep(normRange(m, CHAPTER_MARKS[3] - w, CHAPTER_MARKS[3] + w))
  const t34 = smoothstep(normRange(m, CHAPTER_MARKS[4] - w, CHAPTER_MARKS[4] + w))
  return [1 - t12, t12 * (1 - t23), t23 * (1 - t34), t34]
}

class RoadAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private engineGain: GainNode | null = null
  private engineFilter: BiquadFilterNode | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private lope: OscillatorNode | null = null
  private lopeAmt: GainNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private tickGain: GainNode | null = null
  private tickSrc: AudioBufferSourceNode | null = null
  private raf = 0
  private disarm: (() => void) | null = null
  enabled = false

  private build() {
    if (this.ctx) return
    const ctx = new AudioContext()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    // engine: detuned saw pair → lowpass → gain (lope LFO rides the gain)
    this.engineFilter = ctx.createBiquadFilter()
    this.engineFilter.type = 'lowpass'
    this.engineFilter.frequency.value = 320
    this.engineGain = ctx.createGain()
    this.engineGain.gain.value = 0
    this.oscA = ctx.createOscillator()
    this.oscA.type = 'sawtooth'
    this.oscB = ctx.createOscillator()
    this.oscB.type = 'sawtooth'
    this.oscA.connect(this.engineFilter)
    this.oscB.connect(this.engineFilter)
    this.engineFilter.connect(this.engineGain)
    this.engineGain.connect(this.master)
    this.oscA.start()
    this.oscB.start()

    this.lope = ctx.createOscillator()
    this.lope.type = 'sine'
    this.lope.frequency.value = 11
    this.lopeAmt = ctx.createGain()
    this.lopeAmt.gain.value = 0
    this.lope.connect(this.lopeAmt)
    this.lopeAmt.connect(this.engineGain.gain)
    this.lope.start()

    // wind/road: looped noise → lowpass → gain
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const nd = noise.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const windSrc = ctx.createBufferSource()
    windSrc.buffer = noise
    windSrc.loop = true
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'lowpass'
    this.windFilter.frequency.value = 500
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0
    windSrc.connect(this.windFilter)
    this.windFilter.connect(this.windGain)
    this.windGain.connect(this.master)
    windSrc.start()

    // bicycle freewheel: a 1s loop of tick clusters, rate rides playbackRate
    const tickBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const td = tickBuf.getChannelData(0)
    for (let c = 0; c < 8; c++) {
      const start = Math.floor((c / 8) * ctx.sampleRate)
      for (let i = 0; i < 90; i++) {
        td[start + i] = (Math.random() * 2 - 1) * Math.exp(-i / 18) * 0.8
      }
    }
    this.tickSrc = ctx.createBufferSource()
    this.tickSrc.buffer = tickBuf
    this.tickSrc.loop = true
    const tickFilter = ctx.createBiquadFilter()
    tickFilter.type = 'highpass'
    tickFilter.frequency.value = 2400
    this.tickGain = ctx.createGain()
    this.tickGain.gain.value = 0
    this.tickSrc.connect(tickFilter)
    tickFilter.connect(this.tickGain)
    this.tickGain.connect(this.master)
    this.tickSrc.start()
  }

  private ignition() {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    // the bicycle era has no starter motor — a bell ping instead
    const [wBike] = voiceWeights(useJourney.getState().splineProgress)
    const t = ctx.currentTime
    if (wBike > 0.5) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1720, t)
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.07, t + 0.01)
      g.gain.setTargetAtTime(0, t + 0.05, 0.18)
      osc.connect(g)
      g.connect(this.master)
      osc.start(t)
      osc.stop(t + 1)
      return
    }
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(70, t)
    osc.frequency.linearRampToValueAtTime(190, t + 0.35)
    osc.frequency.exponentialRampToValueAtTime(52, t + 0.7)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.09, t + 0.08)
    g.gain.setTargetAtTime(0, t + 0.55, 0.12)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 900
    osc.connect(f)
    f.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 1.1)
  }

  /**
   * Sound defaults ON: start with the first user gesture. CRUCIAL: 'wheel'
   * is NOT a user-activation gesture — arming on scroll built a context the
   * browser refused to start ("The AudioContext was not allowed to start"),
   * and the one-shot listener never retried, leaving the deploy silent.
   * Only pointerdown / keydown / touchstart count as activation.
   */
  private static readonly GESTURES: readonly (keyof WindowEventMap)[] = [
    'pointerdown',
    'keydown',
    'touchstart',
  ]

  armOnGesture() {
    if (this.enabled || this.disarm) return
    const start = () => {
      cleanup()
      this.enable()
    }
    const cleanup = () => {
      RoadAudio.GESTURES.forEach((e) => window.removeEventListener(e, start))
      this.disarm = null
    }
    RoadAudio.GESTURES.forEach((e) => window.addEventListener(e, start, { passive: true }))
    this.disarm = cleanup
  }

  enable() {
    this.disarm?.()
    this.build()
    const ctx = this.ctx!
    this.enabled = true
    this.master!.gain.setTargetAtTime(0.55, ctx.currentTime, 0.25)
    // resume() only sticks inside a real activation gesture — keep retrying
    // on every gesture until the context is actually running
    const kickstart = () => {
      if (!this.enabled) {
        stopKicking()
        return
      }
      void ctx.resume().then(() => {
        if (ctx.state === 'running') {
          stopKicking()
          if (useJourney.getState().progress < 0.02) this.ignition()
        }
      })
    }
    const stopKicking = () => {
      RoadAudio.GESTURES.forEach((e) => window.removeEventListener(e, kickstart))
    }
    kickstart()
    if (ctx.state !== 'running') {
      RoadAudio.GESTURES.forEach((e) => window.addEventListener(e, kickstart, { passive: true }))
    }
    const tick = () => {
      if (!this.enabled) return
      this.update()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  /** A tiny robotic tick for UI reveals (flight-plan blocks). */
  uiClick() {
    const ctx = this.ctx
    if (!ctx || ctx.state !== 'running' || !this.master || !this.enabled) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(1480, t)
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.04)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.055, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 1200
    osc.connect(f)
    f.connect(g)
    g.connect(this.master)
    osc.start(t)
    osc.stop(t + 0.08)
  }

  disable() {
    this.disarm?.()
    this.enabled = false
    if (!this.ctx || !this.master) return
    cancelAnimationFrame(this.raf)
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.18)
  }

  private update() {
    const ctx = this.ctx
    if (!ctx) return
    const { velocity, splineProgress } = useJourney.getState()
    const speed = Math.min(velocity, 200)
    const night = clamp01(1 - Math.abs(zoneFloat(splineProgress) - 5) * 0.6)
    const w = voiceWeights(splineProgress)
    const t = ctx.currentTime

    // blend the four voices
    let pitch = 0
    let filter = 0
    let gain = 0
    let lopeRate = 0
    let lopeDepth = 0
    let windMul = 0
    let tickAmt = 0
    for (let i = 0; i < 4; i++) {
      const v = VOICES[i]
      pitch += w[i] * (v.pitch + v.pitchSlope * speed)
      filter += w[i] * (v.filter + v.filterSlope * speed)
      gain += w[i] * (v.gain + v.gainSlope * speed) * lerp(1, 1.6, clamp01(speed / 160))
      lopeRate += w[i] * (v.lopeRate + speed * 0.12)
      lopeDepth += w[i] * v.lopeDepth
      windMul += w[i] * v.windMul
      tickAmt += w[i] * v.tick
    }

    const engineOn = pitch > 4
    this.oscA!.frequency.setTargetAtTime(Math.max(30, pitch), t, 0.08)
    this.oscB!.frequency.setTargetAtTime(Math.max(30, pitch) * 1.012, t, 0.08)
    this.engineFilter!.frequency.setTargetAtTime(Math.max(150, filter), t, 0.1)
    this.engineGain!.gain.setTargetAtTime(engineOn ? gain : 0, t, 0.12)
    this.lope!.frequency.setTargetAtTime(Math.max(4, lopeRate), t, 0.1)
    this.lopeAmt!.gain.setTargetAtTime(engineOn ? gain * lopeDepth : 0, t, 0.12)

    // freewheel ticks: rate + loudness ride the speed, bicycle only
    this.tickSrc!.playbackRate.setTargetAtTime(0.35 + speed / 22, t, 0.1)
    this.tickGain!.gain.setTargetAtTime(tickAmt * clamp01(speed / 34) * 0.11, t, 0.1)

    this.windGain!.gain.setTargetAtTime(clamp01(speed / 130) * 0.16 * windMul, t, 0.15)
    this.windFilter!.frequency.setTargetAtTime((450 + speed * 13) * (1 - night * 0.4), t, 0.15)
  }
}

export const roadAudio = new RoadAudio()
