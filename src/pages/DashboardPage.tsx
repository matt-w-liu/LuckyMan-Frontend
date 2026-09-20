import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gift,
  Loader2,
  Plus,
  ShoppingBag,
  Spade,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import AppShell from '../components/shell/AppShell'
import Avatar from '../components/ui/Avatar'
import { ChipIcon } from '../components/ui/Chip'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import type { RoomInfo } from '../types/api'

interface TopPlayer {
  username: string
  wins: number
  bounty: number
  rank: number
}

interface ShopItem {
  id: number
  name: string
  description: string
  price: number
  category: 'bounty' | 'avatar' | 'theme' | 'powerup'
}

// Placeholder data — there is no leaderboard or shop endpoint on the backend yet.
const PLACEHOLDER_TOP_PLAYERS: TopPlayer[] = [
  { username: 'CardMaster', wins: 125, bounty: 5000, rank: 1 },
  { username: 'AcePlayer', wins: 98, bounty: 4200, rank: 2 },
  { username: 'LuckyWinner', wins: 87, bounty: 3800, rank: 3 },
  { username: 'GameChanger', wins: 76, bounty: 3500, rank: 4 },
  { username: 'ProGamer', wins: 65, bounty: 3200, rank: 5 },
]

const PLACEHOLDER_SHOP: ShopItem[] = [
  { id: 1, name: 'Starter Pack', description: '100 bounty points', price: 4.99, category: 'bounty' },
  { id: 2, name: 'Premium Pack', description: '500 bounty points', price: 19.99, category: 'bounty' },
  { id: 5, name: 'Golden Avatar', description: 'Exclusive golden frame', price: 99, category: 'avatar' },
  { id: 11, name: 'Lucky Charm', description: 'Increase win chance by 10%', price: 79, category: 'powerup' },
]

