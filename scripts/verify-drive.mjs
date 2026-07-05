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

// SPLINE-space stops — converted to scroll at runtime via window.__toScroll
const STOPS = [
  ['00-prologue', 0.0],
  // three village stops = the Phase 2 poster test
  ['01a-village-early', 0.07],
  ['01b-village-mid', 0.115],
  ['01c-village-late', 0.165],
  // swap set-pieces sit just before each boundary (marks: .1995/.3605/.5133)
  ['s1-swap-motorcycle', 0.1924],
  ['02-town', 0.26],
  ['s2-swap-r15', 0.3534],
  ['03-highway', 0.42],
  ['s3-swap-safari', 0.5062],
  ['04-city', 0.58],
  ['04b-city-gantry', 0.549],
  ['05-neon', 0.74],
  ['05b-neon-early', 0.7],
  ['06-circuit', 0.93],
  ['07-contact', 0.975],
  ['08-cliff-dive', 1.0],
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
  if (m.type() === 'error') {
    // github star-count fetches get rate-limited (403) under repeated test
    // runs — the app handles it (stars just don't render); not a defect
    const src = m.location()?.url ?? ''
    if (!src.includes('api.github.com')) errors.push(m.text())
  }
  if (m.type() === 'warning' && m.text().includes('GL_')) glWarnings++
})
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`))

await page.goto(TARGET, { waitUntil: 'networkidle' })
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForTimeout(2500)

const maxScroll = await page.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
)

// spline → scroll conversion + detour windows come from the app itself
const toScroll = async (spline) => page.evaluate((p) => window.__toScroll(p), spline)
const detours = await page.evaluate(() => window.__DETOURS)

const allStops = []
for (const [name, spline] of STOPS) allStops.push([name, await toScroll(spline)])
detours.forEach((d, i) => {
  allStops.push([`d${i + 1}-detour-early`, d.start + d.len * 0.3])
  allStops.push([`d${i + 1}-detour-late`, d.start + d.len * 0.75])
})
allStops.sort((a, b) => a[1] - b[1])

// The ch6 autopilot engages after 0.8s of input silence — probes must keep
// "touching the wheel" or screenshots near the finale drift mid-capture.
// A page-side interval fires zero-delta wheel events (resets the quiet
// timer, moves nothing); the autopilot probe lifts it via __allowAp.
const suppressAutopilot = (pg) =>
  pg.evaluate(() => {
    window.__allowAp = false
    window.setInterval(() => {
      if (!window.__allowAp) window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 0 }))
    }, 400)
  })
await suppressAutopilot(page)
const nudge = (pg) =>
  pg.evaluate(() => window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 0 })))

for (const [name, frac] of allStops) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * frac))
  await nudge(page)
  await page.waitForTimeout(2200) // scrub 0.8s + lenis settle
  await nudge(page)
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}${name}.png` })
  const eyebrow = await page.evaluate(
    () => document.querySelector('.title-card__eyebrow')?.textContent ?? null,
  )
  console.log(`${name}: eyebrow="${eyebrow}"`)
}

// ---- autopilot probe: enter ch6 fresh, then simulate a trackpad MOMENTUM
// TAIL (the thing that silently killed v1) and confirm the ride still
// starts driving itself once the input goes quiet
await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * 0.79))
await page.waitForTimeout(1800)
await page.evaluate(() => {
  window.__allowAp = true
})
await page.evaluate((y) => window.scrollTo(0, y), Math.round(maxScroll * 0.845))
await page.evaluate(
  () =>
    new Promise((resolve) => {
      let i = 0
      const timer = window.setInterval(() => {
        window.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 40 * Math.exp(-i / 3) }))
        if (++i >= 12) {
          window.clearInterval(timer)
          resolve(null)
        }
      }, 100)
    }),
)
await page.waitForTimeout(1600) // quiet period + ramp-in
const apA = await page.evaluate(() => window.scrollY)
await page.waitForTimeout(3500)
const apB = await page.evaluate(() => window.scrollY)
console.log(
  `autopilot (post-momentum-tail): scroll ${Math.round(apA)} → ${Math.round(apB)} ${apB - apA > 120 ? '(self-driving ✓)' : '(NOT MOVING ✗)'}`,
)
const apOk = apB - apA > 120
await page.evaluate(() => {
  window.__allowAp = false
})

// FPS is measured in a FRESH BROWSER (deviceScaleFactor 2 + 2x CPU
// throttle). Sharing the screenshot marathon's browser polluted the gate:
// its GPU process reads ~10fps low for a while after heavy capture work,
// failing runs whose isolated re-probe was a clean 60.
await page.waitForTimeout(4000)
const perfBrowser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
})
const perfPage = await perfBrowser.newPage({
  viewport: { width: 1440, height: 810 },
  deviceScaleFactor: 2,
})
const cdp = await perfPage.context().newCDPSession(perfPage)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 })
await perfPage.goto(TARGET, { waitUntil: 'domcontentloaded' })
await perfPage.waitForSelector('canvas', { timeout: 15000 })
await perfPage.waitForTimeout(3000) // let the quality ratchet settle

let minFps = Infinity
const perfToScroll = async (spline) => perfPage.evaluate((p) => window.__toScroll(p), spline)
for (const [name, spline] of [
  ['village', 0.1],
  ['city', 0.58],
  ['neon', 0.74],
]) {
  const frac = await perfToScroll(spline)
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
await perfBrowser.close()

// ---- memory / leak probe: two full journey roundtrips, then compare
// renderer-tracked resources against the settled baseline (?debug exposes gl)
const memPage = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await memPage.goto(`${TARGET}?debug`, { waitUntil: 'domcontentloaded' })
await memPage.waitForSelector('canvas', { timeout: 15000 })
await memPage.waitForTimeout(2500)
await suppressAutopilot(memPage)
const memScroll = await memPage.evaluate(
  () => document.documentElement.scrollHeight - window.innerHeight,
)
const glInfo = () =>
  memPage.evaluate(() => {
    const gl = window.__GL
    return {
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      programs: gl.info.programs.length,
      heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1,
    }
  })
const roundtrip = async () => {
  for (const f of [0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
    await memPage.evaluate((y) => window.scrollTo(0, y), Math.round(memScroll * f))
    await nudge(memPage)
    await memPage.waitForTimeout(900)
  }
}
await roundtrip()
const memBefore = await glInfo()
await roundtrip()
await roundtrip()
const memAfter = await glInfo()
console.log(
  `mem probe: geometries ${memBefore.geometries}→${memAfter.geometries}, textures ${memBefore.textures}→${memAfter.textures}, programs ${memBefore.programs}→${memAfter.programs}, heap ${memBefore.heapMB}→${memAfter.heapMB}MB`,
)
const leak =
  memAfter.geometries > memBefore.geometries + 8 || memAfter.textures > memBefore.textures + 4
if (leak) console.log('LEAK WARNING: renderer resources grew across roundtrips')
await memPage.close()

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}99-back-to-start.png` })

console.log('---')
console.log(`console errors: ${errors.length}`)
errors.slice(0, 10).forEach((e) => console.log('ERR:', e.slice(0, 240)))
console.log(`GL warnings: ${glWarnings}`)
if (minFps < 50) console.log(`FPS GATE FAILED: min ${minFps.toFixed(1)} < 50 (dpr2, cpu2x)`)
if (!apOk) console.log('AUTOPILOT GATE FAILED: ch6 did not self-drive')
await browser.close()
process.exit(errors.length > 0 || glWarnings > 0 || minFps < 50 || !apOk ? 1 : 0)
