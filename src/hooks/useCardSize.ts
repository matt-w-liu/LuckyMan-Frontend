import { useEffect, useState } from 'react'

/**
 * The one card size used by every card on the board.
 *
 * Your hand, the seat placeholders, the played piles, the discard heap and the
 * draw deck all read from here, so they are always identical to each other.
 * The size steps down on shorter screens because the middle column of the felt
 * (top seat -> its pile -> heap -> deck -> your pile) has to fit inside it.
 */
export interface CardSize {
  w: number
  h: number
}

const STEPS: Array<{ minHeight: number; size: CardSize }> = [
  { minHeight: 1000, size: { w: 66, h: 92 } },
  { minHeight: 880, size: { w: 60, h: 84 } },
  { minHeight: 800, size: { w: 52, h: 73 } },
  { minHeight: 0, size: { w: 44, h: 62 } },
]

export const cardSizeFor = (viewportHeight: number): CardSize =>
  (STEPS.find((step) => viewportHeight >= step.minHeight) ?? STEPS[STEPS.length - 1]).size

/**
 * Horizontal step between cards in a posted pile. Scales with the card so the
 * same sliver of each card stays visible, and tightens as the pile grows so a
 * ten-card run still fits beside its seat.
 */
export const fanStepFor = (cardWidth: number, count: number): number => {
  if (count <= 1) return 0
  const roomy = cardWidth * 0.44
  const tight = cardWidth * 0.24
  return Math.max(tight, Math.min(roomy, (cardWidth * 2.5) / count))
}

const read = (): CardSize =>
  cardSizeFor(typeof window === 'undefined' ? 900 : window.innerHeight)

export function useCardSize(): CardSize {
  const [size, setSize] = useState<CardSize>(read)

  useEffect(() => {
    const onResize = () => {
      const next = read()
      setSize((current) => (current.w === next.w && current.h === next.h ? current : next))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}
