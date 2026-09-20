/**
 * Geometry for the cards resting on the felt.
 *
 * Every seat owns a small play area between its avatar and the middle of the
 * table. Before a seat posts, that area shows a face-down placeholder carrying
 * the number of cards still in that player's hand. When the seat posts, the
 * cards land on the placeholder: the first card sits exactly on it and any
 * further cards fan out to the right.
 *
 * The middle of the table holds the discard heap (face-down, translucent, so it
 * reads as "already used") with the draw deck underneath it.
 */

export type EllipseSpot = { x: number; y: number; usePercent?: boolean } | 'bottom'

/**
 * The one card size used everywhere on the board — your hand, the seat
 * placeholders, the played piles, the discard heap and the draw deck. Every
 * card surface derives from this, so they can never drift apart again.
 */
export const CARD_W = 60
export const CARD_H = 84

/** Kept as names for the felt/heap so call sites read clearly. */
export const PLAY_CARD_W = CARD_W
export const PLAY_CARD_H = CARD_H
export const HEAP_CARD_W = CARD_W
export const HEAP_CARD_H = CARD_H

/** Unit vector from the table centre toward a seat. */
export const seatDirection = (spot: EllipseSpot): { dx: number; dy: number } => {
  if (spot === 'bottom') return { dx: 0, dy: 1 }
  // 38 / 32 are the ellipse semi-axes used to place the seats.
  const dx = (spot.x - 50) / 38
  const dy = (spot.y - 50) / 32
  const length = Math.hypot(dx, dy) || 1
  return { dx: dx / length, dy: dy / length }
}

/**
 * How far a play area sits from its seat, toward the table centre — in pixels,
 * not percent. The felt is far wider than it is tall, so a percentage offset
 * would fling the side seats' cards halfway across the table while leaving the
 * top seat's cards on top of its own nameplate.
 */
const SEAT_PLAY_OFFSET_PX = 92

/**
 * The local player has no avatar on the felt, so their cards rest low and to
 * the left — beside where their avatar sits in the panel below, and clear of
 * the draw deck above and the action buttons along the bottom.
 */
const BOTTOM_ANCHOR = { x: 22, y: 80 }

/** Where the centre heap and draw deck sit. */
export const CENTRE_ANCHOR = { x: 50, y: 61 }

export interface PlayAnchor {
  /** Percent position of the seat itself. */
  x: number
  y: number
  /** Pixel nudge from the seat toward the middle of the table. */
  dx: number
  dy: number
}

/** Where a seat's cards rest: just inside its avatar, toward the middle. */
export const seatPlayAnchor = (spot: EllipseSpot): PlayAnchor => {
  if (spot === 'bottom') return { ...BOTTOM_ANCHOR, dx: 0, dy: 0 }
  const { dx, dy } = seatDirection(spot)
  // seatDirection points outward, so invert it to head for the centre.
  return {
    x: spot.x,
    y: spot.y,
    dx: -dx * SEAT_PLAY_OFFSET_PX,
    dy: -dy * SEAT_PLAY_OFFSET_PX,
  }
}

/**
 * Horizontal step between cards in a posted pile. A single card sits alone on
 * the placeholder; larger piles overlap more tightly so a ten-card run still
 * fits beside its seat.
 */
export const playFanStep = (count: number): number => {
  if (count <= 1) return 0
  return Math.max(14, Math.min(26, 150 / count))
}

/** Total width of a posted pile, used to keep it inside the felt. */
export const playFanWidth = (count: number): number =>
  count <= 0 ? PLAY_CARD_W : PLAY_CARD_W + (count - 1) * playFanStep(count)

/** Stable pseudo-random scatter for the discard heap, so it looks played-on. */
export const heapScatter = (index: number): { x: number; y: number; angle: number } => {
  const a = Math.sin(index * 12.9898) * 43758.5453
  const b = Math.sin(index * 78.233) * 12345.6789
  const c = Math.sin(index * 39.425) * 24634.6345
  const frac = (n: number) => n - Math.floor(n)
  return {
    x: (frac(a) - 0.5) * 26,
    y: (frac(b) - 0.5) * 16,
    // Only a slight tilt: a steeply rotated card reads as a different size.
    angle: (frac(c) - 0.5) * 14,
  }
}

/** Cards in a full deck — mirrors TOTAL_CARDS_COUNT in the backend constants. */
export const TOTAL_CARDS_COUNT = 54

/**
 * Seat placement around the felt. The local player is always 'bottom' (they are
 * drawn in the action deck, not on the felt); everyone else is spread along the
 * top half of an ellipse, left to right.
 */
export const calculateEllipsePosition = (
  userIndex: number,
  totalSize: number
): { x: number; y: number; usePercent: boolean } | 'bottom' => {
  if (userIndex === 0) return 'bottom'

  const centerX = 50
  const centerY = 50
  const a = 38 // horizontal semi-axis, in percent
  const b = 32 // vertical semi-axis, in percent

  const opponentCount = totalSize - 1
  const angle = Math.PI * (1 - (userIndex - 1) / (opponentCount - 1 || 1))

  return {
    x: centerX + a * Math.cos(angle),
    y: centerY - b * Math.sin(angle),
    usePercent: true,
  }
}

/**
 * Which way a seat lays its posted cards out.
 *
 * A play area is nudged from its seat toward the middle of the table, so a
 * negative nudge means the placeholder sits to the LEFT of that avatar. Those
 * seats fan leftward, away from the avatar, with the newest card resting on the
 * placeholder and earlier cards trailing off to its left.
 */
export const fansLeft = (dx: number): boolean => dx < 0

/** Offset of one card in a posted pile, relative to the placeholder slot. */
export const fanOffset = (
  index: number,
  count: number,
  step: number,
  leftward: boolean
): number => (leftward ? -(count - 1 - index) * step : index * step)
