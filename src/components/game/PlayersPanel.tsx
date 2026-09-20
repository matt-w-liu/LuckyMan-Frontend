import { useState } from 'react'
import { Crown, DoorOpen, Layers, Users } from 'lucide-react'
import Avatar from '../ui/Avatar'
import { ChipIcon } from '../ui/Chip'
import type { Card as GameCard } from '../../utils/cardValidation'

export interface PanelPlayer {
  username: string
  bounty: number
  src?: string
  exitreq?: boolean
  cardsLeft: number
  isHost: boolean
  isTurn: boolean
  isYou: boolean
  lastPlay: GameCard[]
}

interface PlayersPanelProps {
  players: PanelPlayer[]
  roomSize: number
  bonus: number
  multiplier: number
  restCards: number
}

type Tab = 'players' | 'table'

const SUIT_MARK = ['♠', '♥', '♦', '♣']
const RANK_LABELS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']

const cardLabel = (card: GameCard) => {
  if (card.type === 4) return 'So'
  if (card.type === 5) return 'Ta'
  return `${RANK_LABELS[card.number - 1] ?? card.number}${SUIT_MARK[card.type] ?? ''}`
}

const isRed = (card: GameCard) => card.type === 1 || card.type === 2 || card.type === 5

export default function PlayersPanel({
  players,
  roomSize,
  bonus,
  multiplier,
  restCards,
}: PlayersPanelProps) {
  const [tab, setTab] = useState<Tab>('players')
  const emptySeats = Math.max(roomSize - players.length, 0)

  return (
    <section className="panel flex min-h-0 flex-col">
      <div className="p-3 pb-0">
        <div className="tab-group">
          <button
            onClick={() => setTab('players')}
            className={`tab ${tab === 'players' ? 'tab-active' : ''}`}
          >
            Players
          </button>
          <button onClick={() => setTab('table')} className={`tab ${tab === 'table' ? 'tab-active' : ''}`}>
            On table
          </button>
        </div>
      </div>

      {/* Stake summary */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[
          { label: 'Bonus', value: (bonus * multiplier).toLocaleString(), tone: 'text-gold' },
          { label: 'Multiplier', value: `${multiplier}x`, tone: 'text-grape' },
          { label: 'Deck', value: String(restCards), tone: 'text-sky' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-ink-800/70 px-2 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-mist-500">{stat.label}</p>
            <p className={`text-sm font-extrabold tabular-nums ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {tab === 'players' ? (
        <>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-y border-ink-400/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-mist-500">
            <span>Player</span>
            <span className="text-right">Bounty</span>
            <span className="w-10 text-right">Cards</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.username}
                className={`row-alt grid grid-cols-[1fr_auto_auto] items-center gap-2 px-4 py-2.5 transition ${
                  player.isTurn ? 'bg-gold/10 ring-1 ring-inset ring-gold/40' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="relative">
                    <Avatar
                      name={player.username}
                      src={player.src}
                      size={30}
                      ring={player.isTurn ? 'gold' : 'none'}
                    />
                    {player.isHost && (
                      <Crown
                        size={12}
                        className="absolute -right-1 -top-1 rounded-full bg-gold p-0.5 text-ink-900"
                        fill="currentColor"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-mist-100">
                      {player.username}
                      {player.isYou && <span className="pill pill-gold px-1.5 py-0">You</span>}
                    </p>
                    {player.exitreq && (
                      <p className="flex items-center gap-1 text-[11px] font-medium text-punch">
                        <DoorOpen size={11} /> leaving
                      </p>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-mist-300">
                  <ChipIcon size={13} />
                  {player.bounty.toLocaleString()}
                </span>
                <span
                  className={`w-10 text-right text-sm font-extrabold tabular-nums ${
                    player.cardsLeft === 0 ? 'text-mint' : 'text-mist-100'
                  }`}
                >
                  {player.cardsLeft}
                </span>
              </div>
            ))}

            {Array.from({ length: emptySeats }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="row-alt flex items-center gap-2.5 px-4 py-2.5 text-mist-500"
              >
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-ink-400">
                  <Users size={14} />
                </span>
                <span className="text-sm font-medium">Waiting for player…</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {players.every((player) => player.lastPlay.length === 0) && (
            <p className="px-1 py-6 text-center text-sm text-mist-500">Nothing on the table yet.</p>
          )}
          {players
            .filter((player) => player.lastPlay.length > 0)
            .map((player) => (
              <div key={player.username} className="rounded-xl bg-ink-800/70 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar name={player.username} src={player.src} size={22} />
                  <span className="text-sm font-semibold text-mist-100">{player.username}</span>
                  <span className="pill pill-muted ml-auto">
                    <Layers size={11} />
                    {player.lastPlay.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {player.lastPlay.map((card, index) => (
                    <span
                      key={index}
                      className={`rounded-md bg-white px-2 py-1 text-xs font-extrabold ${
                        isRed(card) ? 'text-punch' : 'text-ink-900'
                      }`}
                    >
                      {cardLabel(card)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </section>
  )
}
