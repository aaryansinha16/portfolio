import { useEffect, useState } from 'react'
import { roadAudio } from './AudioEngine'
import { useJourney, type QualityMode } from '../state/useJourney'

/**
 * The corner HUD: sound toggle and the graphics tier pin. Sound defaults
 * ON (owner call) — the context arms on the first gesture; an explicit
 * mute persists across visits.
 */

const MODES: readonly QualityMode[] = ['auto', 'high', 'medium', 'low']

export function HudControls() {
  const [sound, setSound] = useState(() => localStorage.getItem('rt-sound') !== 'off')
  const qualityMode = useJourney((s) => s.qualityMode)
  const quality = useJourney((s) => s.quality)

  useEffect(() => {
    const saved = localStorage.getItem('rt-quality') as QualityMode | null
    if (saved && MODES.includes(saved)) useJourney.getState().setQualityMode(saved)
    if (localStorage.getItem('rt-sound') !== 'off') roadAudio.armOnGesture()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleSound = () => {
    const next = !sound
    setSound(next)
    localStorage.setItem('rt-sound', next ? 'on' : 'off')
    if (next) roadAudio.enable()
    else roadAudio.disable()
  }

  const cycleQuality = () => {
    const next = MODES[(MODES.indexOf(qualityMode) + 1) % MODES.length]
    useJourney.getState().setQualityMode(next)
    localStorage.setItem('rt-quality', next)
  }

  return (
    <div className="hud">
      <button className="hud__btn" onClick={toggleSound} aria-pressed={sound}>
        {sound ? '◉ SOUND ON' : '○ SOUND OFF'}
      </button>
      <button className="hud__btn" onClick={cycleQuality} aria-label="Graphics quality">
        GFX {qualityMode === 'auto' ? `AUTO·${quality.toUpperCase()}` : qualityMode.toUpperCase()}
      </button>
    </div>
  )
}
