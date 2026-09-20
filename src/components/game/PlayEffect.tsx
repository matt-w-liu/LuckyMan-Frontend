import { useEffect, useRef } from 'react'
import { BombSprite, MissileSprite, PlaneSprite, TrainSprite } from './effectSprites'
import { EFFECT_DURATION, type EffectKind } from '../../utils/playEffect'

export interface PlayEffectProps {
  kind: EffectKind
  /** Middle of the board, in viewport pixels — where impacts land. */
  target: { x: number; y: number }
  /** Where the play came from (the seat that posted), for travelling effects. */
  origin: { x: number; y: number }
  onDone: () => void
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  maxLife: number
  colour: string
  glyph?: string
  spin: number
  rot: number
  gravity: number
}

const TITLE: Record<EffectKind, string> = {
  triplets: 'Triplet Cards',
  quads: 'Quads Cards',
  straight: 'Straight Cards',
  twinStraight: 'Twin Straight Cards',
  so: 'So — Black Joker',
  ta: 'Ta — Red Joker',
  taso: 'Ta + So',
}

const FIRE = ['#ffd426', '#ff9f1a', '#ff5e2b', '#fff6cf', '#ff3d71']
const SMOKE = ['#6b7385', '#8a94ab', '#4a5164']
const DARK = ['#1c1f2b', '#3b2f5e', '#6b6480', '#a89ec8', '#0b0e16']
const BLOOD = ['#ff3d71', '#d91d52', '#ff9f1a', '#fff0f3']

/** How far into the effect the impact lands, as a fraction of its run. */
const IMPACT_AT: Partial<Record<EffectKind, number>> = {
  triplets: 0.42,
  quads: 0.46,
}

/** How hard the board shakes on impact, in pixels, and for how long. */
const SHAKE: Partial<Record<EffectKind, { amount: number; span: number }>> = {
  triplets: { amount: 13, span: 0.3 },
  quads: { amount: 24, span: 0.36 },
}

/** When the title is on screen, as a fraction of the run. */
const titleWindow = (kind: EffectKind): { from: number; to: number } => {
  if (kind === 'triplets' || kind === 'quads') {
    const at = IMPACT_AT[kind] ?? 0
    return { from: at, to: Math.min(at + 0.5, 1) }
  }
  // The train and plane slow to a crawl through the middle; the title rides
  // along with that pause.
  if (kind === 'straight' || kind === 'twinStraight') return { from: 0.33, to: 0.7 }
  return { from: 0, to: 0.7 }
}

/**
 * Where a crossing sprite is along its path, 0..1.
 *
 * It sweeps in quickly, crawls through the middle of the board so the title can
 * be read, then speeds away again.
 */
const CRAWL_IN = 0.3
const CRAWL_OUT = 0.72
const CRAWL_FROM = 0.4
const CRAWL_TO = 0.58

const smooth = (x: number) => x * x * (3 - 2 * x)

