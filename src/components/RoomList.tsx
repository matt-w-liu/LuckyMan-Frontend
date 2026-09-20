import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Clock,
  DoorOpen,
  Gift,
  Loader2,
  Lock,
  Search,
  Spade,
  Swords,
  Users,
} from 'lucide-react'
import { apiService } from '../services/api'
import type { RoomInfo } from '../types/api'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './ui/Avatar'
import { ChipIcon } from './ui/Chip'

interface RoomListProps {
  onJoinRoom?: (roomId: number) => void
  refreshTrigger?: number
}

const STATUS = {
  0: { label: 'Open', pill: 'pill-mint', icon: Clock, art: 'from-emerald-500/25 to-teal-900/10' },
  1: { label: 'Full', pill: 'pill-gold', icon: Users, art: 'from-amber-500/25 to-orange-900/10' },
  2: { label: 'Playing', pill: 'pill-sky', icon: Swords, art: 'from-sky-500/25 to-indigo-900/10' },
  3: { label: 'Closed', pill: 'pill-punch', icon: CircleSlash, art: 'from-rose-500/20 to-slate-900/10' },
} as const

const statusOf = (status: number) => STATUS[(status in STATUS ? status : 3) as keyof typeof STATUS]

export default function RoomList({ onJoinRoom, refreshTrigger }: RoomListProps) {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKey, setSearchKey] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 12

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const response = await apiService.getRooms({
        search_key: searchKey,
        pgSize: pageSize,
        pgNum: currentPage,
      })
      setRooms(response.data || [])
      const count = response.total?.[0]?.total_cnt || 0
      setTotalCount(count)
      setTotalPages(Math.ceil(count / pageSize) || 1)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, refreshTrigger])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchRooms()
  }

  const canJoinRoom = (room: RoomInfo): boolean => {
    if (room.status !== 0) return false
    if (!user) return false
    if (user.bounty < (room.fee || 0)) return false
    if (room.members >= (room.size || 0)) return false
    return true
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i)
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i += 1) pages.push(i)
      pages.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...')
      for (let i = totalPages - 4; i <= totalPages; i += 1) pages.push(i)
    } else {
      pages.push(1, '...')
      for (let i = currentPage - 1; i <= currentPage + 1; i += 1) pages.push(i)
      pages.push('...', totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="search"
            value={searchKey}
            onChange={(event) => setSearchKey(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            placeholder="Search by room ID or host…"
            className="field pl-9"
          />
        </div>
        <button onClick={handleSearch} className="btn btn-gold px-6 py-2.5">
          Search
        </button>
        <span className="pill pill-muted ml-auto">
          {totalCount} room{totalCount === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div className="panel flex flex-col items-center gap-3 py-20">
          <Loader2 size={32} className="animate-spin text-gold" />
          <p className="text-sm text-mist-500">Loading tables…</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 py-20">
          <Spade size={48} className="text-mist-500/50" />
          <p className="text-lg font-bold text-mist-100">No tables found</p>
          <p className="text-sm text-mist-500">Try a different search, or open your own room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rooms.map((room) => {
            const canJoin = canJoinRoom(room)
            const meta = statusOf(room.status)
            const StatusIcon = meta.icon
            const seats = room.size || 0
            const filled = Math.min(room.members, seats)
            const tooPoor = Boolean(user && user.bounty < (room.fee || 0))

            return (
              <article
                key={room.room_id}
                className={`panel group overflow-hidden transition duration-200 ${
                  canJoin ? 'hover:-translate-y-1 hover:border-gold/50' : 'opacity-80'
                }`}
              >
                {/* Art header */}
                <div className={`relative h-24 bg-gradient-to-br ${meta.art}`}>
                  <div
                    className="absolute inset-0 opacity-[0.14]"
                    style={{
                      backgroundImage: 'url(/imgs/deck/back.svg)',
                      backgroundSize: '46px',
                      backgroundRepeat: 'repeat',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-700 via-ink-700/40 to-transparent" />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                    <span className="pill pill-muted bg-ink-900/70">#{room.room_id}</span>
                    <span className={`pill ${meta.pill} bg-ink-900/70`}>
                      <StatusIcon size={11} />
                      {meta.label}
                    </span>
                  </div>
                  <div className="absolute -bottom-5 left-4">
                    <Avatar name={room.creator} size={44} ring="gold" />
                  </div>
                </div>

                <div className="p-4 pt-7">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-mist-500">Host</p>
                  <p className="truncate text-base font-bold text-mist-100">{room.creator}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-ink-800/70 px-3 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-mist-500">
                        <ChipIcon size={11} /> Entry
                      </p>
                      <p className="text-base font-extrabold tabular-nums text-mist-100">
                        {(room.fee || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-ink-800/70 px-3 py-2">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-mist-500">
                        <Gift size={11} /> Bonus
                      </p>
                      <p className="text-base font-extrabold tabular-nums text-gold">
                        {(room.bonus || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Seats */}
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 font-semibold text-mist-500">
                        <Users size={12} /> Seats
                      </span>
                      <span className="font-bold tabular-nums text-mist-100">
                        {room.members}/{seats}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: seats }).map((_, seatIndex) => (
                        <span
                          key={seatIndex}
                          className={`h-1.5 flex-1 rounded-full ${
                            seatIndex < filled ? 'bg-gold' : 'bg-ink-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onJoinRoom?.(room.room_id)}
                    disabled={!canJoin}
                    className={`btn mt-4 w-full ${canJoin ? 'btn-gold' : 'btn-ghost'}`}
                    title={tooPoor ? 'Not enough bounty for the entry fee' : undefined}
                  >
                    {canJoin ? (
                      <>
                        <DoorOpen size={16} />
                        Join table
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        {room.status !== 0 ? meta.label : tooPoor ? 'Not enough bounty' : 'Unavailable'}
                      </>
                    )}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="icon-btn disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          {pageNumbers.map((page, index) =>
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => setCurrentPage(page)}
                className={`h-10 min-w-10 rounded-xl px-3 text-sm font-bold transition ${
                  page === currentPage
                    ? 'bg-gold text-ink-900'
                    : 'border border-ink-400 bg-ink-600/70 text-mist-300 hover:bg-ink-500/70'
                }`}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="px-1 text-mist-500">
                …
              </span>
            )
          )}
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className="icon-btn disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
