/**
 * Detecting the end of a trick.
 *
 * The server keeps one dropped pile per seat and wipes them all in a single
 * broadcast once the trick is over (every player has had their turn and the
 * table clears). That one transition — a populated table going empty while the
 * round is still running — is what triggers sweeping the cards into the heap.
 */

interface TrickState {
  isStart?: boolean
  isFinish?: boolean
}

const total = (piles: ReadonlyArray<ReadonlyArray<unknown>> | undefined): number =>
  (piles ?? []).reduce((sum, pile) => sum + (pile?.length ?? 0), 0)

export const isTrickSweep = (
  previousPiles: ReadonlyArray<ReadonlyArray<unknown>> | undefined,
  currentPiles: ReadonlyArray<ReadonlyArray<unknown>> | undefined,
  state: TrickState
): boolean => {
  // Not mid-round: the round either has not started or has just been scored.
  // At scoring the server puts the losers' remaining hands into the piles, so
  // guarding on isFinish keeps the result reveal from being swept away.
  if (!state.isStart || state.isFinish) return false
  if (total(currentPiles) !== 0) return false
  return total(previousPiles) > 0
}
