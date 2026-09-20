import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { Plus, Spade } from 'lucide-react'
import AppShell from '../components/shell/AppShell'
import RoomList from '../components/RoomList'
import CreateRoomModal from '../components/CreateRoomModal'
import { SOCKET_URL } from '../config/api'

export default function LobbyPage() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  // Listen for room updates so the list stays live
  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket

    socket.on('room_refetch', () => {
      setRefreshTrigger((prev) => prev + 1)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
        {/* Hero */}
        <section className="panel relative mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-felt/40 via-ink-700 to-grape/20" />
          <div
            className="absolute inset-y-0 right-0 w-1/2 opacity-[0.12]"
            style={{
              backgroundImage: 'url(/imgs/deck/back.svg)',
              backgroundSize: '64px',
              backgroundRepeat: 'repeat',
            }}
          />
          <div className="relative flex flex-wrap items-center gap-6 p-6 lg:p-8">
            <div className="min-w-[260px] flex-1">
              <span className="pill pill-gold mb-3">
                <Spade size={12} />
                Luckyman card club
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight text-mist-100 lg:text-4xl">
                Pick a table and play
              </h1>
              <p className="mt-2 max-w-xl text-sm text-mist-300">
                Five cards each from a 54-card deck. Empty your hand first to take the pot — every
                card left in a rival&apos;s hand pays out, and the jokers double it.
              </p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-gold px-7 py-3.5 text-base">
              <Plus size={18} />
              Create table
            </button>
          </div>
        </section>

        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold text-mist-100">Live tables</h2>
          <span className="h-px flex-1 bg-ink-400/60" />
        </div>

        <RoomList onJoinRoom={(roomId) => navigate(`/game/${roomId}`)} refreshTrigger={refreshTrigger} />
      </div>

      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </AppShell>
  )
}
