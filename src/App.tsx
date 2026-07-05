import { useEffect } from 'react'
import { Experience } from './experience/Experience'
import { initScrollSpine, SCROLL_PAGES } from './experience/ScrollSpine'
import { ContactTerminal } from './ui/ContactTerminal'
import { DetourOverlay } from './ui/DetourOverlay'
import { HudControls } from './ui/HudControls'
import { Loader } from './ui/Loader'
import { Overlay } from './ui/Overlay'
import { SeoContent } from './ui/SeoContent'
import { SoundPrompt } from './ui/SoundPrompt'
import { StaticJourney } from './ui/StaticJourney'
import { PREFERS_REDUCED_MOTION } from './utils/query'
import { webglAvailable } from './utils/webgl'

// Reduced motion gets the chapter-card journey (DESIGN); so does no-WebGL.
const USE_FALLBACK = PREFERS_REDUCED_MOTION || !webglAvailable()

function DrivenJourney() {
  useEffect(() => initScrollSpine(), [])

  return (
    <>
      {/* The scroll runway — its height is the journey's pacing. */}
      <div className="scroll-space" style={{ height: `${SCROLL_PAGES * 100}vh` }} aria-hidden />
      <Experience />
      <Overlay />
      <DetourOverlay />
      <ContactTerminal />
      <HudControls />
      <SoundPrompt />
      <Loader />
      <SeoContent />
    </>
  )
}

export default function App() {
  return USE_FALLBACK ? <StaticJourney /> : <DrivenJourney />
}
