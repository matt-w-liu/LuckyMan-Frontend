import type { Card } from './cardValidation'

/**
 * Which flourish to play when a seat posts cards.
 *
 * The shape of a legal play is fully determined by how many cards it holds —
 * the hand validator only ever lets 1, 2, 3, 4, 5 or 10 cards be posted — so
 * the size tells us which combination was played. Jokers are the exception:
 * on their own they are the showpiece, so they get their own flourish.
 */
export type EffectKind =
  | 'triplets'      // 방  — three of a kind
  | 'quads'         // 마대 — four of a kind
  | 'straight'      // 닐리리 — five in a row
  | 'twinStraight'  // 쌍닐리리 — five consecutive pairs
  | 'so'            // 소왕 — small (black) joker
  | 'ta'            // 따왕 — big (red) joker
  | 'taso'          // 따소 — both jokers, the bomb that beats everything

const SO_TYPE = 4
const TA_TYPE = 5

export const classifyPlay = (cards: Card[] | undefined | null): EffectKind | null => {
  if (!cards || cards.length === 0) return null

  const hasSo = cards.some((card) => card.type === SO_TYPE)
  const hasTa = cards.some((card) => card.type === TA_TYPE)

  // Both jokers together — the strongest play in the game.
  if (cards.length === 2 && hasSo && hasTa) return 'taso'

  // A joker led on its own, or carried by a single partner card.
  if (cards.length <= 2) {
    if (hasTa) return 'ta'
    if (hasSo) return 'so'
    return null // an ordinary single or pair gets no flourish
  }

  switch (cards.length) {
    case 3:
      return 'triplets'
    case 4:
      return 'quads'
    case 5:
      return 'straight'
    case 10:
      return 'twinStraight'
    default:
      return null
  }
}

/** How long each flourish runs, in milliseconds. */
export const EFFECT_DURATION: Record<EffectKind, number> = {
  triplets: 1500,
  quads: 1700,
  straight: 1900,
  twinStraight: 1900,
  so: 1400,
  ta: 1500,
  taso: 1800,
}
