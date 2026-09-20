import { Crown } from 'lucide-react'
import Avatar from './ui/Avatar'
import { ChipIcon } from './ui/Chip'

interface OpponentPlayerProps {
  name?: string
  cardCount?: number
  position?: 'top' | 'left' | 'right' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  isActive?: boolean
  progress?: number // 0 -> 1 across the turn timer
  isEmpty?: boolean
  customPosition?: { x: number; y: number; usePercent?: boolean }
  inline?: boolean
  avatarUrl?: string
  bounty?: number
  isHost?: boolean
  isYou?: boolean
}

const positionClasses = {
  top: 'top-2 left-1/2 -translate-x-1/2',
  left: 'left-2 top-1/2 -translate-y-1/2',
  right: 'right-2 top-1/2 -translate-y-1/2',
  bottom: 'bottom-2 left-1/2 -translate-x-1/2',
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
}

const RING_RADIUS = 46
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

export default function OpponentPlayer({
  name,
  cardCount = 0,
  position,
  isActive = false,
  progress = 0,
  isEmpty = false,
  customPosition,
  inline = false,
  avatarUrl,
  bounty,
  isHost = false,
  isYou = false,
}: OpponentPlayerProps) {
  const pct = Math.min(Math.max(progress, 0), 1)

  const positionStyle = customPosition
    ? {
        left: customPosition.usePercent ? `${customPosition.x}%` : `${customPosition.x}px`,
        top: customPosition.usePercent ? `${customPosition.y}%` : `${customPosition.y}px`,
        transform: 'translate(-50%, -50%)',
      }
    : undefined

  const positionClassName = customPosition ? '' : position ? positionClasses[position] : ''
  const containerClass = inline ? 'relative' : `absolute z-30 ${positionClassName}`

  if (isEmpty) {
    return (
      <div className={containerClass} style={inline ? undefined : positionStyle}>
        <div className="flex w-28 flex-col items-center gap-1.5 opacity-55">
          <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-white/25 bg-black/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Open</span>
          </div>
          <span className="seat-plate py-0.5 text-xs text-white/50">Empty seat</span>
        </div>
      </div>
    )
  }

  const ringColor = pct > 0.7 ? '#ff3d71' : '#ffd426'
  const displayName = name || 'Unknown'

  return (
    <div className={containerClass} style={inline ? undefined : positionStyle} data-player-name={name}>
      <div className="flex w-28 flex-col items-center gap-1">
        <div className={`relative h-[76px] w-[76px] ${isActive ? 'seat-active' : ''}`}>
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="6" />
            {isActive && (
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * pct}
                className="transition-all duration-1000 ease-linear"
                style={{ filter: `drop-shadow(0 0 5px ${ringColor})` }}
              />
            )}
          </svg>

          <Avatar
            name={displayName}
            src={avatarUrl}
            size={62}
            ring="none"
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg ${
              isYou ? 'ring-2 ring-gold' : 'ring-2 ring-white/15'
            }`}
          />

          {isHost && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-ink-900 shadow-md ring-2 ring-ink-900"
              title="Host"
            >
              <Crown size={13} fill="currentColor" />
            </span>
          )}

          <span
            className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-lg bg-ink-900/90 py-0.5 pl-1 pr-1.5 shadow-md ring-1 ring-white/15"
            title={`${cardCount} card${cardCount === 1 ? '' : 's'} left`}
          >
            <img src="/imgs/deck/back.svg" alt="" className="h-[18px] w-[13px] rounded-[2px]" draggable={false} />
            <span className="text-xs font-extrabold tabular-nums text-mist-100">{cardCount}</span>
          </span>

          {/* On the felt the bounty rides on the avatar, keeping the seat short
              enough to leave room for that seat's played cards below it. */}
          {!inline && bounty !== undefined && (
            <span className="absolute -bottom-1 -left-1 flex items-center gap-0.5 whitespace-nowrap rounded-lg bg-ink-900/90 py-0.5 pl-0.5 pr-1 text-[10px] font-bold tabular-nums text-gold/90 shadow-md ring-1 ring-white/15">
              <ChipIcon size={10} />
              {bounty.toLocaleString()}
            </span>
          )}
        </div>

        <span className={`seat-plate max-w-full py-0.5 ${isActive ? 'seat-plate-active' : ''}`}>
          <span className="truncate text-[13px]">{displayName}</span>
          {isYou && <span className="text-[10px] font-bold uppercase text-gold">You</span>}
        </span>

        {inline && bounty !== undefined && (
          <span className="flex items-center gap-1 text-[11px] font-bold tabular-nums text-gold/90">
            <ChipIcon size={12} />
            {bounty.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}
