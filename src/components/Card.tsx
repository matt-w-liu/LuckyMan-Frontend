import { memo } from 'react'
import { useCardSize } from '../hooks/useCardSize'

interface CardProps {
  suit: number // 0: spades, 1: hearts, 2: diamonds, 3: clubs, 4: So (small joker), 5: Ta (big joker)
  rank: number // 1-13 (internal rank: 1=3, 2=4, ..., 8=10, 9=J, 10=Q, 11=K, 12=A, 13=2)
  isSelected?: boolean
  isFaceDown?: boolean
  isMyTurn?: boolean // Enable hover effect only when it's the player's turn
}

const DECK_PATH = '/imgs/deck'
const SUIT_CODES = ['S', 'H', 'D', 'C'] as const
const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'] as const

// Internal rank 1..13 -> face label used by the deck files (3..10, J, Q, K, A, 2)
const RANK_LABELS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as const

const getRankLabel = (internalRank: number): string => RANK_LABELS[internalRank - 1] ?? String(internalRank)

export const getCardImageSrc = (suit: number, rank: number, isFaceDown = false): string => {
  if (isFaceDown) return `${DECK_PATH}/back.svg`
  if (suit === 4) return `${DECK_PATH}/Joker1.svg`
  if (suit === 5) return `${DECK_PATH}/Joker2.svg`
  return `${DECK_PATH}/${getRankLabel(rank)}${SUIT_CODES[suit]}.svg`
}

const getCardLabel = (suit: number, rank: number, isFaceDown: boolean): string => {
  if (isFaceDown) return 'Face-down card'
  if (suit === 4) return 'So (small joker)'
  if (suit === 5) return 'Ta (big joker)'
  return `${getRankLabel(rank)} of ${SUIT_SYMBOLS[suit]}`
}

function Card({ suit, rank, isSelected = false, isFaceDown = false, isMyTurn = false }: CardProps) {
  const canHover = !isFaceDown && !isSelected && isMyTurn
  const { w, h } = useCardSize()

  return (
    <div
      style={{ width: w, height: h }}
      className={`playing-card shrink-0 rounded-[7px] select-none ${
        isFaceDown ? 'card-back-shadow' : 'card-shadow'
      } ${isSelected ? 'playing-card-selected' : ''} ${canHover ? 'playing-card-hover' : ''}`}
    >
      <img
        src={getCardImageSrc(suit, rank, isFaceDown)}
        alt={getCardLabel(suit, rank, isFaceDown)}
        className="w-full h-full object-fill rounded-[7px] pointer-events-none"
        draggable={false}
        decoding="async"
      />
    </div>
  )
}

export default memo(Card)
