import {
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { getZoneRoad } from '../../world/roadSamples'
import { createRng, rngRange } from '../../../utils/random'
import { SKILL_BOARDS } from '../../../content'

/**
 * Ch3 Highway statics, built once and module-cached: dry scrub plains,
 * milestone stones, and the skill hoardings — big sun-bleached roadside
 * boards carrying the stack (DESIGN: hoardings double as skill boards).
 */

const ZONE = 3
const SEED = 4303

const SCRUB_GEO = new IcosahedronGeometry(1, 0)
const SCRUB_MAT = new MeshStandardMaterial({ roughness: 0.95, flatShading: true })
const POLE_GEO = new CylinderGeometry(0.09, 0.11, 1, 6)
const POLE_MAT = new MeshStandardMaterial({ color: '#4a4a4c', metalness: 0.4, roughness: 0.6 })
const STONE_GEO = new BoxGeometry(0.4, 0.55, 0.16)
const STONE_MAT = new MeshStandardMaterial({ color: '#ddd8c8', roughness: 0.85 })
const STONE_TOP_GEO = new BoxGeometry(0.42, 0.2, 0.18)
const STONE_TOP_MAT = new MeshStandardMaterial({ color: '#c9a23a', roughness: 0.8 })
const BOARD_BACK_MAT = new MeshStandardMaterial({ color: '#5a544a', roughness: 0.8 })

/**
 * Vintage roadside ad, not a spec sheet: a fat diagonal accent ribbon with a
 * giant numeral, a headline sized to FILL the board (split on '·' so each
 * line gets huge), and the payoff line in a dark chip. Weathered, loud.
 */
function drawAdBoard(title: string, sub: string, accent: string, index: number): CanvasTexture {
  const w = 1024
  const h = 448
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#f6efdc'
  ctx.fillRect(0, 0, w, h)

  // diagonal accent ribbon with a giant index numeral
  ctx.fillStyle = accent
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(280, 0)
  ctx.lineTo(175, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = "900 300px 'Arial Black', Arial, sans-serif"
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index + 1).padStart(2, '0'), 140, h * 0.52)

  // headline: up to two lines, each auto-sized to fill the text area
  const lines: string[] = (() => {
    const parts = title.split('·').map((p) => p.trim())
    if (parts.length < 2 || title.length <= 13) return [title]
    const mid = Math.ceil(parts.length / 2)
    return [parts.slice(0, mid).join(' · '), parts.slice(mid).join(' · ')]
  })()
  const textX = 330
  const textW = w - textX - 48
  ctx.fillStyle = '#211d16'
  ctx.textAlign = 'left'
  const lineY = lines.length === 2 ? [128, 248] : [176]
  lines.forEach((line, li) => {
    let size = lines.length === 2 ? 120 : 132
    ctx.font = `900 ${size}px 'Arial Narrow', 'Arial Black', sans-serif`
    while (size > 44 && ctx.measureText(line).width > textW) {
      size -= 4
      ctx.font = `900 ${size}px 'Arial Narrow', 'Arial Black', sans-serif`
    }
    ctx.fillText(line, textX, lineY[li])
  })

  // payoff chip
  ctx.fillStyle = '#211d16'
  const chipY = h - 108
  ctx.fillRect(textX, chipY, textW, 66)
  ctx.fillStyle = '#f6efdc'
  let subSize = 36
  ctx.font = `700 ${subSize}px 'Arial Narrow', Arial, sans-serif`
  while (subSize > 20 && ctx.measureText(sub.toUpperCase()).width > textW - 40) {
    subSize -= 2
    ctx.font = `700 ${subSize}px 'Arial Narrow', Arial, sans-serif`
  }
  ctx.fillText(sub.toUpperCase(), textX + 20, chipY + 34)

  // frame + mono tag
  ctx.strokeStyle = '#211d16'
  ctx.lineWidth = 10
  ctx.strokeRect(5, 5, w - 10, h - 10)
  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.strokeRect(18, 18, w - 36, h - 36)
  ctx.fillStyle = 'rgba(33,29,22,0.55)'
  ctx.font = "700 22px 'Courier New', monospace"
  ctx.fillText(`NH-48 · AD SPACE Nº${index + 1}`, textX, 52)

  // years of sun
  ctx.fillStyle = 'rgba(232,226,208,0.14)'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(60,52,40,0.06)'
  for (let i = 0; i < 6; i++) {
    const x = ((i * 173) % w) + 6
    ctx.fillRect(x, 0, 8 + ((i * 37) % 16), h)
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const dummy = new Object3D()
let cachedGroup: Group | null = null
let cachedBirdAnchors: Vector3[] | null = null
let cachedTurbines: { x: number; y: number; z: number; h: number }[] | null = null

export function getHighwayTurbines(): { x: number; y: number; z: number; h: number }[] {
  getHighwayStatics()
  return cachedTurbines!
}

export function getHighwayBirdAnchors(): Vector3[] {
  getHighwayStatics()
  return cachedBirdAnchors!
}

export function getHighwayStatics(): Group {
  if (cachedGroup) return cachedGroup
  const road = getZoneRoad(ZONE)
  const rng = createRng(SEED)
  const group = new Group()
  const c = new Color()
  const pos = new Vector3()

  /* dry scrub, denser away from the shoulder */
  const scrubItems: { x: number; y: number; z: number; r: number; h: number; shade: number }[] = []
  for (let m = 0; m < road.zoneMeters; m += 6) {
    for (const side of [-1, 1]) {
      if (rng() > 0.62) continue
      const lateral = rngRange(rng, 7, 120) * side
      road.place(m + rngRange(rng, -2, 2), lateral, pos)
      scrubItems.push({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        r: rngRange(rng, 0.5, 1.5),
        h: rngRange(rng, 0.3, 0.8),
        shade: rng(),
      })
    }
  }
  const scrub = new InstancedMesh(SCRUB_GEO, SCRUB_MAT, scrubItems.length)
  const dryA = new Color('#8a8556')
  const dryB = new Color('#a39a68')
  scrubItems.forEach((s, i) => {
    dummy.position.set(s.x, s.y + s.h * 0.35, s.z)
    dummy.rotation.set(0, s.shade * Math.PI * 2, 0)
    dummy.scale.set(s.r, s.h, s.r)
    dummy.updateMatrix()
    scrub.setMatrixAt(i, dummy.matrix)
    scrub.setColorAt(i, c.lerpColors(dryA, dryB, s.shade).multiplyScalar(0.9 + s.shade * 0.2))
  })
  scrub.instanceMatrix.needsUpdate = true
  if (scrub.instanceColor) scrub.instanceColor.needsUpdate = true
  scrub.receiveShadow = true
  scrub.computeBoundingSphere()
  group.add(scrub)

  /* milestone stones every ~90m on the left shoulder */
  const stoneCount = Math.floor(road.zoneMeters / 90)
  const stones = new InstancedMesh(STONE_GEO, STONE_MAT, stoneCount)
  const stoneTops = new InstancedMesh(STONE_TOP_GEO, STONE_TOP_MAT, stoneCount)
  for (let i = 0; i < stoneCount; i++) {
    const m = 40 + i * 90
    const s = road.at(m)
    road.place(m, -5.4, pos)
    const yaw = Math.atan2(s.tx, s.tz)
    dummy.position.set(pos.x, pos.y + 0.275, pos.z)
    dummy.rotation.set(0, yaw, 0)
    dummy.scale.setScalar(1)
    dummy.updateMatrix()
    stones.setMatrixAt(i, dummy.matrix)
    dummy.position.y = pos.y + 0.62
    dummy.updateMatrix()
    stoneTops.setMatrixAt(i, dummy.matrix)
  }
  stones.instanceMatrix.needsUpdate = true
  stoneTops.instanceMatrix.needsUpdate = true
  stones.castShadow = true
  group.add(stones, stoneTops)

  /* skill hoardings — big vintage AD-SPACE posters, angled and tipped
     toward the road so they punch through the noon haze */
  const poleTransforms: { x: number; y: number; z: number; h: number; yaw: number }[] = []
  SKILL_BOARDS.forEach((board, i) => {
    const m = 55 + (i * (road.zoneMeters - 110)) / (SKILL_BOARDS.length - 1)
    const side = i % 2 === 0 ? -1 : 1
    const lateral = rngRange(rng, 10.5, 12.5) * side
    const s = road.at(m)
    road.place(m, lateral, pos)
    const yaw = Math.atan2(s.tx, s.tz) + Math.PI + side * -0.24 // face oncoming viewers

    const boardW = 13
    const boardH = 5.7
    const boardY = 6.6

    const texture = drawAdBoard(board.title, board.sub, board.accent, i)
    const face = new Mesh(
      new PlaneGeometry(boardW, boardH),
      new MeshStandardMaterial({
        map: texture,
        // a whisper of self-light keeps the poster punchy in the haze
        emissive: '#ffffff',
        emissiveMap: texture,
        emissiveIntensity: 0.22,
        roughness: 0.85,
      }),
    )
    face.position.set(pos.x, pos.y + boardY, pos.z)
    face.rotation.y = yaw
    face.rotateX(0.06) // tip the top toward the viewer, billboard-style
    face.castShadow = true
    const back = new Mesh(new BoxGeometry(boardW + 0.3, boardH + 0.3, 0.14), BOARD_BACK_MAT)
    back.position.copy(face.position)
    back.rotation.copy(face.rotation)
    back.translateZ(-0.1)
    group.add(back, face)

    // twin legs
    for (const off of [-boardW * 0.3, boardW * 0.3]) {
      const leg = new Vector3(pos.x, pos.y, pos.z)
      leg.x += Math.cos(yaw) * off
      leg.z -= Math.sin(yaw) * off
      poleTransforms.push({ x: leg.x, y: pos.y, z: leg.z, h: boardY - boardH / 2 + 0.2, yaw })
    }
  })
  const poles = new InstancedMesh(POLE_GEO, POLE_MAT, poleTransforms.length)
  poleTransforms.forEach((p, i) => {
    dummy.position.set(p.x, p.y + p.h / 2, p.z)
    dummy.rotation.set(0, p.yaw, 0)
    dummy.scale.set(1, p.h, 1)
    dummy.updateMatrix()
    poles.setMatrixAt(i, dummy.matrix)
  })
  poles.instanceMatrix.needsUpdate = true
  poles.castShadow = true
  group.add(poles)

  /* windmill towers along the horizon — rotors spin in a component */
  const turbines: { x: number; y: number; z: number; h: number }[] = []
  for (let i = 0; i < 9; i++) {
    const m = 30 + (i * (road.zoneMeters - 60)) / 8
    const side = i % 2 === 0 ? 1 : -1
    road.place(m, rngRange(rng, 52, 115) * side, pos)
    turbines.push({ x: pos.x, y: pos.y, z: pos.z, h: rngRange(rng, 22, 30) })
  }
  const TURBINE_MAT = new MeshStandardMaterial({ color: '#d8dcdc', roughness: 0.5, metalness: 0.2 })
  const towerGeo = new CylinderGeometry(0.35, 0.8, 1, 8)
  const towersMesh = new InstancedMesh(towerGeo, TURBINE_MAT, turbines.length)
  turbines.forEach((tb, i) => {
    dummy.position.set(tb.x, tb.y + tb.h / 2, tb.z)
    dummy.rotation.set(0, 0, 0)
    dummy.scale.set(1, tb.h, 1)
    dummy.updateMatrix()
    towersMesh.setMatrixAt(i, dummy.matrix)
  })
  towersMesh.instanceMatrix.needsUpdate = true
  group.add(towersMesh)
  cachedTurbines = turbines

  /* kites soar high over the plains */
  cachedBirdAnchors = [120, 300].map((m) => {
    road.place(m, rngRange(rng, -30, 30), pos)
    return new Vector3(pos.x, rngRange(rng, 45, 60), pos.z)
  })

  cachedGroup = group
  return group
}
