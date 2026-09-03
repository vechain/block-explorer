import { BLOCK_TIME_MS } from '@/lib/constants/network'
import type { BlockClockFeed } from './useBlockClockFeed'

export type ClockPalette = {
  accent: string
  accentAlt: string
  warm: string
  ink: string
}

type Spark = {
  angle: number
  radius: number
  rest: number
  speed: number
  size: number
  tone: number
  collapsing: boolean
  life: number
  trail: Array<[number, number]>
}
type Ripple = { radius: number; life: number; late: boolean }
type Ghost = { scale: number; life: number }

type ClockScene = {
  sparks: Spark[]
  ripples: Ripple[]
  ghosts: Ghost[]
  sealed: number | undefined
  flash: number
}

export const createScene = (): ClockScene => ({ sparks: [], ripples: [], ghosts: [], sealed: undefined, flash: 0 })

const withAlpha = (color: string, alpha: number) => {
  const rgb = color.match(/rgba?\(([^)]+)\)/)
  if (rgb) {
    const [r, g, b] = rgb[1].split(',').map(part => parseFloat(part))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const hex = color.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
  }
  return color
}

/** Block intervals elapsed since the head was seen; runs past 1 while the next block is overdue. */
const slotProgress = (feed: BlockClockFeed, now: number) =>
  feed.head ? Math.max(0, (now - feed.head.seenAt) / BLOCK_TIME_MS) : 0

const TAU = Math.PI * 2
const TICKS = 10

const newSpark = (angle: number): Spark => {
  const tone = Math.random()
  return {
    angle: angle + (Math.random() - 0.5) * 0.08,
    radius: 1,
    rest: 0.2 + tone * 0.18,
    speed: 0.08 + Math.random() * 0.12,
    size: 1.5 + Math.random() * 2,
    tone,
    collapsing: false,
    life: 1,
    trail: [],
  }
}

const mixTone = (palette: ClockPalette, tone: number) => (tone < 0.5 ? palette.accent : palette.accentAlt)

