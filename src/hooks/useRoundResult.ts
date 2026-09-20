import { useEffect, useRef, useState } from 'react'

export interface RoundResult {
  /** Unique per round end, so the overlay remounts cleanly. */
  key: number
  didWin: boolean
  winner?: string
  /** Bounty change for the local player, when it could be measured. */
  delta?: number
  cardsLeft: number
  standings: Array<{ username: string; delta?: number; cardsLeft: number; isYou: boolean }>
}

interface ResultSource {
  userArray?: Array<{ username: string; bounty: number }>
  havingCards?: unknown[][]
  isFinish?: boolean
  isStart?: boolean
}

/**
 * Watches the broadcast room state for the end of a round.
 *
 * The server sets `isFinish` once a seat empties its hand, and by then it has
 * already applied the score to `userArray[i].bounty`. We keep the last bounties
 * seen while the round was still running so we can report each player's change.
 */
export function useRoundResult(
  roomData: ResultSource | null | undefined,
  myUsername: string | undefined
): { result: RoundResult | null; dismiss: () => void } {
  const [result, setResult] = useState<RoundResult | null>(null)
  const prevBountiesRef = useRef<Record<string, number> | null>(null)
  const prevFinishRef = useRef(false)
  const keyRef = useRef(0)

  useEffect(() => {
    if (!roomData) return

    const finished = Boolean(roomData.isFinish)
    const wasFinished = prevFinishRef.current
    prevFinishRef.current = finished

    const players = roomData.userArray ?? []

    // While the round runs, remember the running bounties.
    if (!finished) {
      prevBountiesRef.current = Object.fromEntries(
        players.map((player) => [player.username, player.bounty])
      )
      if (wasFinished) setResult(null) // new round started
      return
    }

    if (wasFinished) return // already reported this round

    const before = prevBountiesRef.current
    const winnerIndex = roomData.havingCards?.findIndex((hand) => (hand?.length ?? 0) === 0) ?? -1
    const winner = winnerIndex >= 0 ? players[winnerIndex]?.username : undefined

    const standings = players.map((player, index) => ({
      username: player.username,
      delta: before && before[player.username] !== undefined
        ? player.bounty - before[player.username]
        : undefined,
      cardsLeft: roomData.havingCards?.[index]?.length ?? 0,
      isYou: player.username === myUsername,
    }))

    const mine = standings.find((entry) => entry.isYou)

    keyRef.current += 1
    setResult({
      key: keyRef.current,
      didWin: Boolean(myUsername) && winner === myUsername,
      winner,
      delta: mine?.delta,
      cardsLeft: mine?.cardsLeft ?? 0,
      standings,
    })
  }, [roomData, myUsername])

  return { result, dismiss: () => setResult(null) }
}
