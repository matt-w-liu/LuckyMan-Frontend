import { useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Home, LogOut, type LucideIcon, ShoppingBag, Spade, Trophy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface RailItem {
  path: string
  label: string
  icon: LucideIcon
}

const ITEMS: RailItem[] = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/lobby', label: 'Card rooms', icon: Spade },
  { path: '/top-players', label: 'Leaderboard', icon: Trophy },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/how-to-play', label: 'How to play', icon: BookOpen },
]

export default function SideRail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="hidden lg:flex w-[72px] shrink-0 flex-col items-center gap-2 border-r border-ink-400/50 bg-ink-800/80 py-4">
      {ITEMS.map(({ path, label, icon: ItemIcon }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            title={label}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`rail-btn ${active ? 'rail-btn-active' : ''}`}
          >
            <ItemIcon size={20} strokeWidth={2.2} />
          </button>
        )
      })}

      <div className="mt-auto">
        <button onClick={logout} title="Log out" aria-label="Log out" className="rail-btn hover:text-punch">
          <LogOut size={20} strokeWidth={2.2} />
        </button>
      </div>
    </aside>
  )
}