export const renderBlockClock = ({
  ctx,
  scene,
  feed,
  width,
  height,
  now,
  dt,
  palette,
  animate,
}: {
  ctx: CanvasRenderingContext2D
  scene: ClockScene
  feed: BlockClockFeed
  width: number
  height: number
  now: number
  dt: number
  palette: ClockPalette
  animate: boolean
}) => {
  ctx.clearRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  const R = Math.min(width, height) * 0.38
  const progress = slotProgress(feed, now)
  const late = progress > 1
  const turn = progress % 1
  const angle = -Math.PI / 2 + turn * TAU
  const sweep = late ? palette.warm : palette.accentAlt

  const headNumber = feed.head?.number
  if (headNumber !== undefined && scene.sealed !== headNumber) {
    if (scene.sealed !== undefined && animate) {
      scene.ripples.push({ radius: 0, life: 1, late })
      scene.ghosts.push({ scale: 1, life: 1 })
      for (const spark of scene.sparks) spark.collapsing = true
      scene.flash = 1
    }
    scene.sealed = headNumber
  }
  scene.flash = Math.max(0, scene.flash - dt * 1.6)

  if (animate) {
    let active = scene.sparks.filter(spark => !spark.collapsing).length
    while (active < feed.pending) {
      scene.sparks.push(newSpark(angle))
      active++
    }
    for (const spark of scene.sparks) {
      if (active <= feed.pending) break
      if (!spark.collapsing) {
        spark.collapsing = true
        active--
      }
    }
  }

  // ghost rings of sealed blocks drifting outward
  ctx.lineWidth = 1
  scene.ghosts = scene.ghosts.filter(ghost => ghost.life > 0)
  for (const ghost of scene.ghosts) {
    ghost.scale += dt * 0.09
    ghost.life -= dt * 0.35
    ctx.strokeStyle = withAlpha(palette.accent, 0.18 * ghost.life)
    ctx.beginPath()
    ctx.arc(cx, cy, R * ghost.scale, 0, TAU)
    ctx.stroke()
  }

  // track and second ticks
  ctx.lineWidth = 1.5
  ctx.strokeStyle = withAlpha(palette.ink, 0.1)
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, TAU)
  ctx.stroke()
  for (let i = 0; i < TICKS; i++) {
    const a = -Math.PI / 2 + (i / TICKS) * TAU
    const lit = late || i / TICKS <= turn
    ctx.strokeStyle = lit ? withAlpha(sweep, 0.7) : withAlpha(palette.ink, 0.14)
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8))
    ctx.lineTo(cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16))
    ctx.stroke()
  }

  // progress arc
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  if (late) {
    ctx.strokeStyle = withAlpha(palette.warm, 0.5)
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, TAU)
    ctx.stroke()
  }
  if (turn > 0.002) {
    if (typeof ctx.createConicGradient === 'function') {
      const gradient = ctx.createConicGradient(-Math.PI / 2, cx, cy)
      gradient.addColorStop(0, withAlpha(palette.accent, 0.25))
      gradient.addColorStop(turn, withAlpha(sweep, 0.95))
      gradient.addColorStop(Math.min(1, turn + 0.001), 'rgba(0,0,0,0)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.strokeStyle = gradient
    } else {
      ctx.strokeStyle = withAlpha(sweep, 0.9)
    }
    ctx.beginPath()
    ctx.arc(cx, cy, R, -Math.PI / 2, angle)
    ctx.stroke()
  }

  // hand
  const hx = cx + Math.cos(angle) * R
  const hy = cy + Math.sin(angle) * R
  ctx.strokeStyle = withAlpha(palette.ink, 0.9)
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(cx + Math.cos(angle) * (R - 22), cy + Math.sin(angle) * (R - 22))
  ctx.lineTo(cx + Math.cos(angle) * (R + 4), cy + Math.sin(angle) * (R + 4))
  ctx.stroke()
  ctx.fillStyle = sweep
  ctx.shadowColor = withAlpha(sweep, 0.9)
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(hx, hy, 4, 0, TAU)
  ctx.fill()
  ctx.shadowBlur = 0

  // sparks: pending transactions falling from the rim toward the core
  scene.sparks = scene.sparks.filter(spark => spark.life > 0)
  for (const spark of scene.sparks) {
    if (spark.collapsing) {
      spark.radius -= dt * 2.2
      spark.life -= dt * 1.4
      if (spark.radius < 0.02) spark.life = 0
    } else {
      spark.radius = Math.max(spark.rest, spark.radius - spark.speed * dt * 6)
    }
    spark.angle += dt * 0.12 * (0.4 + spark.tone)
    const x = cx + Math.cos(spark.angle) * R * spark.radius
    const y = cy + Math.sin(spark.angle) * R * spark.radius
    spark.trail.push([x, y])
    if (spark.trail.length > 12) spark.trail.shift()
    const color = mixTone(palette, spark.tone)
    ctx.strokeStyle = withAlpha(color, 0.25 * spark.life)
    ctx.lineWidth = 1
    ctx.beginPath()
    spark.trail.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)))
    ctx.stroke()
    ctx.fillStyle = withAlpha(color, 0.95 * spark.life)
    ctx.shadowColor = withAlpha(color, 0.8)
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(x, y, spark.size, 0, TAU)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // seal ripples
  scene.ripples = scene.ripples.filter(ripple => ripple.life > 0)
  for (const ripple of scene.ripples) {
    ripple.radius += dt * R * 2.2
    ripple.life -= dt * 1.1
    ctx.strokeStyle = withAlpha(ripple.late ? palette.warm : palette.accent, 0.6 * ripple.life)
    ctx.lineWidth = 2 + 6 * ripple.life
    ctx.beginPath()
    ctx.arc(cx, cy, ripple.radius, 0, TAU)
    ctx.stroke()
  }

  // core glow, brightening at the seal
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55)
  core.addColorStop(0, withAlpha(scene.flash > 0.5 ? palette.ink : palette.accent, 0.22 + 0.5 * scene.flash))
  core.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.55, 0, TAU)
  ctx.fill()
}
