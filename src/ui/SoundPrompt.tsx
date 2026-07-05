import { useEffect, useRef, useState } from 'react'
import { roadAudio } from './AudioEngine'

/**
 * The one-time sound callout, anchored above the HUD's sound button. It
 * earns its pixels twice: it tells the visitor the drive has audio, and the
 * click on its button IS the user-activation gesture browsers require
 * before an AudioContext may start. Any other interaction (click, key,
 * touch, or starting to scroll) dismisses it — by then the visitor has
 * either granted the gesture or chosen the quiet ride.
 */

export function SoundPrompt() {
  const [visible, setVisible] = useState(false)
  const interacted = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!interacted.current) setVisible(true)
    }, 1600)
    const autoHide = window.setTimeout(() => setVisible(false), 18000)
    const dismiss = () => {
      interacted.current = true
      setVisible(false)
    }
    const events: readonly (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'touchstart',
      'wheel',
    ]
    events.forEach((e) => window.addEventListener(e, dismiss, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(autoHide)
      events.forEach((e) => window.removeEventListener(e, dismiss))
    }
  }, [])

  if (!visible) return null

  return (
    <div className="sound-prompt" role="dialog" aria-label="Sound recommendation">
      <p className="sound-prompt__text">
        For the full immersive experience,
        <br />
        turn the sound on.
      </p>
      <button
        className="sound-prompt__cta"
        onPointerDown={(e) => {
          e.stopPropagation()
          localStorage.setItem('rt-sound', 'on')
          roadAudio.enable()
          setVisible(false)
        }}
      >
        ◉ START WITH SOUND
      </button>
      <span className="sound-prompt__arrow" aria-hidden />
    </div>
  )
}
