/**
 * Runs of consecutive ranks — straights and twin straights.
 *
 * House rule: a run may be any length from MIN_RUN upward. A straight holds one
 * card per rank (3, 4, 5, 6 … cards); a twin straight holds two per rank (6, 8,
 * 10 … cards). Jokers are wild and stand in for whatever rank a run is missing.
 *
 * Everything here is pure — nothing sorts or edits the caller's cards.
 */

export interface RunCard {
  type: number
  number: number
}

/** Shortest run the table allows, counted in ranks rather than cards. */
export const MIN_RUN = 3

/**
 * Ranks a card can hold: 1 is the 3, 13 is the 2. Jokers carry 0.
 *
 * A run stops at the Ace. The 2 is the highest single card in the game and is
 * never part of a straight or twin straight, so runs live inside 1..12.
 */
const MIN_RANK = 1
const MAX_RUN_RANK = 12

const isJoker = (card: RunCard): boolean => card.number === 0

interface RunShape {
  /** How many ranks long the run is. */
  runLength: number
  /** Lowest and highest rank the run covers. */
  lo: number
  hi: number
}

/**
 * Works out which run a hand forms, or null if it cannot form one.
 *
 * Where jokers leave the run free to slide, it is read as high as it will go,
 * which is the strongest hand the player could mean.
 */
const runShape = (cards: readonly RunCard[], perRank: number): RunShape | null => {
  const total = cards.length
  if (total === 0 || total % perRank !== 0) return null

  const runLength = total / perRank
  if (runLength < MIN_RUN || runLength > MAX_RUN_RANK) return null

  const real = cards.filter((card) => !isJoker(card))

  // No rank may appear more often than the run has room for.
  const seen = new Map<number, number>()
  for (const card of real) {
    // Rejects the 2 (rank 13) outright, along with anything out of range.
    if (card.number < MIN_RANK || card.number > MAX_RUN_RANK) return null
    const next = (seen.get(card.number) ?? 0) + 1
    if (next > perRank) return null
    seen.set(card.number, next)
  }

  // A hand of nothing but jokers can never be long enough to make a run, but
  // handle it rather than reading Math.min of an empty list.
  if (real.length === 0) return null

  const lowestCard = Math.min(...real.map((card) => card.number))
  const highestCard = Math.max(...real.map((card) => card.number))
  if (highestCard - lowestCard + 1 > runLength) return null

  // The run has to cover every real card and stay inside the rank range.
  const highestStart = Math.min(lowestCard, MAX_RUN_RANK - runLength + 1)
  const lowestStart = Math.max(MIN_RANK, highestCard - runLength + 1)
  if (highestStart < lowestStart) return null

  return { runLength, lo: highestStart, hi: highestStart + runLength - 1 }
}

export const isStraight = (cards: readonly RunCard[]): boolean => runShape(cards, 1) !== null

export const isTwinStraight = (cards: readonly RunCard[]): boolean => runShape(cards, 2) !== null

/** Lowest and highest rank of a run, reading jokers as the rank they fill. */
export const runRange = (
  cards: readonly RunCard[],
  perRank: number
): { lo: number; hi: number; runLength: number } | null => runShape(cards, perRank)

/**
 * The concrete cards a run stands for, with every joker given the rank it is
 * standing in for. Returns null when the hand is not a run.
 */
export const resolveRun = (cards: readonly RunCard[], perRank: number): RunCard[] | null => {
  const shape = runShape(cards, perRank)
  if (!shape) return null

  // Start from a full run, then tick off the ranks the real cards already cover.
  const missing = new Map<number, number>()
  for (let rank = shape.lo; rank <= shape.hi; rank += 1) missing.set(rank, perRank)

  const resolved: RunCard[] = []
  const jokers: RunCard[] = []
  for (const card of cards) {
    if (isJoker(card)) {
      jokers.push(card)
      continue
    }
    missing.set(card.number, (missing.get(card.number) ?? 0) - 1)
    resolved.push({ type: card.type, number: card.number })
  }

  for (const [rank, count] of missing) {
    for (let i = 0; i < count; i += 1) {
      const joker = jokers.pop()
      if (!joker) return null
      resolved.push({ type: joker.type, number: rank })
    }
  }

  resolved.sort((a, b) => (a.number - b.number ? a.number - b.number : a.type - b.type))
  return resolved
}
