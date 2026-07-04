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
  ['01-village', 0.1],
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

for (const [name, frac] of [
  ['village', 0.1],
  ['city', 0.58],
  ['neon', 0.74],
]) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * frac))
  await page.waitForTimeout(1500)
  const fps = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let frames = 0
        const t0 = performance.now()
        const tick = () => {
          frames++
          if (performance.now() - t0 < 3000) requestAnimationFrame(tick)
          else resolve((frames / (performance.now() - t0)) * 1000)
        }
        requestAnimationFrame(tick)
      }),
  )
  console.log(`fps@${name}: ${fps.toFixed(1)}`)
}

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}99-back-to-start.png` })

console.log('---')
console.log(`console errors: ${errors.length}`)
errors.slice(0, 10).forEach((e) => console.log('ERR:', e.slice(0, 240)))
console.log(`GL warnings: ${glWarnings}`)
await browser.close()
process.exit(errors.length > 0 || glWarnings > 0 ? 1 : 0)
