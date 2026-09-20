import { useEffect, useRef, useState } from 'react'

export type FeedKind = 'play' | 'pass' | 'start' | 'win' | 'pause' | 'join' | 'draw'

export interface FeedEntry {
  id: number
  kind: FeedKind
  player?: string
  text: string
  count?: number
  at: string
}

interface FeedSource {
  userArray?: Array<{ username: string }>
  havingCards?: unknown[][]
  droppingCards?: unknown[][]
  order?: number
  prevOrder?: number
  isStart?: boolean
  isFinish?: boolean
  isPaused?: boolean
  restCardCnt?: number
}

const clock = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const MAX_ENTRIES = 40

/**
 * Derives a live event feed from the room state the server already broadcasts.
 * Nothing here is invented — each entry comes from an observed state transition.
 */
export function useGameFeed(roomData: FeedSource | null | undefined): FeedEntry[] {
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const prevRef = useRef<FeedSource | null>(null)
  const idRef = useRef(0)

  useEffect(() => {
    if (!roomData) return
    const prev = prevRef.current
    prevRef.current = JSON.parse(JSON.stringify(roomData)) as FeedSource

    const next: FeedEntry[] = []
    const push = (kind: FeedKind, text: string, player?: string, count?: number) => {
      idRef.current += 1
      next.push({ id: idRef.current, kind, text, player, count, at: clock() })
    }

    const names = roomData.userArray?.map((entry) => entry.username) ?? []

    if (!prev) {
      if (roomData.isStart) push('start', 'Round in progress.')
      setEntries((current) => [...current, ...next].slice(-MAX_ENTRIES))
      return
    }

    // Players joining
    const prevNames = prev.userArray?.map((entry) => entry.username) ?? []
    names
      .filter((name) => !prevNames.includes(name))
      .forEach((name) => push('join', 'took a seat', name))

    // Round start
    if (roomData.isStart && !prev.isStart) push('start', 'Cards dealt — round started.')

    // Pause / resume
    if (roomData.isPaused && !prev.isPaused) push('pause', 'Host paused the game.')
    if (!roomData.isPaused && prev.isPaused) push('pause', 'Game resumed.')

    // Plays: a seat's dropped pile grew
    roomData.droppingCards?.forEach((pile, index) => {
      const before = prev.droppingCards?.[index]?.length ?? 0
      const after = pile?.length ?? 0
      if (after > 0 && after !== before) {
        push('play', `played ${after} card${after === 1 ? '' : 's'}`, names[index], after)
      }
    })

    // Pass: turn moved on without that seat playing
    if (
      roomData.isStart &&
      prev.isStart &&
      typeof prev.order === 'number' &&
      roomData.order !== prev.order
    ) {
      const seat = prev.order
      const playedNow = (roomData.droppingCards?.[seat]?.length ?? 0)
      const playedBefore = (prev.droppingCards?.[seat]?.length ?? 0)
      if (playedNow === playedBefore) push('pass', 'passed', names[seat])
    }

    // Everyone drew a card when the table cleared
    if (
      typeof roomData.restCardCnt === 'number' &&
      typeof prev.restCardCnt === 'number' &&
      roomData.restCardCnt < prev.restCardCnt
    ) {
      push('draw', 'Table cleared — every player drew a card.')
    }

    // Round finished
    if (roomData.isFinish && !prev.isFinish) {
      const winner = roomData.havingCards?.findIndex((hand) => (hand?.length ?? 0) === 0) ?? -1
      push('win', winner >= 0 ? 'cleared their hand and won the round' : 'Round finished.', names[winner])
    }

    if (next.length) setEntries((current) => [...current, ...next].slice(-MAX_ENTRIES))
  }, [roomData])

  return entries
}
