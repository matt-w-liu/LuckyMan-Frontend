import { forwardRef, type ReactNode } from 'react'
import OpponentPlayer from './OpponentPlayer'
import SeatPlayArea, { type SeatPlay } from './game/SeatPlayArea'
import TableCenter from './game/TableCenter'

export interface TableSeat {
  name?: string
  cardCount?: number
  position?: 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  isActive?: boolean
  progress?: number
  isEmpty?: boolean
  customPosition?: { x: number; y: number; usePercent?: boolean }
  originalIndex?: number
  avatarUrl?: string
  bounty?: number
  isHost?: boolean
}

export type { SeatPlay }

interface GameTableProps {
  /** One play area per seated player: placeholder, or the cards they posted. */
  seatPlays?: SeatPlay[]
  opponents?: TableSeat[]
  playerHand?: ReactNode
  gameControls?: ReactNode
  currentUserPlayer?: ReactNode
  onOpponentRef?: (index: number, element: HTMLDivElement | null) => void
  onPlayAnchorRef?: (seatIndex: number, element: HTMLDivElement | null) => void
  onHeapRef?: (element: HTMLDivElement | null) => void
  /** Marks the area your hand occupies, so the opening deal can aim at it. */
  onHandAreaRef?: (element: HTMLDivElement | null) => void
  /** Cards already spent, shown as a translucent heap in the middle. */
  discardCount?: number
  /** Cards still in the draw deck, shown under the heap. */
  deckCount?: number
  /** Shown on the felt before the round starts. */
  emptyHint?: ReactNode
  /** Hides the table furniture while the board is idle. */
  showTable?: boolean
}

const GameTable = forwardRef<HTMLDivElement, GameTableProps>(
  (
    {
      seatPlays = [],
      opponents = [],
      playerHand,
      gameControls,
      currentUserPlayer,
      onOpponentRef,
      onPlayAnchorRef,
      onHeapRef,
      onHandAreaRef,
      discardCount = 0,
      deckCount = 0,
      emptyHint,
      showTable = false,
    },
    ref
  ) => {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {/* ---------- Felt ---------- */}
        <div className="relative min-h-0 flex-1 rounded-3xl border border-ink-400/50 bg-ink-800/40 p-4">
          <div className="felt-table felt-noise absolute inset-4" />

          <div className="relative h-full w-full">
            {opponents.map((seat, index) => (
              <div
                key={seat.originalIndex ?? `seat-${index}`}
                ref={(element) => {
                  if (onOpponentRef && seat.originalIndex !== undefined) {
                    onOpponentRef(seat.originalIndex, element)
                  }
                }}
              >
                <OpponentPlayer
                  name={seat.name}
                  cardCount={seat.cardCount}
                  position={seat.position}
                  isActive={seat.isActive}
                  progress={seat.progress}
                  isEmpty={seat.isEmpty}
                  customPosition={seat.customPosition}
                  avatarUrl={seat.avatarUrl}
                  bounty={seat.bounty}
                  isHost={seat.isHost}
                />
              </div>
            ))}

            {showTable && (
              <>
                <TableCenter
                  ref={ref}
                  discardCount={discardCount}
                  deckCount={deckCount}
                  onHeapRef={onHeapRef}
                />

                {seatPlays.map((play) => (
                  <SeatPlayArea key={play.seatIndex} {...play} onAnchorRef={onPlayAnchorRef} />
                ))}
              </>
            )}

            {gameControls && (
              <div className="absolute bottom-1 left-1/2 z-40 -translate-x-1/2">{gameControls}</div>
            )}

            {!showTable && emptyHint && (
              <div className="absolute inset-0 flex items-center justify-center">{emptyHint}</div>
            )}
          </div>
        </div>

        {/* ---------- Action deck ---------- */}
        {(currentUserPlayer || playerHand) && (
          <div className="panel flex shrink-0 items-center gap-4 p-3">
            {currentUserPlayer && <div className="shrink-0">{currentUserPlayer}</div>}
            {playerHand && (
              <div ref={onHandAreaRef} className="flex min-w-0 flex-1 justify-center">
                {playerHand}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

GameTable.displayName = 'GameTable'

export default GameTable
