import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import './styles.css'

// the insights script only exists on Vercel — loading it locally 404s
const onVercel = !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {onVercel && <Analytics />}
  </StrictMode>,
)
