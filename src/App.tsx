import { useEffect } from 'react'
import { Experience } from './experience/Experience'
import { initScrollSpine, SCROLL_PAGES } from './experience/ScrollSpine'
import { ContactTerminal } from './ui/ContactTerminal'
import { DetourOverlay } from './ui/DetourOverlay'
import { Loader } from './ui/Loader'
import { Overlay } from './ui/Overlay'

export default function App() {
  useEffect(() => initScrollSpine(), [])

  return (
    <>
      {/* The scroll runway — its height is the journey's pacing. */}
      <div className="scroll-space" style={{ height: `${SCROLL_PAGES * 100}vh` }} aria-hidden />
      <Experience />
      <Overlay />
      <DetourOverlay />
      <ContactTerminal />
      <Loader />
    </>
  )
}
