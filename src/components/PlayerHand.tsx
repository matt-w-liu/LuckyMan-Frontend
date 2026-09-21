import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import Card from './Card'
import { handStepFor, useCardSize } from '../hooks/useCardSize'
import type { Card as GameCard } from '../utils/cardValidation'

interface PlayerHandProps {
  cards: GameCard[]
  onCardSelectionChange?: (selectedCards: GameCard[]) => void
  isMyTurn?: boolean
  excludeCards?: GameCard[] // Cards to exclude from display (for animation)
  /** Hidden while cards are being dealt into the empty hand. */
  showEmptyMessage?: boolean
}

export interface PlayerHandRef {
  getSelectedCardPositions: (selectedIndices: number[]) => Array<{ x: number; y: number }>
  /** Where a newly drawn card would join the fan — just past the last card. */
  getNextCardPosition: () => { x: number; y: number } | null
}

const PlayerHand = forwardRef<PlayerHandRef, PlayerHandProps>(({ 
  cards, 
  onCardSelectionChange, 
  isMyTurn = false,
  excludeCards = [],
  showEmptyMessage = true
}, ref) => {
  const { w: cardW } = useCardSize()
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const handRowRef = useRef<HTMLDivElement | null>(null)

  useImperativeHandle(ref, () => ({
    getSelectedCardPositions: (indices: number[]) => {
      // Use requestAnimationFrame to ensure DOM is ready
      return indices.map((index) => {
        const cardElement = cardRefs.current[index]
        if (cardElement) {
          // Force a reflow to ensure element is positioned
          cardElement.offsetHeight
          const rect = cardElement.getBoundingClientRect()
          // Account for scroll position
          return {
            // x: rect.left + rect.width / 2 + window.scrollX,
            // y: rect.top + rect.height / 2 + window.scrollY,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          }
        }
        // Return center of viewport as fallback
        return { 
          // x: window.innerWidth / 2 + window.scrollX, 
          // y: window.innerHeight / 2 + window.scrollY 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2, 
        }
      })
    },

    getNextCardPosition: () => {
      const row = handRowRef.current
      if (!row) return null
      const cards = Array.from(row.children) as HTMLElement[]
      const last = cards[cards.length - 1]
      if (!last) {
        // Empty hand: the first card lands in the middle of the row.
        const rect = row.getBoundingClientRect()
        if (rect.width === 0) return null
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      }
      const rect = last.getBoundingClientRect()
      // Cards overlap, so a new one sits one visible sliver past the last.
      const step = handStepFor(cardW)
      return { x: rect.left + rect.width / 2 + step, y: rect.top + rect.height / 2 }
    },
  }))

  useEffect(() => {
    // Clear selection when it's not your turn
    if (!isMyTurn) {
      setSelectedIndices([])
    }
  }, [isMyTurn])

  useEffect(() => {
    // Notify parent of selection changes
    if (onCardSelectionChange) {
      const selectedCards: GameCard[] = selectedIndices
        .map((idx) => {
          // Ensure index is valid
          if (idx < 0 || idx >= cards.length) return null
          return cards[idx]
        })
        .filter((card): card is GameCard => card !== null)
        .filter((card) => {
          // Filter out excluded cards
          return !excludeCards.some(
            excluded => excluded.type === card.type && excluded.number === card.number
          )
        })
      onCardSelectionChange(selectedCards)
    }
  }, [selectedIndices, cards, onCardSelectionChange, excludeCards])

  const toggleCardSelection = (index: number) => {
    if (!isMyTurn) return

    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  // Convert game card format to display format
  const convertCard = (card: GameCard) => {
    // type: 0-3 are suits, 4-5 are special
    if (card.type >= 4) {
      // Special card (Ta/So) - show as face down or special
      return { suit: 0, rank: 0, isSpecial: true, specialType: card.type }
    }
    return { suit: card.type, rank: card.number }
  }

  // Filter out excluded cards - ensure proper comparison
  const displayCards = cards.filter((card) => {
    if (!card) return false
    const isExcluded = excludeCards.some(excluded => 
      excluded && excluded.type === card.type && excluded.number === card.number
    )
    return !isExcluded
  })

  if (!cards || cards.length === 0) {
    // Keep the row so the layout does not jump, and so the opening deal has
    // something to aim at while the hand is still empty.
    return (
      <div className="w-full">
        <div ref={handRowRef} className="flex justify-center items-center relative min-h-[120px]">
          {showEmptyMessage && <p className="text-mist-500">No cards in hand</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div ref={handRowRef} className="flex justify-center items-end relative min-h-[120px]">
        {displayCards.map((card, displayIndex) => {
          // Find original index in cards array
          let originalIndex = 0
          let skipped = 0
          for (let i = 0; i < cards.length; i++) {
            if (excludeCards.some(excluded => 
              excluded.type === cards[i].type && excluded.number === cards[i].number
            )) {
              skipped++
              continue
            }
            if (i - skipped === displayIndex) {
              originalIndex = i
              break
            }
          }

          const displayCard = convertCard(card)
          const isSelected = selectedIndices.includes(originalIndex) && 
            !excludeCards.some(excluded => 
              excluded.type === card.type && excluded.number === card.number
            )

          return (
            <div
              key={originalIndex}
              ref={(el) => {
                cardRefs.current[originalIndex] = el
              }}
              onClick={() => toggleCardSelection(originalIndex)}
              className={`relative ${isMyTurn ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              style={{
                // Overlap scales with the card, so the same sliver of each card
                // stays visible whatever size the board is using.
                marginLeft: displayIndex > 0 ? -Math.round(cardW * 0.37) : 0,
                zIndex: displayIndex + 10,
              }}
            >
              <Card
                suit={displayCard.isSpecial ? displayCard.specialType : displayCard.suit}
                rank={displayCard.isSpecial ? 0 : displayCard.rank}
                isSelected={isSelected}
                isMyTurn={isMyTurn}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})

PlayerHand.displayName = 'PlayerHand'

export default PlayerHand


