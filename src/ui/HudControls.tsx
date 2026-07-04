import { useEffect, useState } from 'react'
import { roadAudio } from './AudioEngine'
import { useJourney, type QualityMode } from '../state/useJourney'

/**
 * The corner HUD: sound toggle (off by default — DESIGN: tasteful toggle)
 * and the graphics tier pin. Both persist in localStorage.
 */

const MODES: readonly QualityMode[] = ['auto', 'high', 'medium', 'low']

export function HudControls() {
  const [sound, setSound] = useState(false)
  const qualityMode = useJourney((s) => s.qualityMode)
  const quality = useJourney((s) => s.quality)

  useEffect(() => {
    const saved = localStorage.getItem('rt-quality') as QualityMode | null
    if (saved && MODES.includes(saved)) useJourney.getState().setQualityMode(saved)
    // sound never auto-enables (autoplay policy + taste); ignore saved 'on'
  }, [])

  const toggleSound = () => {
    const next = !sound
    setSound(next)
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
        GFX{' '}
        {qualityMode === 'auto'
          ? `AUTO·${quality.slice(0, 3).toUpperCase()}`
          : qualityMode.toUpperCase()}
      </button>
    </div>
  )
}
