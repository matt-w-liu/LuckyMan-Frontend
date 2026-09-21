import { useEffect, useRef, useState } from 'react'
import Card from './Card'
import type { Card as GameCard } from '../utils/cardValidation'

interface CardDealAnimationProps {
  cardCount: number // Number of cards to animate (one per player)
  startPosition: { x: number; y: number }
  endPositions: Array<{ x: number; y: number }>
  onAnimationComplete: () => void
  isAnimating: boolean
  /** Flight time for one card. The opening deal uses a brisker pace. */
  flightMs?: number
  /** Delay between one card leaving and the next. */
  gapMs?: number
  /**
   * The real card behind each dealt one, where it should be revealed on
   * arrival. Your own cards turn face up as they land; everyone else's stay
   * face down, so leave those null.
   */
  faces?: Array<GameCard | null>
}

/** How long a single card takes to travel from the deck to its player. */
const FLIGHT = 420

/**
 * Delay between one card setting off and the next. Equal to the flight time, so
 * each card has landed before the following one leaves — the deck deals round
 * the table one player at a time rather than throwing everything at once.
 */
const GAP = 420

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export default function CardDealAnimation({
  cardCount,
  startPosition,
  endPositions,
  onAnimationComplete,
  isAnimating,
  flightMs = FLIGHT,
  gapMs = GAP,
  faces,
}: CardDealAnimationProps) {
  const [elapsed, setElapsed] = useState(0)
  const animationRef = useRef<number | null>(null)
  const onCompleteRef = useRef(onAnimationComplete)

  // Update ref when callback changes to avoid stale closures
  useEffect(() => {
    onCompleteRef.current = onAnimationComplete
  }, [onAnimationComplete])

  // One card per player, capped by however many landing spots we were given.
  const dealCount = Math.min(cardCount, endPositions.length)

  useEffect(() => {
    if (!isAnimating) {
      setElapsed(0)
      return
    }

    // The last card sets off only after everyone before it has been served.
    const total = Math.max(dealCount - 1, 0) * gapMs + flightMs
    const startTime = performance.now()

    const animate = (now: number) => {
      const since = now - startTime
      setElapsed(since)

      if (since < total) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          onCompleteRef.current()
        }, 50)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [isAnimating, dealCount, flightMs, gapMs])

  if (!isAnimating || dealCount === 0 || endPositions.length === 0) {
    return null
  }

  // Validate start position
  if (!startPosition || (startPosition.x === 0 && startPosition.y === 0)) {
    return null
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000]">
      {endPositions.slice(0, dealCount).map((endPos, index) => {
        // Validate end position
        if (!endPos || (endPos.x === 0 && endPos.y === 0)) {
          return null
        }

        // Each card waits its turn, then flies on its own clock.
        const local = (elapsed - index * gapMs) / flightMs
        if (local <= 0) {
          return null // this player has not been dealt to yet
        }

        // Once it lands the card stays put: the real one only appears when the
        // whole deal finishes and the new room state is applied.
        const landed = local >= 1
        const progress = easeInOutCubic(Math.min(local, 1))
        const face = landed ? faces?.[index] ?? null : null

        const x = startPosition.x + (endPos.x - startPosition.x) * progress
        const y = startPosition.y + (endPos.y - startPosition.y) * progress
        // Dealt cards fly flat — no tumble on the way to a placeholder or hand.
        const scale = 1 + Math.sin(progress * Math.PI) * 0.15

        return (
          <div
            key={`deal-${index}`}
            className="absolute"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              zIndex: 10000 + index,
              transition: 'none', // Disable CSS transitions, we're using JS animation
              willChange: 'transform', // Optimize for animation
            }}
          >
            {face ? (
              // Arrived in your hand — turn it over.
              <Card suit={face.type} rank={face.type >= 4 ? 0 : face.number} />
            ) : (
              <Card suit={0} rank={0} isFaceDown={true} />
            )}
          </div>
        )
      })}
    </div>
  )
}