const RANK_STYLE = ['text-gold', 'text-mist-300', 'text-orange-400']

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [openRooms, setOpenRooms] = useState<RoomInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiService.getRooms({ search_key: '', pgSize: 6, pgNum: 1 })
        setOpenRooms((response.data || []).filter((room) => room.status === 0).slice(0, 6))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const quickActions = [
    { label: 'Browse tables', hint: 'Find a room to join', icon: Spade, to: '/lobby', tone: 'text-sky' },
    { label: 'Create table', hint: 'Set your own stakes', icon: Plus, to: '/create-room', tone: 'text-gold' },
    { label: 'Leaderboard', hint: 'See the top players', icon: Trophy, to: '/top-players', tone: 'text-grape' },
    { label: 'How to play', hint: 'Learn the rules', icon: BookOpen, to: '/how-to-play', tone: 'text-mint' },
  ]

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 lg:p-6">
        {/* Hero */}
        <section className="panel relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-felt/50 via-ink-700 to-grape/25" />
          <div
            className="absolute inset-y-0 right-0 w-2/5 opacity-[0.12]"
            style={{ backgroundImage: 'url(/imgs/deck/back.svg)', backgroundSize: '64px' }}
          />
          <div className="relative flex flex-wrap items-center gap-6 p-6 lg:p-8">
            <Avatar name={user?.username} src={user?.avatar} size={72} ring="gold" />
            <div className="min-w-[240px] flex-1">
              <span className="pill pill-gold mb-2">
                <Sparkles size={12} />
                Welcome back
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-mist-100 lg:text-4xl">
                {user?.username}
              </h1>
              <p className="mt-1 text-sm text-mist-300">
                Your seat is waiting. Clear your hand first and take the pot.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/lobby')} className="btn btn-gold px-7 py-3.5 text-base">
                <Swords size={18} />
                Play now
              </button>
              <button onClick={() => navigate('/create-room')} className="btn btn-ghost px-6 py-3.5">
                <Plus size={18} />
                New table
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Your bounty',
              value: (user?.bounty ?? 0).toLocaleString(),
              hint: 'Credits available to play',
              icon: <ChipIcon size={26} />,
              tone: 'text-gold',
            },
            {
              label: 'Open tables',
              value: loading ? '—' : String(openRooms.length),
              hint: 'Rooms waiting for players',
              icon: <Users size={24} className="text-sky" />,
              tone: 'text-sky',
            },
            {
              label: 'Rounds won',
              value: '0',
              hint: 'Not tracked by the backend yet',
              icon: <TrendingUp size={24} className="text-mint" />,
              tone: 'text-mint',
            },
          ].map((stat) => (
            <div key={stat.label} className="panel flex items-center gap-4 p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-800">{stat.icon}</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-mist-500">{stat.label}</p>
                <p className={`text-2xl font-extrabold tabular-nums ${stat.tone}`}>{stat.value}</p>
                <p className="text-xs text-mist-500">{stat.hint}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map(({ label, hint, icon: ActionIcon, to, tone }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="panel group p-5 text-left transition hover:-translate-y-1 hover:border-gold/40"
            >
              <span className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-800 ${tone}`}>
                <ActionIcon size={20} />
              </span>
              <p className="font-bold text-mist-100">{label}</p>
              <p className="text-xs text-mist-500">{hint}</p>
            </button>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* Open tables */}
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Open tables</h2>
              <button
                onClick={() => navigate('/lobby')}
                className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold hover:brightness-110"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-mist-500">
                <Loader2 size={20} className="animate-spin text-gold" />
                Loading tables…
              </div>
            ) : openRooms.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14">
                <Spade size={36} className="text-mist-500/50" />
                <p className="text-sm text-mist-500">No open tables right now.</p>
                <button onClick={() => navigate('/create-room')} className="btn btn-gold mt-2 px-5 py-2.5">
                  <Plus size={16} />
                  Open one
                </button>
              </div>
            ) : (
              <div className="divide-y divide-ink-400/40">
                {openRooms.map((room) => (
                  <button
                    key={room.room_id}
                    onClick={() => navigate(`/game/${room.room_id}`)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-ink-600/40"
                  >
                    <Avatar name={room.creator} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-mist-100">{room.creator}</p>
                      <p className="text-xs text-mist-500">Room #{room.room_id}</p>
                    </div>
                    <span className="pill pill-gold">
                      <ChipIcon size={11} />
                      {(room.bonus || 0).toLocaleString()}
                    </span>
                    <span className="pill pill-muted">
                      <Users size={11} />
                      {room.members}/{room.size || 0}
                    </span>
                    <ArrowRight size={16} className="text-mist-500" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Leaderboard */}
          <section className="panel">
            <div className="panel-head">
              <h2 className="panel-title">Top players</h2>
              <span className="pill pill-muted">Sample</span>
            </div>
            <div className="divide-y divide-ink-400/40">
              {PLACEHOLDER_TOP_PLAYERS.map((player, index) => (
                <div key={player.username} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-5 text-center text-sm font-extrabold ${RANK_STYLE[index] ?? 'text-mist-500'}`}>
                    {index < 3 ? <Crown size={15} className="mx-auto" fill="currentColor" /> : player.rank}
                  </span>
                  <Avatar name={player.username} size={32} ring={index === 0 ? 'gold' : 'none'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-mist-100">{player.username}</p>
                    <p className="text-xs text-mist-500">{player.wins} wins</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-bold tabular-nums text-gold">
                    <ChipIcon size={12} />
                    {player.bounty.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Shop */}
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Featured in the shop</h2>
            <button
              onClick={() => navigate('/shop')}
              className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gold hover:brightness-110"
            >
              Visit shop <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLACEHOLDER_SHOP.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/shop')}
                className="rounded-2xl border border-ink-400/60 bg-ink-800/60 p-4 text-left transition hover:-translate-y-1 hover:border-gold/40"
              >
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-700 text-gold">
                  {item.category === 'bounty' ? (
                    <ChipIcon size={20} />
                  ) : item.category === 'avatar' ? (
                    <Crown size={18} />
                  ) : item.category === 'powerup' ? (
                    <Sparkles size={18} />
                  ) : (
                    <Gift size={18} />
                  )}
                </span>
                <p className="font-bold text-mist-100">{item.name}</p>
                <p className="mb-2 text-xs text-mist-500">{item.description}</p>
                <span className="pill pill-gold">
                  <ShoppingBag size={11} />${item.price}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
