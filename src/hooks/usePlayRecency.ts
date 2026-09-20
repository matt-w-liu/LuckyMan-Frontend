import { useEffect, useRef, useState } from 'react'

interface RecencySource {
  droppingCards?: unknown[][]
  isStart?: boolean
}

/**
 * Tracks the order seats played in during the current trick.
 *
 * The server keeps one dropped pile per seat and wipes them all when the table
 * clears, so we only need to remember which pile changed most recently. Returns
 * a sequence number per seat index — higher means more recent.
 */
export function usePlayRecency(roomData: RecencySource | null | undefined): Record<number, number> {
  const [order, setOrder] = useState<Record<number, number>>({})
  const prevRef = useRef<number[]>([])
  const seqRef = useRef(0)

  useEffect(() => {
    const piles = roomData?.droppingCards
    if (!piles) return

    const sizes = piles.map((pile) => pile?.length ?? 0)
    const prev = prevRef.current
    prevRef.current = sizes

    // Table cleared (or round reset) — forget the trick.
    if (sizes.every((size) => size === 0)) {
      seqRef.current = 0
      setOrder((current) => (Object.keys(current).length === 0 ? current : {}))
      return
    }

    const changed: number[] = []
    sizes.forEach((size, seat) => {
      if (size > 0 && size !== (prev[seat] ?? 0)) changed.push(seat)
    })
    if (changed.length === 0) return

    setOrder((current) => {
      const next = { ...current }
      changed.forEach((seat) => {
        seqRef.current += 1
        next[seat] = seqRef.current
      })
      // Drop seats whose pile was emptied.
      sizes.forEach((size, seat) => {
        if (size === 0) delete next[seat]
      })
      return next
    })
  }, [roomData])

  return order
}
