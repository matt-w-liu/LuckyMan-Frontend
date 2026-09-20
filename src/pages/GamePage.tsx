import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import AppShell from '../components/shell/AppShell'
import PlayersPanel, { type PanelPlayer } from '../components/game/PlayersPanel'
import GameFeed from '../components/game/GameFeed'
import { useGameFeed } from '../hooks/useGameFeed'
import { fanStepFor, useCardSize } from '../hooks/useCardSize'
import { isTrickSweep } from '../utils/trick'
import { classifyPlay, type EffectKind } from '../utils/playEffect'
import PlayEffect from '../components/game/PlayEffect'
import { useRoundResult } from '../hooks/useRoundResult'
import { usePlayRecency } from '../hooks/usePlayRecency'
import {
  fanOffset,
  fansLeft,
  calculateEllipsePosition,
  TOTAL_CARDS_COUNT,
  seatPlayAnchor,
} from '../utils/tableGeometry'
import RoundResultOverlay from '../components/game/RoundResultOverlay'
import { ChipIcon } from '../components/ui/Chip'
import { Layers, Pause, Play, Users } from 'lucide-react'
import GameTable, { type SeatPlay } from '../components/GameTable'
import PlayerHand, { type PlayerHandRef } from '../components/PlayerHand'
import GameControls from '../components/GameControls'
import OpponentPlayer from '../components/OpponentPlayer'
import CardMoveAnimation from '../components/CardMoveAnimation'
import CardDealAnimation from '../components/CardDealAnimation'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { SOCKET_URL } from '../config/api'
import type { RoomInfo } from '../types/api'
import type { Card } from '../utils/cardValidation'
import { guessValidationCheck } from '../utils/cardValidation'
import { cardCompareUtil } from '../utils/cardCompare'

interface RoomUser {
  username: string
  bounty: number
  exitreq: boolean
  src: string
}

interface RoomData {
  userArray: RoomUser[]
  havingCards: any[][]
  droppingCards: any[][]
  order: number
  cycleCnt: number
  isStart: boolean
  restCardCnt: number
  prevOrder: number
  counterCnt: number
  double: number
  isFinish: boolean
  effectKind: string
  effectOpen: boolean
  host?: string
  fee?: number
  bonus?: number
  size?: number
  isPaused?: boolean
}

