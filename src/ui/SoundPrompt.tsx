import { useEffect, useState } from 'react'
import { roadAudio } from './AudioEngine'
import { setScrollLocked } from '../experience/ScrollSpine'

/**
 * The sound gate (owner: mandatory, not a dismissible toast). A dark
 * overlay holds the journey at the start line until the visitor picks a
 * lane — WITH SOUND or muted. Either click is the user-activation gesture
 * browsers require before an AudioContext may start, so choosing sound
 * makes it audible instantly. Scroll is locked while the gate is up.
 */

export function SoundPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true)
      setScrollLocked(true)
    }, 900)
    // Lenis owns wheel/touch; keyboard scrolling is native — block it too
    // while the gate is up (Tab/Enter/Space still work for the buttons).
    const KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']
    const blockKeys = (e: KeyboardEvent) => {
      if (document.querySelector('.sound-gate') && KEYS.includes(e.key)) e.preventDefault()
    }
    window.addEventListener('keydown', blockKeys)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', blockKeys)
    }
  }, [])

  if (!visible) return null

  const choose = (withSound: boolean) => {
    localStorage.setItem('rt-sound', withSound ? 'on' : 'off')
    if (withSound) roadAudio.enable()
    else roadAudio.disable()
    setScrollLocked(false)
    setVisible(false)
  }

  return (
    <div className="sound-gate" role="dialog" aria-modal="true" aria-label="Sound choice">
      <div className="sound-gate__dialog">
        <p className="sound-gate__eyebrow">BEFORE YOU DRIVE</p>
        <p className="sound-gate__text">
          For the full immersive experience,
          <br />
          turn the sound on.
        </p>
        <button className="sound-gate__cta" autoFocus onClick={() => choose(true)}>
          ◉ START WITH SOUND
        </button>
        <button className="sound-gate__mute" onClick={() => choose(false)}>
          continue muted
        </button>
      </div>
    </div>
  )
}
