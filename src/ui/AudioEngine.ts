import { zoneFloat } from '../experience/atmosphere/ColorScript'
import { useJourney } from '../state/useJourney'
import { clamp01 } from '../utils/math'

/**
 * Synthesized road audio — zero asset downloads (everything in this project
 * is procedural, the sound too). Two layers, both driven by scroll velocity:
 *   engine — detuned saw pair through a lowpass, pitch/gain ride the speed
 *   wind   — looped noise through a lowpass that opens with speed and
 *            darkens at night (the ambience crossfade, in spirit)
 * Plus a starter whirr when the engine wakes. Off by default; the HUD
 * toggle calls enable()/disable(). AudioContext is created lazily on the
 * first user gesture (autoplay policy).
 */

class RoadAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private engineGain: GainNode | null = null
  private engineFilter: BiquadFilterNode | null = null
  private oscA: OscillatorNode | null = null
  private oscB: OscillatorNode | null = null
  private windGain: GainNode | null = null
  private windFilter: BiquadFilterNode | null = null
  private raf = 0
  enabled = false

  private build() {
    if (this.ctx) return
    const ctx = new AudioContext()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0
    this.master.connect(ctx.destination)

    // engine: two saws a few cents apart → lowpass → gain
    this.engineFilter = ctx.createBiquadFilter()
    this.engineFilter.type = 'lowpass'
    this.engineFilter.frequency.value = 320
    this.engineGain = ctx.createGain()
    this.engineGain.gain.value = 0
    this.oscA = ctx.createOscillator()
    this.oscA.type = 'sawtooth'
    this.oscA.frequency.value = 48
    this.oscB = ctx.createOscillator()
    this.oscB.type = 'sawtooth'
    this.oscB.frequency.value = 48.7
    this.oscA.connect(this.engineFilter)
    this.oscB.connect(this.engineFilter)
    this.engineFilter.connect(this.engineGain)
    this.engineGain.connect(this.master)
    this.oscA.start()
    this.oscB.start()

    // wind/road: 2s noise loop → lowpass → gain
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = noise
    src.loop = true
    this.windFilter = ctx.createBiquadFilter()
    this.windFilter.type = 'lowpass'
    this.windFilter.frequency.value = 500
    this.windGain = ctx.createGain()
    this.windGain.gain.value = 0
    src.connect(this.windFilter)
    this.windFilter.connect(this.windGain)
    this.windGain.connect(this.master)
    src.start()
  }

  private ignition() {
    const ctx = this.ctx
    if (!ctx || !this.master) return
    const t = ctx.currentTime
    // starter whirr: pitch climb + noise chirp, then settle into idle
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

  enable() {
    this.build()
    const ctx = this.ctx!
    void ctx.resume()
    this.enabled = true
    this.master!.gain.setTargetAtTime(0.55, ctx.currentTime, 0.25)
    if (useJourney.getState().progress < 0.02) this.ignition()
    const tick = () => {
      if (!this.enabled) return
      this.update()
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  disable() {
    if (!this.ctx || !this.master) return
    this.enabled = false
    cancelAnimationFrame(this.raf)
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.18)
  }

  private update() {
    const ctx = this.ctx
    if (!ctx) return
    const { velocity, splineProgress } = useJourney.getState()
    const speed = Math.min(velocity, 200)
    const night = clamp01(1 - Math.abs(zoneFloat(splineProgress) - 5) * 0.6)
    const t = ctx.currentTime

    this.oscA!.frequency.setTargetAtTime(46 + speed * 0.5, t, 0.08)
    this.oscB!.frequency.setTargetAtTime(46.8 + speed * 0.505, t, 0.08)
    this.engineFilter!.frequency.setTargetAtTime(300 + speed * 7, t, 0.1)
    this.engineGain!.gain.setTargetAtTime(0.05 + clamp01(speed / 150) * 0.1, t, 0.12)

    this.windGain!.gain.setTargetAtTime(clamp01(speed / 130) * 0.16, t, 0.15)
    this.windFilter!.frequency.setTargetAtTime((450 + speed * 13) * (1 - night * 0.4), t, 0.15)
  }
}

export const roadAudio = new RoadAudio()
