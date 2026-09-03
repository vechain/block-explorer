import { BLOCK_TIME_MS } from '@/lib/constants/network'
import { HISTORY_BLOCKS, type UsagePoint } from '@/lib/live-head/store'

type ClockFeed = { head: { number: number; seenAt: number } | undefined; pending: number; history: UsagePoint[] }

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
  skylineHead: number | undefined
  slide: number
}

export const createScene = (): ClockScene => ({
  sparks: [],
  ripples: [],
  ghosts: [],
  sealed: undefined,
  flash: 0,
  skylineHead: undefined,
  slide: 0,
})

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
const slotProgress = (feed: ClockFeed, now: number) =>
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

const easeOut = (t: number) => 1 - (1 - t) ** 3

// Gas used per block as a skyline along the floor, newest at the right edge, sliding one bar per beat.
const drawSkyline = (
  ctx: CanvasRenderingContext2D,
  scene: ClockScene,
  history: UsagePoint[],
  width: number,
  height: number,
  dt: number,
  palette: ClockPalette,
  animate: boolean,
) => {
  const newest = history.at(-1)
  if (!newest) return
  if (scene.skylineHead !== newest.number) {
    if (scene.skylineHead !== undefined && animate) scene.slide = 1
    scene.skylineHead = newest.number
  }
  scene.slide = Math.max(0, scene.slide - dt * 2)

  const pitch = width / HISTORY_BLOCKS
  const barWidth = Math.max(1, pitch * 0.55)
  const maxHeight = height * 0.34
  const shift = easeOut(scene.slide) * pitch
  history.forEach((point, i) => {
    const usage = point.gasLimit > 0 ? Math.min(1, point.gasUsed / point.gasLimit) : 0
    const x = width - (history.length - i) * pitch + (pitch - barWidth) / 2 + shift
    const barHeight = Math.max(2, usage * maxHeight)
    const isNewest = i === history.length - 1
    const alpha = isNewest ? 0.6 * (1 - scene.slide * 0.6) : 0.1 + usage * 0.3
    ctx.fillStyle = withAlpha(isNewest ? palette.accentAlt : palette.accent, alpha)
    ctx.fillRect(x, height - barHeight, barWidth, barHeight)
  })
}

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
  feed: ClockFeed
  width: number
  height: number
  now: number
  dt: number
  palette: ClockPalette
  animate: boolean
}) => {
  ctx.clearRect(0, 0, width, height)
  drawSkyline(ctx, scene, feed.history, width, height, dt, palette, animate)
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
