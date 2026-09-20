import { forwardRef } from 'react'
import { CENTRE_ANCHOR, heapScatter } from '../../utils/tableGeometry'
import { useCardSize } from '../../hooks/useCardSize'

interface TableCenterProps {
  /** Cards already used up — shown face-down and translucent. */
  discardCount: number
  /** Cards still to be drawn — the deck under the heap. */
  deckCount: number
  /** Marks the heap, so the end-of-trick sweep knows where to fly to. */
  onHeapRef?: (element: HTMLDivElement | null) => void
}

const MAX_HEAP_CARDS = 9

/**
 * The middle of the table: a translucent heap of spent cards with the draw deck
 * resting underneath it. The ref marks the deck, which is where the dealing
 * animation flies out from.
 */
const TableCenter = forwardRef<HTMLDivElement, TableCenterProps>(
  ({ discardCount, deckCount, onHeapRef }, ref) => {
    const { w: HEAP_CARD_W, h: HEAP_CARD_H } = useCardSize()
    const heapCards = Math.min(discardCount, MAX_HEAP_CARDS)

    return (
      <div
        className="pointer-events-none absolute z-10 flex flex-col items-center gap-1.5"
        style={{
          left: `${CENTRE_ANCHOR.x}%`,
          top: `${CENTRE_ANCHOR.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Discard heap — used cards */}
        <div
          ref={onHeapRef}
          className="relative"
          style={{ width: HEAP_CARD_W + 26, height: HEAP_CARD_H + 12 }}
        >
          {heapCards > 0 &&
            Array.from({ length: heapCards }).map((_, index) => {
              const scatter = heapScatter(index)
              return (
                <img
                  key={index}
                  src="/imgs/deck/back.svg"
                  alt=""
                  draggable={false}
                  className="absolute rounded-[7px] opacity-40 grayscale"
                  style={{
                    width: HEAP_CARD_W,
                    height: HEAP_CARD_H,
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${scatter.x}px, ${scatter.y}px) rotate(${scatter.angle}deg)`,
                  }}
                />
              )
            })}

          {discardCount > 0 && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/60">
              {discardCount} used
            </span>
          )}
        </div>

        {/* Draw deck — the cards still to come. Once it runs dry there is
            nothing left to draw, so it leaves the board entirely. */}
        {deckCount > 0 && (
          <div className="relative">
            <div ref={ref} className="relative" style={{ width: HEAP_CARD_W, height: HEAP_CARD_H }}>
              {Array.from({ length: deckCount }).map((_, index) => (
                <img
                  key={index}
                  src="/imgs/deck/back.svg"
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full rounded-[7px] ring-1 ring-black/40"
                  style={{ transform: `translate(${index * -5}px, 0px`, zIndex: index * -100 }}
                />
              ))}
            </div>
            {/* Count rides on the deck rather than below it, to keep the middle
                of the table short enough for the larger cards. */}
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-ink-900/85 px-2 py-0.5 text-sm font-extrabold tabular-nums text-mist-100 ring-1 ring-white/15">
              {deckCount}
            </span>
          </div>
        )}
      </div>
    )
  }
)

TableCenter.displayName = 'TableCenter'

export default TableCenter
