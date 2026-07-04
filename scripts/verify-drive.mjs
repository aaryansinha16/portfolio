/**
 * Drives the built journey in headless Chrome (system install, no browser
 * download): screenshots every chapter, counts console errors/warnings,
 * measures FPS at three heavy chapters, and sanity-checks the scroll-back
 * remount. This is the CLAUDE.md "verify prologue + boundary + touched
 * chapter" rule, executable.
 *
 * Usage:
 *   pnpm build && pnpm preview --port 4173 &   # server must be running
 *   pnpm verify                                 # writes shots/ + report
 */
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const OUT = new URL('../shots/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })
const TARGET = process.env.TARGET ?? 'http://localhost:4173/'

const STOPS = [
  ['00-prologue', 0.0],
  // three village stops = the Phase 2 poster test
  ['01a-village-early', 0.07],
  ['01b-village-mid', 0.115],
  ['01c-village-late', 0.165],
  ['02-town', 0.26],
  ['03-highway', 0.42],
  ['04-city', 0.58],
  ['05-neon', 0.74],
  ['06-circuit', 0.93],
]

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } })

const errors = []
let glWarnings = 0
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
  if (m.type() === 'warning' && m.text().includes('GL_')) glWarnings++
})
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))

await page.goto(TARGET, { waitUntil: 'networkidle' })
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForTimeout(2500)

const maxScroll = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
)

for (const [name, frac] of STOPS) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * frac))
  await page.waitForTimeout(2200) // scrub 0.8s + lenis settle
  await page.screenshot({ path: `${OUT}${name}.png` })
  const eyebrow = await page.evaluate(
    () => document.querySelector('.title-card__eyebrow')?.textContent ?? null,
  )
  console.log(`${name}: eyebrow="${eyebrow}"`)
}

// FPS is measured on a SEPARATE Retina-like page (deviceScaleFactor 2 +
// 2x CPU throttle). Measuring at dsf 1 hid a real ~35fps regression once —
// screenshots stay dsf 1 above so review stays fast.
const perfPage = await browser.newPage({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 2,
})
const cdp = await perfPage.context().newCDPSession(perfPage)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 })
await perfPage.goto(TARGET, { waitUntil: 'domcontentloaded' })
await perfPage.waitForSelector('canvas', { timeout: 15000 })
await perfPage.waitForTimeout(3000) // let the quality ratchet settle

let minFps = Infinity
for (const [name, frac] of [
  ['village', 0.1],
  ['city', 0.58],
  ['neon', 0.74],
]) {
  await perfPage.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * frac))
  await perfPage.waitForTimeout(1500)
  const r = await perfPage.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0
        let worst = 0
        let last = performance.now()
        const t0 = last
        const tick = () => {
          const now = performance.now()
          worst = Math.max(worst, now - last)
          last = now
          frames++
          if (now - t0 < 3000) requestAnimationFrame(tick)
          else resolve({ fps: (frames / (now - t0)) * 1000, worst })
        }
        requestAnimationFrame(tick)
      }),
  )
  minFps = Math.min(minFps, r.fps)
  console.log(`fps@${name} (dpr2, cpu2x): ${r.fps.toFixed(1)}, worst frame ${r.worst.toFixed(0)}ms`)
}
await perfPage.close()

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}99-back-to-start.png` })

console.log('---')
console.log(`console errors: ${errors.length}`)
errors.slice(0, 10).forEach((e) => console.log('ERR:', e.slice(0, 240)))
console.log(`GL warnings: ${glWarnings}`)
if (minFps < 50) console.log(`FPS GATE FAILED: min ${minFps.toFixed(1)} < 50 (dpr2, cpu2x)`)
await browser.close()
process.exit(errors.length > 0 || glWarnings > 0 || minFps < 50 ? 1 : 0)
