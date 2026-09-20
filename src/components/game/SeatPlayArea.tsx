import Card from '../Card'
import { fanStepFor, useCardSize } from '../../hooks/useCardSize'
import { fanOffset, fansLeft } from '../../utils/tableGeometry'
import type { Card as GameCard } from '../../utils/cardValidation'

export interface SeatPlay {
  seatIndex: number
  /** Percent position of the seat on the felt. */
  x: number
  y: number
  /** Pixel nudge from the seat toward the middle of the table. */
  dx: number
  dy: number
  /** Cards this seat has posted in the current trick. */
  cards: GameCard[]
  /** Cards still in that player's hand — shown on the placeholder. */
  handCount: number
  playerName?: string
  /** True for the most recent post, which gets a highlight ring. */
  isLatest: boolean
  /** Your own seat: the empty placeholder is not drawn, your cards still are. */
  isYou?: boolean
}

interface SeatPlayAreaProps extends SeatPlay {
  /** Registers the first-card slot so fly-in animations can land on it. */
  onAnchorRef?: (seatIndex: number, element: HTMLDivElement | null) => void
}

export default function SeatPlayArea({
  seatIndex,
  x,
  y,
  dx,
  dy,
  cards,
  handCount,
  playerName,
  isLatest,
  isYou = false,
  onAnchorRef,
}: SeatPlayAreaProps) {
  const { w: cardW, h: cardH } = useCardSize()
  const step = fanStepFor(cardW, cards.length)
  const hasPlayed = cards.length > 0
  // Seats whose placeholder sits left of their avatar lay their cards out
  // leftward, so the pile never runs back over the avatar.
  const leftward = fansLeft(dx)
  const spread = Math.max(cards.length - 1, 0) * step

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        // Nudge in toward the table centre, then offset by half a card so the
        // placeholder slot is centred on the anchor point.
        transform: `translate(${dx - cardW / 2}px, ${dy - cardH / 2}px)`,
      }}
      data-seat-play={seatIndex}
    >
      {/* Measurement anchor: the first card slot. Animations land here. */}
      <div
        ref={(element) => onAnchorRef?.(seatIndex, element)}
        className="absolute left-0 top-0"
        style={{ width: cardW, height: cardH }}
        aria-hidden="true"
      />

      {hasPlayed ? (
        <div className="relative" style={{ height: cardH }}>
          {cards.map((card, index) => (
            <div
              key={index}
              className="absolute top-0 transition-all duration-300 ease-out"
              style={{
                left: fanOffset(index, cards.length, step, leftward),
                zIndex: index,
              }}
            >
              <Card
                suit={card.type}
                rank={card.type >= 4 ? 0 : card.number}
              />
            </div>
          ))}

          {isLatest && (
            <span
              className="pointer-events-none absolute rounded-lg ring-2 ring-gold/70"
              style={{
                left: (leftward ? -spread : 0) - 4,
                top: -4,
                width: cardW + spread + 8,
                height: cardH + 8,
              }}
              aria-hidden="true"
            />
          )}
        </div>
      ) : isYou ? null : (
        /* Placeholder: where this seat's cards will land, plus how many are
           still in their hand. Your own seat skips this — you can already see
           your hand, and it keeps the bottom of the felt clear for the buttons. */
        <div
          className="relative rounded-[7px] bg-black/25"
          style={{ width: cardW, height: cardH }}
        >
          <img
            src="/imgs/deck/back.svg"
            alt=""
            className="h-full w-full rounded-[7px] opacity-25"
            draggable={false}
          />
          {/* Outline drawn on top, so the card back keeps the exact card size. */}
          <span
            className="pointer-events-none absolute inset-0 rounded-[7px] border border-dashed border-white/25"
            aria-hidden="true"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-md bg-ink-900/80 px-1.5 py-0.5 text-sm font-extrabold tabular-nums text-mist-100 ring-1 ring-white/15">
              {handCount}
            </span>
          </span>
        </div>
      )}

      {/* No name tag on your own pile — you know which cards are yours. */}
      {hasPlayed && playerName && !isYou && (
        <span
          className="absolute top-full mt-1 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80"
          // Sits under the left edge of the pile, whichever way it fans.
          style={{ left: leftward ? -spread : 0 }}
          aria-hidden="true"
        >
          {playerName}
        </span>
      )}
    </div>
  )
}
