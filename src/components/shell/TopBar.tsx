import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, ChevronDown, LogOut, Search, Settings, ShoppingBag, Spade, Trophy, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import { ChipIcon, LogoMark } from '../ui/Chip'

const SEGMENTS = [
  { path: '/lobby', label: 'Casino', icon: Spade },
  { path: '/top-players', label: 'Leaderboard', icon: Trophy },
]

const LINKS = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/how-to-play', label: 'How to play' },
  { path: '/shop', label: 'Shop' },
]

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <header className="sticky top-0 z-50 border-b border-ink-400/50 bg-ink-800/95 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Brand */}
        <button onClick={() => navigate('/dashboard')} className="flex shrink-0 items-center gap-2.5">
          <LogoMark size={36} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-extrabold tracking-wide text-mist-100">LUCKYMAN</span>
            <span className="block text-[11px] font-medium text-mist-500">Card Club</span>
          </span>
        </button>

        {/* Segmented control */}
        <nav className="hidden items-center gap-1 rounded-xl bg-ink-900/70 p-1 md:flex">
          {SEGMENTS.map(({ path, label, icon: SegIcon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  active ? 'bg-ink-600 text-mist-100 shadow-panel' : 'text-mist-500 hover:text-mist-100'
                }`}
              >
                <SegIcon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Text links */}
        <nav className="hidden items-center gap-1 xl:flex">
          {LINKS.map(({ path, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                location.pathname === path ? 'text-gold' : 'text-mist-500 hover:text-mist-100'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist-500" />
          <input
            type="search"
            placeholder="Search rooms…"
            onKeyDown={(event) => {
              if (event.key === 'Enter') navigate('/lobby')
            }}
            className="field pl-9"
          />
        </div>

        {/* Balance */}
        <button
          onClick={() => navigate('/shop')}
          className="ml-auto flex items-center gap-2.5 rounded-xl border border-ink-400 bg-ink-700/80 px-3 py-2 transition hover:border-gold/50 md:ml-0"
        >
          <ChipIcon size={26} />
          <span className="text-left leading-tight">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-mist-500">Balance</span>
            <span className="block text-sm font-extrabold tabular-nums text-gold">
              {(user?.bounty ?? 0).toLocaleString()}
            </span>
          </span>
        </button>

        {/* User */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((value) => !value)}
              className="flex items-center gap-2.5 rounded-xl border border-ink-400 bg-ink-700/80 px-2 py-1.5 transition hover:border-ink-500"
            >
              <Avatar name={user.username} src={user.avatar} size={32} ring="gold" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-bold text-mist-100">{user.username}</span>
                <span className="block text-[11px] text-mist-500">Player</span>
              </span>
              <ChevronDown
                size={16}
                className={`text-mist-500 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-400 bg-ink-700 shadow-panel animate-fade-up">
                <div className="flex items-center gap-3 border-b border-ink-400/60 bg-ink-600/50 px-4 py-3">
                  <Avatar name={user.username} src={user.avatar} size={40} ring="gold" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-mist-100">{user.username}</p>
                    <p className="flex items-center gap-1 text-xs font-semibold text-gold">
                      <ChipIcon size={12} />
                      {(user.bounty ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="py-1.5">
                  {[
                    { label: 'Profile', icon: User, path: '/dashboard' },
                    { label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
                    { label: 'Shop', icon: ShoppingBag, path: '/shop' },
                    { label: 'Settings', icon: Settings, path: '/dashboard' },
                  ].map(({ label, icon: MenuIcon, path }) => (
                    <button
                      key={label}
                      onClick={() => {
                        navigate(path)
                        setOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-mist-300 transition hover:bg-ink-600 hover:text-mist-100"
                    >
                      <MenuIcon size={16} />
                      {label}
                    </button>
                  ))}
                  <div className="my-1.5 border-t border-ink-400/60" />
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-punch transition hover:bg-punch/10"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
