import type { Card } from './cardValidation'
import { guessValidationCheck } from './cardValidation'
import { isStraight, isTwinStraight } from './cardRuns'

/**
 * Which flourish to play when a seat posts cards.
 *
 * Straights and twin straights can now be any length from three ranks up, so a
 * play's size no longer tells you its shape — a hand of three could be either a
 * triplet or a short straight. The combination is therefore read with the same
 * checks, and in the same order of precedence, that the hand validator uses.
 */
export type EffectKind =
  | 'triplets'      // 방  — three or four of a kind
  | 'quads'         // 마대 — four of a kind
  | 'straight'      // 닐리리 — a run of ranks
  | 'twinStraight'  // 쌍닐리리 — a run of pairs
  | 'so'            // 소왕 — small (black) joker
  | 'ta'            // 따왕 — big (red) joker
  | 'taso'          // 따소 — both jokers, the bomb that beats everything

const SO_TYPE = 4
const TA_TYPE = 5

/** Statuses guessValidationCheck reports for the two "of a kind" shapes. */
const BANG_STATUS = 2
const MADAE_STATUS = 3

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

  // Three or four of a kind take precedence over a run of the same size,
  // matching the order the validator resolves them in. Hand it a copy: it
  // sorts whatever it is given.
  const status = guessValidationCheck([...cards]).status
  if (status === MADAE_STATUS) return 'quads'
  if (status === BANG_STATUS) return 'triplets'

  if (isTwinStraight(cards)) return 'twinStraight'
  if (isStraight(cards)) return 'straight'

  return null
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