const crossProgress = (t: number): number => {
  if (t <= CRAWL_IN) return smooth(t / CRAWL_IN) * CRAWL_FROM
  if (t <= CRAWL_OUT) {
    const inner = (t - CRAWL_IN) / (CRAWL_OUT - CRAWL_IN)
    return CRAWL_FROM + inner * (CRAWL_TO - CRAWL_FROM)
  }
  const tail = (t - CRAWL_OUT) / (1 - CRAWL_OUT)
  return CRAWL_TO + smooth(tail) * (1 - CRAWL_TO)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function PlayEffect({ kind, target, origin, onDone }: PlayEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spriteRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (prefersReducedMotion()) {
      const skip = window.setTimeout(() => doneRef.current(), 200)
      return () => window.clearTimeout(skip)
    }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const shakeRoot = document.querySelector<HTMLElement>('[data-shake-root]')

    let width = window.innerWidth
    let height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const duration = EFFECT_DURATION[kind]
    const impactAt = IMPACT_AT[kind] ?? 0
    const shake = SHAKE[kind]
    const title = titleWindow(kind)
    const particles: Particle[] = []
    const rand = (a: number, b: number) => a + Math.random() * (b - a)
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]

    const spawn = (
      x: number,
      y: number,
      count: number,
      palette: string[],
      opts: {
        speed?: number
        size?: number
        gravity?: number
        glyphs?: string[]
        life?: number
      } = {}
    ) => {
      for (let i = 0; i < count; i += 1) {
        const angle = rand(0, Math.PI * 2)
        const speed = rand(1, opts.speed ?? 9)
        const maxLife = rand(30, opts.life ?? 70)
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(3, opts.size ?? 10),
          life: maxLife,
          maxLife,
          colour: pick(palette),
          glyph: opts.glyphs ? pick(opts.glyphs) : undefined,
          spin: rand(-0.3, 0.3),
          rot: rand(0, Math.PI * 2),
          gravity: opts.gravity ?? 0.12,
        })
      }
    }

    const rings: Array<{ x: number; y: number; born: number; max: number; colour: string }> = []

    const boom = (x: number, y: number, scale: number, palette: string[], at: number) => {
      spawn(x, y, Math.round(90 * scale), palette, { speed: 15 * scale, size: 16, gravity: 0.2 })
      spawn(x, y, Math.round(34 * scale), SMOKE, { speed: 6, size: 30, gravity: -0.03, life: 110 })
      rings.push({ x, y, born: at, max: 230 * scale, colour: palette[0] })
      rings.push({ x, y, born: at + 7, max: 160 * scale, colour: '#fff6cf' })
    }

    let frame = 0
    let raf = 0
    let impacted = false
    const started = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - started) / duration, 1)
      frame += 1
      ctx.clearRect(0, 0, width, height)

      // ---- travelling sprite ----
      const sprite = spriteRef.current
      if (sprite) {
        if (kind === 'triplets') {
          // Bomb lobbed from the seat, arcing up and into the middle.
          const p = Math.min(t / impactAt, 1)
          const x = origin.x + (target.x - origin.x) * p
          const y = origin.y + (target.y - origin.y) * p - Math.sin(p * Math.PI) * 190
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + p * 540 + 'deg)'
          sprite.style.opacity = t < impactAt ? '1' : '0'
          if (t < impactAt && frame % 3 === 0) {
            spawn(x + 22, y - 22, 2, FIRE, { speed: 1.8, size: 8, gravity: -0.04, life: 28 })
          }
        } else if (kind === 'quads') {
          // Missile comes in steeply from off-screen and homes on the middle.
          const p = Math.min(t / impactAt, 1)
          const fromX = target.x + width * 0.6
          const fromY = target.y - height * 0.9
          const x = fromX + (target.x - fromX) * p
          const y = fromY + (target.y - fromY) * p
          const angle = (Math.atan2(target.y - fromY, target.x - fromX) * 180) / Math.PI
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + angle + 'deg)'
          sprite.style.opacity = t < impactAt ? '1' : '0'
          if (t < impactAt) {
            spawn(x, y, 4, SMOKE, { speed: 1.6, size: 18, gravity: -0.05, life: 65 })
            spawn(x, y, 2, FIRE, { speed: 2.2, size: 9, gravity: 0, life: 24 })
          }
        } else if (kind === 'straight') {
          // Train sweeps in, crawls past the middle, then pulls away.
          const p = crossProgress(t)
          const x = -280 + (width + 560) * p
          sprite.style.transform = 'translate(' + x + 'px,' + target.y + 'px) translate(-50%,-50%)'
          if (frame % 2 === 0) {
            spawn(x - 70, target.y - 62, 2, SMOKE, { speed: 1.2, size: 26, gravity: -0.07, life: 80 })
          }
        } else if (kind === 'twinStraight') {
          // Plane crosses the other way, with the same pause in the middle.
          const p = crossProgress(t)
          const x = width + 280 - (width + 560) * p
          const y = target.y - Math.sin(p * Math.PI) * 50
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scaleX(-1)'
          if (frame % 2 === 0) {
            spawn(x + 110, y + 6, 2, ['#e6ecfa', '#b6c0d4'], {
              speed: 0.8,
              size: 14,
              gravity: -0.01,
              life: 90,
            })
          }
        }
      }

      // ---- impact ----
      if (!impacted && t >= impactAt) {
        impacted = true
        if (kind === 'triplets') boom(target.x, target.y, 1.25, FIRE, frame)
        if (kind === 'quads') boom(target.x, target.y, 1.9, FIRE, frame)
        if (kind === 'so') {
          spawn(target.x, target.y, 90, DARK, { speed: 11, size: 15, gravity: 0.05, life: 80 })
          spawn(target.x, target.y, 26, DARK, {
            speed: 7,
            size: 30,
            gravity: -0.02,
            glyphs: ['♠', '♣'],
            life: 90,
          })
          rings.push({ x: target.x, y: target.y, born: frame, max: 200, colour: '#a89ec8' })
        }
        if (kind === 'ta') {
          spawn(target.x, target.y, 100, BLOOD, { speed: 12, size: 15, gravity: 0.06, life: 80 })
          spawn(target.x, target.y, 26, BLOOD, {
            speed: 7,
            size: 30,
            gravity: -0.03,
            glyphs: ['♥', '♦'],
            life: 90,
          })
          rings.push({ x: target.x, y: target.y, born: frame, max: 230, colour: '#ff3d71' })
        }
        if (kind === 'taso') {
          spawn(target.x, target.y, 90, BLOOD, { speed: 13, size: 16, gravity: 0.05, life: 90 })
          spawn(target.x, target.y, 90, DARK, { speed: 13, size: 16, gravity: 0.05, life: 90 })
          spawn(target.x, target.y, 30, BLOOD.concat(DARK), {
            speed: 8,
            size: 32,
            gravity: -0.02,
            glyphs: ['♠', '♥', '♦', '♣'],
            life: 100,
          })
          rings.push({ x: target.x, y: target.y, born: frame, max: 260, colour: '#ff3d71' })
          rings.push({ x: target.x, y: target.y, born: frame + 8, max: 220, colour: '#a89ec8' })
        }
      }

      // ---- screen shake, decaying after the blast ----
      if (shakeRoot) {
        const since = t - impactAt
        if (shake && impacted && since >= 0 && since < shake.span) {
          const decay = 1 - since / shake.span
          const amount = shake.amount * decay * decay
          const dx = (Math.random() - 0.5) * 2 * amount
          const dy = (Math.random() - 0.5) * 2 * amount
          shakeRoot.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'
        } else if (shakeRoot.style.transform) {
          shakeRoot.style.transform = ''
        }
      }

      // ---- shockwaves ----
      for (let i = rings.length - 1; i >= 0; i -= 1) {
        const ring = rings[i]
        const age = frame - ring.born
        if (age < 0) continue
        const p = age / 34
        if (p > 1) {
          rings.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = (1 - p) * 0.75
        ctx.strokeStyle = ring.colour
        ctx.lineWidth = 10 * (1 - p) + 1
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.max * p, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // ---- particles ----
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]
        p.life -= 1
        if (p.life <= 0) {
          particles.splice(i, 1)
          continue
        }
        p.vy += p.gravity
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.rot += p.spin

        const fade = Math.min(1, p.life / (p.maxLife * 0.5))
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.colour
        if (p.glyph) {
          ctx.font = 'bold ' + p.size * 1.8 + 'px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(p.glyph, 0, 0)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // ---- title, bursting in with a halo behind it ----
      const label = labelRef.current
      if (label) {
        const span = title.to - title.from
        const age = span > 0 ? (t - title.from) / span : 0
        if (age < 0 || age > 1) {
          label.style.opacity = '0'
        } else {
          // Snap in, hold, then fade away.
          const rise = Math.min(age / 0.16, 1)
          const fall = 1 - Math.max(0, (age - 0.74) / 0.26)
          const shown = Math.max(Math.min(rise, fall), 0)
          // Overshoot on the way in so it lands with a thump.
          const pop = rise < 1 ? 0.55 + 0.72 * rise : 1 + 0.12 * Math.max(0, 1 - (age - 0.16) * 6)
          const glow = 18 + Math.sin(age * Math.PI * 6) * 8
          label.style.opacity = String(shown)
          label.style.transform = 'translate(-50%,-50%) scale(' + pop + ')'
          label.style.textShadow =
            '0 0 ' + glow + 'px currentColor, 0 0 ' + glow * 2.4 + 'px currentColor, 0 3px 10px rgba(0,0,0,0.95)'

          // A halo of light behind the words.
          const halo = shown * 0.5
          if (halo > 0.02) {
            const cx = target.x
            const cy = target.y - 150
            const radius = 190 * (0.6 + shown * 0.6)
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
            gradient.addColorStop(0, 'rgba(255,240,190,' + halo * 0.5 + ')')
            gradient.addColorStop(1, 'rgba(255,240,190,0)')
            ctx.save()
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }
      }

      if (t < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        if (shakeRoot) shakeRoot.style.transform = ''
        doneRef.current()
      }
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      // Never leave the board nudged off-centre.
      if (shakeRoot) shakeRoot.style.transform = ''
    }
  }, [kind, target.x, target.y, origin.x, origin.y])

  const sprite =
    kind === 'triplets' ? (
      <BombSprite />
    ) : kind === 'quads' ? (
      <MissileSprite />
    ) : kind === 'straight' ? (
      <TrainSprite />
    ) : kind === 'twinStraight' ? (
      <PlaneSprite />
    ) : null

  const labelTone =
    kind === 'ta' || kind === 'taso'
      ? 'text-punch'
      : kind === 'so'
      ? 'text-grape'
      : 'text-gold'

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998]" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {sprite && (
        <div ref={spriteRef} className="absolute left-0 top-0 will-change-transform">
          {sprite}
        </div>
      )}

      <div
        ref={labelRef}
        className={
          'absolute whitespace-nowrap text-4xl font-extrabold uppercase tracking-[0.2em] opacity-0 will-change-transform ' +
          labelTone
        }
        style={{ left: target.x, top: target.y - 150 }}
      >
        {TITLE[kind]}
      </div>
    </div>
  )
}