export default function GamePage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [canPlay, setCanPlay] = useState(false)
  const [myIndex, setMyIndex] = useState(-1)
  const centerCardsRef = useRef<HTMLDivElement>(null)

  const playerHandRef = useRef<PlayerHandRef>(null)

  // Card deal animation state
  const [isDealingCards, setIsDealingCards] = useState(false)
  const [dealStartPosition, setDealStartPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dealEndPositions, setDealEndPositions] = useState<Array<{ x: number; y: number }>>([])
  const [pendingRoomData, setPendingRoomData] = useState<RoomData | null>(null)
  const prevRestCardCntRef = useRef<number>(0)
  const playerPositionRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // Where each seat's posted cards come to rest (the first-card slot).
  const cardSize = useCardSize()
  const playAnchorRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  // Which seats lay their cards out leftward (placeholder left of the avatar).
  const seatFansLeftRef = useRef<Map<number, boolean>>(new Map())
  // The discard heap in the middle — where a finished trick is swept to.
  const heapRef = useRef<HTMLDivElement | null>(null)

  // End-of-trick sweep: the cards on every placeholder fly into the heap.
  const [isSweeping, setIsSweeping] = useState(false)
  const [sweepCards, setSweepCards] = useState<Card[]>([])
  const [sweepStarts, setSweepStarts] = useState<Array<{ x: number; y: number }>>([])
  const [sweepEnds, setSweepEnds] = useState<Array<{ x: number; y: number }>>([])
  const prevTrickRef = useRef<Card[][]>([])

  // Flourish shown when a seat posts a special combination.
  const [playEffect, setPlayEffect] = useState<{
    id: number
    kind: EffectKind
    origin: { x: number; y: number }
    target: { x: number; y: number }
  } | null>(null)
  const effectIdRef = useRef(0)
  const roomDataRef = useRef<RoomData | null>(null)
  
  const prevDroppingCardsRef = useRef<Array<Card[]>>([]) // Track previous droppingCards to detect changes

  // Calculate position using half-ellipse math
  // Uses percentage-based positioning for responsiveness
  // This function must be defined before useEffect that uses it


  /**
   * Where a seat's posted cards come to rest: the first card lands on that
   * seat's placeholder and the rest fan out to its right. Falls back to the
   * middle of the board if the play area has not been measured yet.
   */
  const landingPositions = (
    seatIndex: number,
    count: number
  ): Array<{ x: number; y: number }> | null => {
    if (count <= 0) return []
    const anchor = playAnchorRefs.current.get(seatIndex)
    const rect = anchor?.getBoundingClientRect()
    if (rect && rect.width > 0) {
      // Measure the placeholder itself, so this follows the card size in use
      // rather than a constant that could drift from it.
      const step = fanStepFor(rect.width, count)
      const slotX = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const leftward = seatFansLeftRef.current.get(seatIndex) ?? false
      return Array.from({ length: count }, (_, index) => ({
        x: slotX + fanOffset(index, count, step, leftward),
        y,
      }))
    }
    const centre = centerCardsRef.current?.getBoundingClientRect()
    if (!centre) return null
    const step = fanStepFor(cardSize.w, count)
    const total = cardSize.w + (count - 1) * step
    const firstX = centre.left + centre.width / 2 - total / 2 + cardSize.w / 2
    const y = centre.top + centre.height / 2
    return Array.from({ length: count }, (_, index) => ({ x: firstX + index * step, y }))
  }

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomId || !user) return

      const roomIdNum = parseInt(roomId, 10)
      if (isNaN(roomIdNum)) {
        setError('Invalid room ID')
        setLoading(false)
        return
      }

      try {
        // Fetch room info
        const room = await apiService.getRoomInfo(roomIdNum)
        if (!room) {
          setError('Room not found')
          setLoading(false)
          return
        }

        setRoomInfo(room)

        // Connect to socket
        const socket = io(SOCKET_URL)
        socketRef.current = socket

        // Join room
        socket.emit('join', {
          user: {
            username: user.username,
            avatarUrl: user.avatar || '',
            bounty: user.bounty,
          },
          room: {
            roomId: roomIdNum,
            bonus: room.bonus || 0,
            fee: room.fee || 0,
            size: room.size || 4,
          },
        })

        // Listen for updates
        socket.on('update', (param: { roomId: number; roomData: RoomData; passBanner?: boolean }) => {
          if (param.roomId === roomIdNum) {
            const prevRestCardCnt = prevRestCardCntRef.current
            const currentRestCardCnt = param.roomData.restCardCnt || 0

            // Detect if cards are being dealt (restCardCnt decreased)
            // This should work for ALL clients, not just the creator
            // All clients receive the same update event when cards are dealt
            // IMPORTANT: Check BEFORE updating the ref, so we use the previous value
            // Initialize prevRestCardCnt if not set (for clients joining mid-game)
            if (prevRestCardCnt === 0 && currentRestCardCnt > 0) {
              // First time seeing restCardCnt - initialize it
              prevRestCardCntRef.current = currentRestCardCnt
            }

            // Now check if cards are being dealt (restCardCnt decreased)
            const cardsDealt = prevRestCardCnt > 0 && prevRestCardCnt > currentRestCardCnt && param.roomData.isStart && currentRestCardCnt >= 0

            if (cardsDealt && centerCardsRef.current) {

              // Store the new room data to apply after animation
              setPendingRoomData(param.roomData)

              // Cards fly out of the remaining-cards pile in the middle.
              const deckRect = centerCardsRef.current.getBoundingClientRect()
              const startX = deckRect.left + deckRect.width / 2
              const startY = deckRect.top + deckRect.height / 2

              setDealStartPosition({ x: startX, y: startY })

              // Calculate end positions for each player using calculatedPosition
              // We need to get the GameTable container to convert percentage positions to pixels
              // Each player draws one card: yours joins the end of your hand,
              // everyone else's lands on their own placeholder.
              let dealAttempts = 0
              const collectPositions = () => {
                const seats = param.roomData.userArray.length
                const myDealIndex = param.roomData.userArray.findIndex(
                  (u) => u.username === user?.username
                )

                const spots: Array<{ x: number; y: number } | null> = []
                for (let seat = 0; seat < seats; seat += 1) {
                  if (seat === myDealIndex) {
                    spots.push(playerHandRef.current?.getNextCardPosition() ?? null)
                    continue
                  }
                  const anchor = playAnchorRefs.current.get(seat)
                  const rect = anchor?.getBoundingClientRect()
                  spots.push(
                    rect && rect.width > 0
                      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
                      : null
                  )
                }

                const ready = spots.every(
                  (spot): spot is { x: number; y: number } => spot !== null
                )

                if (ready && spots.length > 0) {
                  setDealEndPositions(spots)
                  setIsDealingCards(true)
                  return
                }

                dealAttempts += 1
                if (dealAttempts < 15) {
                  // The board may still be laying out — try again shortly.
                  setTimeout(() => collectPositions(), 100)
                  return
                }

                // Give up on the animation rather than leaving the board stale:
                // show the drawn cards straight away.
                setPendingRoomData(null)
                prevRestCardCntRef.current = param.roomData.restCardCnt || 0
                setRoomData(param.roomData)
                setLoading(false)
                setError('')
                setMyIndex(myDealIndex)
                if (param.roomData.counterCnt === 0) setSelectedCards([])
                prevDroppingCardsRef.current = param.roomData.droppingCards.map(
                  (cards) => [...cards]
                )
              }

              // Start collecting positions after a short delay to ensure DOM is ready
              setTimeout(() => {
                requestAnimationFrame(() => {
                  collectPositions()
                })
              }, 100)

              // Update prevRestCardCnt AFTER triggering animation
              // This ensures the next deal can be detected
              prevRestCardCntRef.current = currentRestCardCnt
            } else {
              // Normal update (no card dealing)
              // Update prevRestCardCnt for tracking
              if (prevRestCardCnt === 0 && currentRestCardCnt > 0) {
                // Initialize on first update
                prevRestCardCntRef.current = currentRestCardCnt
              } else if (prevRestCardCnt !== currentRestCardCnt) {
                // Update when restCardCnt changes (but not a deal)
                prevRestCardCntRef.current = currentRestCardCnt
              }

            
            // Find current user's index
            const userIndex = param.roomData.userArray.findIndex(
              (u) => u.username === user.username
            )
              

                // Plays are shown the moment they arrive — no fly-in animation.
                setRoomData(param.roomData)
                setLoading(false)
                setError('')
            setMyIndex(userIndex)
            
            // Clear selection when counter resets
            if (param.roomData.counterCnt === 0) {
              setSelectedCards([])
            }
            
            // Check if current user is still in the room
            if (userIndex === -1 && param.roomData.isStart) {
              // User was removed from the room
              setError('You were removed from the room')
              setTimeout(() => {
                navigate('/lobby')
              }, 2000)
            }
                
                prevDroppingCardsRef.current = param.roomData.droppingCards.map(cards => [...cards])
            }
            // Note: prevRestCardCntRef is updated in the cardsDealt branch (line 323) 
            // and in the else branch (lines 327-333), so no need to update here
          }
        })

        // Listen for room full
        socket.on('full', (param: { msg: string; variant: string }) => {
          setError(param.msg)
          setTimeout(() => {
            navigate('/lobby')
          }, 2000)
        })

        // Listen for exit
        socket.on('exit', (param: { roomId: number; host: boolean }) => {
          if (param.roomId === roomIdNum) {
            if (param.host) {
              setError('Room was closed by host')
            }
            setTimeout(() => {
              navigate('/lobby')
            }, 2000)
          }
        })

        // Handle disconnect
        socket.on('disconnect', () => {
          // Socket disconnected
        })
      } catch (err) {
        setError('Failed to join room')
        setLoading(false)
      }
    }

    initializeRoom()

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [roomId, user, navigate])

  // Keep roomDataRef in sync with roomData
  useEffect(() => {
    roomDataRef.current = roomData
  }, [roomData])

  // Create a stable key for game state to avoid infinite loops from object reference changes
  const gameStateKey = useMemo(() => {
    if (!roomData || !roomData.isStart) {
      return JSON.stringify({ isStart: false, order: -1, prevOrder: -1, previousCards: [] })
    }
    const lastOrder = roomData.prevOrder
    const previousCards = roomData.droppingCards[lastOrder] || []
    return JSON.stringify({
      isStart: roomData.isStart,
      order: roomData.order,
      prevOrder: roomData.prevOrder,
      previousCards,
    })
  }, [roomData?.isStart, roomData?.order, roomData?.prevOrder, roomData?.droppingCards])

  // Check if cards can be played - MUST be before any conditional returns
  useEffect(() => {
    const currentRoomData = roomDataRef.current
    if (!currentRoomData || !currentRoomData.isStart || myIndex === -1) {
      setCanPlay(false)
      return
    }

    const isMyTurn = currentRoomData.order === myIndex
    if (!isMyTurn) {
      setCanPlay(false)
      return
    }

    if (selectedCards.length === 0) {
      setCanPlay(false)
      return
    }

    // Validate card selection
    const validation = guessValidationCheck(selectedCards)
    if (validation.status === 0) {
      setCanPlay(false)
      return
    }

    // Check if cards can beat previous cards
    const lastOrder = currentRoomData.prevOrder
    const previousCards = currentRoomData.droppingCards[lastOrder] || []
    
    if (lastOrder === currentRoomData.order || previousCards.length === 0) {
      // First play or same player's turn
      setCanPlay(selectedCards.length > 0)
    } else {
      // Need to beat previous cards
      const canBeat = cardCompareUtil(previousCards, selectedCards)
      setCanPlay(canBeat)
    }
  }, [selectedCards, gameStateKey, myIndex])


  // Card deal animation complete handler
  const handleDealAnimationComplete = () => {
    setIsDealingCards(false)

    // Apply pending room data after animation completes
    if (pendingRoomData) {
      // Update prevRestCardCnt to the new value after animation
      prevRestCardCntRef.current = pendingRoomData.restCardCnt || 0
      
      setRoomData(pendingRoomData)
      setLoading(false)
      setError('')

      const userIndex = pendingRoomData.userArray.findIndex(
        (u) => u.username === user?.username
      )
      setMyIndex(userIndex)

      // Clear selection when counter resets
      if (pendingRoomData.counterCnt === 0) {
        setSelectedCards([])
      }

      // Update prevDroppingCards after applying new data
      prevDroppingCardsRef.current = pendingRoomData.droppingCards.map(cards => [...cards])

      setPendingRoomData(null)
    }

    // Clear animation state
    setTimeout(() => {
      setDealStartPosition({ x: 0, y: 0 })
      setDealEndPositions([])
    }, 100)
  }



  // MUST be before early returns to maintain hook order
  const handleCardSelectionChange = useCallback((cards: Card[]) => {
    setSelectedCards(cards)
  }, [])

  // Live table feed, derived from the room state the server broadcasts
  const feed = useGameFeed(roomData)

  /**
   * When a trick ends the server wipes every seat's dropped pile in one update.
   * Catch that moment, and fly the cards that were on the placeholders into the
   * heap in the middle before letting the board settle.
   */
  useEffect(() => {
    const now = roomData?.droppingCards ?? []
    const previous = prevTrickRef.current
    prevTrickRef.current = now.map((pile) => [...(pile ?? [])])

    // A seat just posted: play its flourish, if the combination has one.
    if (roomData?.isStart && !roomData.isFinish) {
      now.forEach((pile, seatIndex) => {
        const before = previous[seatIndex]?.length ?? 0
        const after = pile?.length ?? 0
        if (after === 0 || after === before) return

        const kind = classifyPlay(pile as Card[])
        if (!kind) return

        const heapBox = heapRef.current?.getBoundingClientRect()
        const seatBox = playAnchorRefs.current.get(seatIndex)?.getBoundingClientRect()
        if (!heapBox) return

        effectIdRef.current += 1
        setPlayEffect({
          id: effectIdRef.current,
          kind,
          origin: seatBox
            ? { x: seatBox.left + seatBox.width / 2, y: seatBox.top + seatBox.height / 2 }
            : { x: heapBox.left + heapBox.width / 2, y: heapBox.bottom },
          target: { x: heapBox.left + heapBox.width / 2, y: heapBox.top + heapBox.height / 2 },
        })
      })
    }

    if (!isTrickSweep(previous, now, { isStart: roomData?.isStart, isFinish: roomData?.isFinish })) {
      return
    }

    const heap = heapRef.current?.getBoundingClientRect()
    if (!heap) return
    const heapX = heap.left + heap.width / 2
    const heapY = heap.top + heap.height / 2

    const cards: Card[] = []
    const starts: Array<{ x: number; y: number }> = []
    const ends: Array<{ x: number; y: number }> = []

    previous.forEach((pile, seatIndex) => {
      if (!pile?.length) return
      const spots = landingPositions(seatIndex, pile.length)
      pile.forEach((card, cardIndex) => {
        cards.push(card)
        starts.push(spots?.[cardIndex] ?? { x: heapX, y: heapY })
        // Scatter slightly so they settle as a heap, not a single stack.
        ends.push({
          x: heapX + (Math.random() - 0.5) * 24,
          y: heapY + (Math.random() - 0.5) * 16,
        })
      })
    })

    if (cards.length === 0) return
    setSweepCards(cards)
    setSweepStarts(starts)
    setSweepEnds(ends)
    setIsSweeping(true)
  }, [roomData])

  const handleSweepComplete = () => {
    setIsSweeping(false)
    setSweepCards([])
    setSweepStarts([])
    setSweepEnds([])
  }

  // Which seat played most recently in the current trick
  const playRecency = usePlayRecency(roomData)

  // Win / lose effect at the end of a round
  const { result: roundResult, dismiss: dismissRoundResult } = useRoundResult(roomData, user?.username)

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-ink-400 border-t-transparent mx-auto mb-4"></div>
              <p className="text-mist-300 text-lg">Joining room...</p>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex h-full flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-red-900/50 border-2 border-red-600/50 rounded-xl p-8 text-center max-w-md">
              <p className="text-red-200 text-lg font-semibold mb-4">{error}</p>
              <button
                onClick={() => navigate('/lobby')}
                className="px-6 py-3 bg-sky hover:bg-ink-500 text-white font-semibold rounded-lg transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  const handlePlayCards = () => {
    if (!socketRef.current || !roomId || selectedCards.length === 0 || !canPlay || roomData?.isPaused) {
      return
    }

    const validation = guessValidationCheck(selectedCards)
    if (validation.status === 0) {
      setError(validation.msg)
      return
    }

    // Prepare emit data
    let double = roomData?.double || 1
    let effectOpen = false
    let effectkind = ''

    // Check for special effects
    if (validation.status === 3) {
      // Madae
      double *= 2
      effectOpen = true
      effectkind = 'madae'
    } else if (validation.status === 4) {
      // Taso
      double *= 2
      effectOpen = true
      effectkind = 'tawang'
    }

    socketRef.current.emit('shutcards', {
      choosedCard: selectedCards,
      roomId: parseInt(roomId, 10),
      double,
      effectOpen,
      effectkind,
    })
    setSelectedCards([])
  }


  const handlePass = () => {
    if (!socketRef.current || !roomId) return
    socketRef.current.emit('passcards', {
      roomId: parseInt(roomId, 10),
    })
    setSelectedCards([])
  }

  const handleExit = () => {
    if (!socketRef.current || !roomId) return
    socketRef.current.emit('exit', {
      roomId: parseInt(roomId, 10),
    })
  }

  const handlePause = () => {
    if (!socketRef.current || !roomId) return
    socketRef.current.emit('pausegame', {
      roomId: parseInt(roomId, 10),
    })
  }

  const users = roomData?.userArray || []
  const roomSize = roomInfo?.size || 4
  const isMyTurn = roomData?.isStart && roomData.order === myIndex
  const myCards = myIndex >= 0 && roomData?.havingCards ? roomData.havingCards[myIndex] || [] : []
  const canPass = roomData?.isStart && isMyTurn && roomData.order !== roomData.prevOrder

  // Find current user's index in the original users array
  const currentUserIndex = myIndex >= 0 ? myIndex : users.findIndex((u) => u.username === user?.username)
  
  // Rotate players array so current user is at index 0 (center/bottom position)
  // This ensures current user is always displayed at the center
  const rotatePlayersArray = <T,>(arr: T[], startIndex: number): T[] => {
    if (startIndex <= 0 || startIndex >= arr.length) return arr
    return [...arr.slice(startIndex), ...arr.slice(0, startIndex)]
  }
  
  const rotatedUsers = rotatePlayersArray(users, currentUserIndex >= 0 ? currentUserIndex : 0)
  
  // Map rotated users back to their original indices for game logic
  const getOriginalIndex = (rotatedIndex: number): number => {
    if (currentUserIndex < 0) return rotatedIndex
    return (currentUserIndex + rotatedIndex) % users.length
  }
  
  // Only show empty slots if game hasn't started yet
  const emptySlotsCount = roomData?.isStart ? 0 : Math.max(0, roomSize - users.length)
  
  // Create array of all player slots (real players + empty placeholders)
  // Rotated so current user is at display index 0 (center/bottom)
  const allPlayerSlots = [
    ...rotatedUsers.map((playerUser, rotatedIndex) => ({
      user: playerUser,
      displayIndex: rotatedIndex, // Position in display (0 = center/bottom)
      originalIndex: getOriginalIndex(rotatedIndex), // Original index for game logic
      isEmpty: false,
    })),
    ...Array.from({ length: emptySlotsCount }, (_, i) => ({
      user: null,
      displayIndex: rotatedUsers.length + i,
      originalIndex: users.length + i, // Empty slots use original indices beyond current users
      isEmpty: true,
    })),
  ]

  // ---- Cards resting on the felt -------------------------------------------
  // Every seated player owns a play area beside their avatar. Until they post,
  // it shows a face-down placeholder carrying the number of cards left in their
  // hand; once they post, the cards land on that placeholder and fan to the
  // right. Plays stay put for the whole trick, so the previous player's cards
  // are still readable when it is your turn.
  const seatSpot = (originalIndex: number) => {
    const slot = allPlayerSlots.find((entry) => entry.originalIndex === originalIndex)
    return calculateEllipsePosition(slot ? slot.displayIndex : 0, roomSize)
  }

  const latestSeat = Object.keys(playRecency)
    .map(Number)
    .sort((first, second) => playRecency[second] - playRecency[first])[0]

  const seatPlays: SeatPlay[] = roomData?.isStart
    ? users.map((seatUser, seatIndex) => {
        const posted = roomData.droppingCards?.[seatIndex] ?? []
        const isLatest = seatIndex === latestSeat
        // No need to hide anything mid-flight: the room state only catches up
        // once the cards have landed, so a pile never doubles up with its own
        // animation — and the previous player's cards stay on the felt.
        const anchor = seatPlayAnchor(seatSpot(seatIndex))
        seatFansLeftRef.current.set(seatIndex, fansLeft(anchor.dx))
        return {
          seatIndex,
          x: anchor.x,
          y: anchor.y,
          dx: anchor.dx,
          dy: anchor.dy,
          cards: posted,
          handCount: roomData.havingCards?.[seatIndex]?.length ?? 0,
          playerName: seatUser.username,
          isLatest,
          isYou: seatUser.username === user?.username,
        }
      })
    : []

  // Cards that have been used up: the deck started at TOTAL_CARDS, so whatever
  // is neither in a hand, on the table, nor still in the deck has been spent.
  const deckLeft = Math.max(roomData?.restCardCnt ?? 0, 0)
  const inHands = (roomData?.havingCards ?? []).reduce(
    (sum, hand) => sum + (hand?.length ?? 0),
    0
  )
  const onTable = (roomData?.droppingCards ?? []).reduce(
    (sum, pile) => sum + (pile?.length ?? 0),
    0
  )
  const discardCount = roomData?.isStart
    ? Math.max(TOTAL_CARDS_COUNT - deckLeft - inHands - onTable, 0)
    : 0
  // While a trick is flying to the heap its cards already count as spent, so
  // hold the number back until they actually land.
  const shownDiscardCount = Math.max(discardCount - (isSweeping ? sweepCards.length : 0), 0)

  const panelPlayers: PanelPlayer[] = users.map((seatUser, seatIndex) => ({
    username: seatUser.username,
    bounty: seatUser.bounty,
    src: seatUser.src,
    exitreq: seatUser.exitreq,
    cardsLeft: roomData?.havingCards?.[seatIndex]?.length ?? 0,
    isHost: roomData?.host ? roomData.host === seatUser.username : seatIndex === 0,
    isTurn: Boolean(roomData?.isStart) && roomData?.order === seatIndex,
    isYou: seatUser.username === user?.username,
    lastPlay: roomData?.droppingCards?.[seatIndex] ?? [],
  }))

  return (
    <AppShell variant="full">
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 p-3 xl:grid-cols-[300px_minmax(0,1fr)_330px]">
        {/* Left: players and stake */}
        <div className="hidden min-h-0 xl:flex xl:flex-col">
          <PlayersPanel
            players={panelPlayers}
            roomSize={roomSize}
            bonus={roomData?.bonus || 0}
            multiplier={roomData?.double || 1}
            restCards={roomData?.restCardCnt || 0}
          />
        </div>

        {/* Center: round strip and felt */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="panel flex shrink-0 flex-wrap items-center gap-2 px-4 py-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-mist-500">Room</span>
            <span className="pill pill-sky">#{roomId}</span>
            <span className="pill pill-gold">
              <ChipIcon size={12} />
              {((roomData?.bonus || 0) * (roomData?.double || 1)).toLocaleString()}
            </span>
            {(roomData?.double || 1) > 1 && <span className="pill pill-grape">{roomData?.double}x</span>}
            <span className="pill pill-muted">
              <Users size={11} />
              {users.length}/{roomSize}
            </span>
            <span className="pill pill-muted">
              <Layers size={11} />
              {roomData?.restCardCnt || 0} in deck
            </span>
            {roomData?.isPaused && <span className="pill pill-punch">Paused</span>}

            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-mist-500">
                Turn:{' '}
                <span className="font-bold text-mist-100">
                  {(roomData?.isStart && users[roomData?.order || 0]?.username) || '—'}
                </span>
              </span>
              {roomData?.isStart && roomData?.host === user?.username && (
                <button
                  onClick={handlePause}
                  className="icon-btn"
                  title={roomData?.isPaused ? 'Resume game' : 'Pause game'}
                >
                  {roomData?.isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>
              )}
            </div>
          </div>

          <GameTable
                  ref={centerCardsRef}
                  seatPlays={seatPlays}
                  discardCount={shownDiscardCount}
                  deckCount={deckLeft}
                  showTable={Boolean(roomData?.isStart)}
                  onHeapRef={(element) => {
                    heapRef.current = element
                  }}
                  onPlayAnchorRef={(seatIndex, element) => {
                    if (element) playAnchorRefs.current.set(seatIndex, element)
                    else playAnchorRefs.current.delete(seatIndex)
                  }}
                  onOpponentRef={(index, element) => {
                    if (element) {
                      // Store the ref with the originalIndex
                      playerPositionRefs.current.set(index, element)
                      // Also ensure the data attribute is set for username matching
                      if (element && !element.getAttribute('data-player-name')) {
                        // Find the username from roomData
                        const player = roomData?.userArray[index]
                        if (player) {
                          element.setAttribute('data-player-name', player.username)
                        }
                      }
                    } else {
                      playerPositionRefs.current.delete(index)
                    }
                  }}
                  playerHand={
                    roomData?.isStart ? (
                      <PlayerHand
                        ref={playerHandRef}
                        cards={myCards}
                        onCardSelectionChange={handleCardSelectionChange}
                        isMyTurn={isMyTurn && !roomData?.isPaused}
                      />
                    ) : undefined
                  }
                  gameControls={
                    roomData?.isStart ? (
                      <GameControls
                        onPlayCards={handlePlayCards}
                        onPass={handlePass}
                        onExit={handleExit}
                        canPlay={canPlay && !roomData?.isPaused}
                        canPass={(canPass || false) && !roomData?.isPaused}
                        isMyTurn={isMyTurn || false}
                        selectedCount={selectedCards.length}
                      />
                    ) : undefined
                  }
                  currentUserPlayer={
                    (() => {
                      // Find current user slot (displayIndex 0)
                      const currentUserSlot = allPlayerSlots.find(slot => slot.displayIndex === 0 && !slot.isEmpty)
                      if (!currentUserSlot || !currentUserSlot.user) return undefined
                      
                      const playerUser = currentUserSlot.user
                      const originalIndex = currentUserSlot.originalIndex
                      const isActive = roomData?.order === originalIndex
                      const progress = isActive && roomData?.counterCnt !== undefined 
                        ? Math.min(roomData.counterCnt / 10, 1) 
                        : 0
                      
                      return (
                        <div
                          ref={(el) => {
                            if (el) {
                              playerPositionRefs.current.set(originalIndex, el)
                            } else {
                              playerPositionRefs.current.delete(originalIndex)
                            }
                          }}
                        >
                        <OpponentPlayer
                          name={playerUser.username}
                          cardCount={roomData?.havingCards[originalIndex]?.length || 0}
                          position="bottom"
                          isActive={isActive}
                          progress={progress}
                          isEmpty={false}
                          inline={true}
                          avatarUrl={playerUser.src}
                          bounty={playerUser.bounty}
                          isHost={roomData?.host === playerUser.username}
                          isYou
                        />
                        </div>
                      )
                    })()
                  }
                  opponents={allPlayerSlots
                    .filter((slot) => {
                      // Filter out current user (displayIndex 0) from opponents
                      return slot.displayIndex !== 0
                    })
                    .map((slot) => {
                      // Store ref for player position tracking
                      const originalIndex = slot.originalIndex
                      // Use displayIndex for position calculation
                      const calculatedPosition = calculateEllipsePosition(slot.displayIndex, roomSize)
                      
                      if (slot.isEmpty) {
                        // Empty placeholder slot
                        if (calculatedPosition === 'bottom') {
                          return {
                            isEmpty: true,
                            position: 'bottom' as const,
                            customPosition: undefined,
                          }
                        }
                        if (typeof calculatedPosition === 'object') {
                          return {
                            isEmpty: true,
                            customPosition: calculatedPosition,
                            position: undefined,
                          }
                        }
                        return {
                          isEmpty: true,
                          position: calculatedPosition,
                          customPosition: undefined,
                        }
                      }
                      
                      // Real player slot
                      const playerUser = slot.user!
                      const isActive = roomData?.order === originalIndex
                      // Calculate progress: counterCnt goes from 0 to 10 (10 seconds timer)
                      const progress = isActive && roomData?.counterCnt !== undefined 
                        ? Math.min(roomData.counterCnt / 10, 1) 
                        : 0
                      
                      if (calculatedPosition === 'bottom') {
                        return {
                          name: playerUser.username,
                          avatarUrl: playerUser.src,
                          bounty: playerUser.bounty,
                          isHost: roomData?.host === playerUser.username,
                          cardCount: roomData?.havingCards[originalIndex]?.length || 0,
                          position: 'bottom' as const,
                          isActive: isActive,
                          progress: progress,
                          isEmpty: false,
                          customPosition: undefined,
                          originalIndex: originalIndex, // Add originalIndex for ref tracking
                        }
                      }
                      
                      if (typeof calculatedPosition === 'object') {
                        return {
                          name: playerUser.username,
                          avatarUrl: playerUser.src,
                          bounty: playerUser.bounty,
                          isHost: roomData?.host === playerUser.username,
                          cardCount: roomData?.havingCards[originalIndex]?.length || 0,
                          customPosition: calculatedPosition,
                          isActive: isActive,
                          progress: progress,
                          isEmpty: false,
                          position: undefined,
                          originalIndex: originalIndex, // Add originalIndex for ref tracking
                        }
                      }
                      
                      return {
                        name: playerUser.username,
                        avatarUrl: playerUser.src,
                        bounty: playerUser.bounty,
                        isHost: roomData?.host === playerUser.username,
                        cardCount: roomData?.havingCards[originalIndex]?.length || 0,
                        position: calculatedPosition,
                        isActive: isActive,
                        progress: progress,
                        isEmpty: false,
                        customPosition: undefined,
                        originalIndex: originalIndex, // Add originalIndex for ref tracking
                      }
                    })}
            emptyHint={
              !roomData?.isStart ? (
                <div className="pointer-events-auto flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-8 py-6 backdrop-blur-sm">
                  <p className="text-sm font-semibold text-white/85">
                    {users.length >= roomSize
                      ? 'Table is full — ready when you are.'
                      : `Waiting for ${roomSize - users.length} more player${roomSize - users.length !== 1 ? 's' : ''}…`}
                  </p>
                  {users.length > 0 && users[0].username === user?.username && (
                    <button
                      onClick={() => {
                        if (socketRef.current && roomId) {
                          socketRef.current.emit('startgame', { roomId: parseInt(roomId, 10) })
                        }
                      }}
                      disabled={users.length < roomSize}
                      className="btn btn-gold px-8 py-3 text-base"
                    >
                      <Play size={18} fill="currentColor" />
                      Start game
                    </button>
                  )}
                </div>
              ) : undefined
            }
          />
        </div>

        {/* Right: live feed */}
        <div className="hidden min-h-0 xl:flex xl:flex-col">
          <GameFeed entries={feed} playersOnline={users.length} />
        </div>
      </div>

      {roundResult && (
        <RoundResultOverlay
          key={roundResult.key}
          result={roundResult}
          onDismiss={dismissRoundResult}
        />
      )}
      {playEffect && (
        <PlayEffect
          key={playEffect.id}
          kind={playEffect.kind}
          origin={playEffect.origin}
          target={playEffect.target}
          onDone={() => setPlayEffect(null)}
        />
      )}

      {/* End-of-trick sweep: every placeholder's cards fly into the heap */}
      <CardMoveAnimation
        cards={sweepCards}
        startPositions={sweepStarts}
        endPositions={sweepEnds}
        onAnimationComplete={handleSweepComplete}
        isAnimating={isSweeping}
        fadeIntoPile
        durationMs={620}
      />
      <CardDealAnimation
        cardCount={dealEndPositions.length}
        startPosition={dealStartPosition}
        endPositions={dealEndPositions}
        onAnimationComplete={handleDealAnimationComplete}
        isAnimating={isDealingCards}
      />
    </AppShell>
  )
}

