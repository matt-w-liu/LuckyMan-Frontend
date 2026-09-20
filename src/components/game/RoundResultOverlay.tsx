import { useEffect, useRef } from 'react'
import { Crown, Layers, Trophy, X } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { ChipIcon } from '../ui/Chip'
import type { RoundResult } from '../../hooks/useRoundResult'

interface RoundResultOverlayProps {
  result: RoundResult
  onDismiss: () => void
  /** Server holds the result for 5s before resetting the table. */
  autoHideMs?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vrot: number
  color: string
  shape: 'rect' | 'circle'
  life: number
  maxLife: number
}

const WIN_COLORS = ['#ffd426', '#ffb020', '#fff6cf', '#23d18b', '#a855f7', '#3d8bff']
const LOSE_COLORS = ['#3a4463', '#46506e', '#5b6689', '#32405e']

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function RoundResultOverlay({
  result,
  onDismiss,
  autoHideMs = 5200,
}: RoundResultOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { didWin, winner, delta, cardsLeft, standings } = result

  // Auto-dismiss and Esc
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, autoHideMs)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [onDismiss, autoHideMs])

  // Particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (prefersReducedMotion()) return

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    const rand = (min: number, max: number) => min + Math.random() * (max - min)
    const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)]

    /** Celebration: confetti + chips launched upward from the lower corners. */
    const burst = (originX: number, originY: number, count: number, spread: number, tilt = 0) => {
      for (let i = 0; i < count; i += 1) {
        const angle = -Math.PI / 2 + tilt + rand(-spread, spread)
        const speed = rand(9, 20)
        const maxLife = rand(90, 170)
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(6, 13),
          rot: rand(0, Math.PI * 2),
          vrot: rand(-0.22, 0.22),
          color: pick(WIN_COLORS),
          shape: Math.random() < 0.28 ? 'circle' : 'rect',
          life: maxLife,
          maxLife,
        })
      }
    }

    /** Defeat: slow ash drifting down from above. */
    const spawnAsh = (count: number) => {
      for (let i = 0; i < count; i += 1) {
        const maxLife = rand(180, 320)
        particles.push({
          x: rand(0, width),
          y: rand(-height * 0.3, 0),
          vx: rand(-0.35, 0.35),
          vy: rand(0.7, 2.1),
          size: rand(2.5, 7),
          rot: 0,
          vrot: 0,
          color: pick(LOSE_COLORS),
          shape: 'circle',
          life: maxLife,
          maxLife,
        })
      }
    }

    if (didWin) {
      // Two cannons from the lower corners, angled inward across the screen.
      burst(width * 0.08, height + 20, 110, 0.42, 0.38)
      burst(width * 0.92, height + 20, 110, 0.42, -0.38)
    } else {
      spawnAsh(110)
    }

    let frame = 0
    let raf = 0
    const GRAVITY = 0.34
    const DRAG = 0.992

    const tick = () => {
      frame += 1
      ctx.clearRect(0, 0, width, height)

      // Follow-up volleys so the celebration lasts as long as the result is shown.
      if (didWin && (frame === 45 || frame === 95)) {
        burst(width * 0.08, height + 20, 70, 0.42, 0.38)
        burst(width * 0.92, height + 20, 70, 0.42, -0.38)
      }

      // Keep the celebration going with a light confetti fall from the top.
      if (didWin && frame % 4 === 0 && frame < 260) {
        const maxLife = rand(120, 220)
        particles.push({
          x: rand(0, width),
          y: -20,
          vx: rand(-1.2, 1.2),
          vy: rand(1.5, 3.5),
          size: rand(5, 11),
          rot: rand(0, Math.PI * 2),
          vrot: rand(-0.18, 0.18),
          color: pick(WIN_COLORS),
          shape: Math.random() < 0.25 ? 'circle' : 'rect',
          life: maxLife,
          maxLife,
        })
      }
      if (!didWin && frame % 14 === 0) spawnAsh(3)

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]
        p.life -= 1
        if (p.life <= 0 || p.y > height + 60) {
          particles.splice(i, 1)
          continue
        }

        if (didWin) {
          p.vy += GRAVITY
          p.vx *= DRAG
          p.vy *= DRAG
        } else {
          p.vx += Math.sin((frame + i) * 0.02) * 0.012
        }
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vrot

        const fade = Math.min(1, p.life / (p.maxLife * 0.35))
        ctx.save()
        ctx.globalAlpha = didWin ? fade : fade * 0.78
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }
        ctx.restore()
      }

      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [didWin])

  const signed = (value?: number) => {
    if (value === undefined) return null
    const rounded = Math.round(value)
    return `${rounded >= 0 ? '+' : '−'}${Math.abs(rounded).toLocaleString()}`
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={didWin ? 'You won the round' : 'Round lost'}
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm ${
          didWin
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(255,212,38,0.22),rgba(5,7,15,0.9)_65%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(61,72,110,0.3),rgba(3,5,12,0.94)_65%)]'
        }`}
      />

      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Result card */}
      <div
        onClick={(event) => event.stopPropagation()}
        className={`panel relative w-full max-w-md overflow-hidden p-6 text-center animate-fade-up ${
          didWin ? 'border-gold/60' : 'border-ink-400'
        }`}
      >
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-mist-500 transition hover:text-mist-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <span
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            didWin ? 'bg-gold text-ink-900 shadow-glow' : 'bg-ink-600 text-mist-500'
          }`}
        >
          {didWin ? <Trophy size={30} fill="currentColor" /> : <Layers size={28} />}
        </span>

        <h2
          className={`text-3xl font-extrabold tracking-tight ${didWin ? 'text-gold' : 'text-mist-100'}`}
        >
          {didWin ? 'You win!' : 'Round lost'}
        </h2>

        <p className="mt-1 text-sm text-mist-300">
          {didWin ? (
            'You cleared your hand first and took the pot.'
          ) : winner ? (
            <>
              <span className="font-bold text-mist-100">{winner}</span> cleared their hand first.
            </>
          ) : (
            'The round has finished.'
          )}
        </p>

        {delta !== undefined && (
          <p
            className={`mt-4 flex items-center justify-center gap-2 text-4xl font-extrabold tabular-nums ${
              delta >= 0 ? 'text-mint' : 'text-punch'
            }`}
          >
            <ChipIcon size={28} />
            {signed(delta)}
          </p>
        )}

        {!didWin && cardsLeft > 0 && (
          <p className="mt-1 text-xs text-mist-500">
            {cardsLeft} card{cardsLeft === 1 ? '' : 's'} left in your hand
          </p>
        )}

        {/* Standings */}
        <div className="mt-5 space-y-1.5 text-left">
          {standings.map((entry) => (
            <div
              key={entry.username}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                entry.isYou ? 'bg-gold/10 ring-1 ring-inset ring-gold/30' : 'bg-ink-800/60'
              }`}
            >
              <Avatar name={entry.username} size={26} ring={entry.username === winner ? 'gold' : 'none'} />
              <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-semibold text-mist-100">
                {entry.username}
                {entry.username === winner && <Crown size={12} className="text-gold" fill="currentColor" />}
              </span>
              <span className="pill pill-muted">{entry.cardsLeft}</span>
              {entry.delta !== undefined && (
                <span
                  className={`w-20 text-right text-sm font-bold tabular-nums ${
                    entry.delta >= 0 ? 'text-mint' : 'text-punch'
                  }`}
                >
                  {signed(entry.delta)}
                </span>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] text-mist-500">Next round starts shortly — click anywhere to close.</p>
      </div>
    </div>
  )
}
