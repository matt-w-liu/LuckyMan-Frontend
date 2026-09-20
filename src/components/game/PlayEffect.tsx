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

const LABEL: Record<EffectKind, string> = {
  triplets: 'Triplets',
  quads: 'Quads',
  straight: 'Straight',
  twinStraight: 'Twin straight',
  so: 'So — black joker',
  ta: 'Ta — red joker',
  taso: 'Ta + So',
}

const FIRE = ['#ffd426', '#ff9f1a', '#ff5e2b', '#fff6cf', '#ff3d71']
const SMOKE = ['#6b7385', '#8a94ab', '#4a5164']
const DARK = ['#1c1f2b', '#3b2f5e', '#6b6480', '#a89ec8', '#0b0e16']
const BLOOD = ['#ff3d71', '#d91d52', '#ff9f1a', '#fff0f3']

/** How far into the effect the impact lands, as a fraction of its run. */
const IMPACT_AT: Partial<Record<EffectKind, number>> = {
  triplets: 0.45,
  quads: 0.5,
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
      spawn(x, y, Math.round(70 * scale), palette, { speed: 13 * scale, size: 13, gravity: 0.2 })
      spawn(x, y, Math.round(26 * scale), SMOKE, { speed: 5, size: 22, gravity: -0.03, life: 95 })
      rings.push({ x, y, born: at, max: 190 * scale, colour: palette[0] })
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
          const y = origin.y + (target.y - origin.y) * p - Math.sin(p * Math.PI) * 160
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + p * 540 + 'deg)'
          sprite.style.opacity = t < impactAt ? '1' : '0'
          if (t < impactAt && frame % 3 === 0) {
            spawn(x + 14, y - 14, 2, FIRE, { speed: 1.6, size: 6, gravity: -0.04, life: 26 })
          }
        } else if (kind === 'quads') {
          // Missile comes in steeply from off-screen and homes on the middle.
          const p = Math.min(t / impactAt, 1)
          const fromX = target.x + width * 0.55
          const fromY = target.y - height * 0.8
          const x = fromX + (target.x - fromX) * p
          const y = fromY + (target.y - fromY) * p
          const angle = (Math.atan2(target.y - fromY, target.x - fromX) * 180) / Math.PI
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) rotate(' + angle + 'deg)'
          sprite.style.opacity = t < impactAt ? '1' : '0'
          if (t < impactAt) {
            spawn(x, y, 3, SMOKE, { speed: 1.4, size: 13, gravity: -0.05, life: 55 })
            spawn(x, y, 2, FIRE, { speed: 2, size: 7, gravity: 0, life: 22 })
          }
        } else if (kind === 'straight') {
          // Train runs the width of the board, chuffing smoke.
          const x = -220 + (width + 440) * t
          sprite.style.transform = 'translate(' + x + 'px,' + target.y + 'px) translate(-50%,-50%)'
          if (frame % 2 === 0) {
            spawn(x - 42, target.y - 40, 2, SMOKE, { speed: 1.1, size: 20, gravity: -0.07, life: 70 })
          }
        } else if (kind === 'twinStraight') {
          // Plane crosses the other way, trailing vapour.
          const x = width + 220 - (width + 440) * t
          const y = target.y - Math.sin(t * Math.PI) * 60
          sprite.style.transform =
            'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%) scaleX(-1)'
          if (frame % 2 === 0) {
            spawn(x + 70, y + 4, 2, ['#e6ecfa', '#b6c0d4'], {
              speed: 0.7,
              size: 12,
              gravity: -0.01,
              life: 80,
            })
          }
        }
      }

      // ---- impact ----
      if (!impacted && t >= impactAt) {
        impacted = true
        if (kind === 'triplets') boom(target.x, target.y, 1, FIRE, frame)
        if (kind === 'quads') boom(target.x, target.y, 1.5, FIRE, frame)
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
        ctx.lineWidth = 8 * (1 - p) + 1
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

      // ---- label fades in then out ----
      const label = labelRef.current
      if (label) {
        const show = Math.min(t / 0.2, 1) * (1 - Math.max(0, (t - 0.65) / 0.35))
        const amount = Math.max(show, 0)
        label.style.opacity = String(amount)
        label.style.transform = 'translate(-50%,-50%) scale(' + (0.9 + amount * 0.15) + ')'
      }

      if (t < 1) {
        raf = window.requestAnimationFrame(tick)
      } else {
        doneRef.current()
      }
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
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
          'absolute whitespace-nowrap text-2xl font-extrabold uppercase tracking-[0.3em] opacity-0 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] ' +
          labelTone
        }
        style={{ left: target.x, top: target.y - 120 }}
      >
        {LABEL[kind]}
      </div>
    </div>
  )
}
