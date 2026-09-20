// Deterministic player avatars.
// Falls back to a local CC0 "Notionists" portrait chosen from the username,
// so every player has a real face instead of a letter tile.
const AVATAR_SEEDS = [
  'ace',
  'bolt',
  'comet',
  'delta',
  'echo',
  'flux',
  'ghost',
  'hawk',
  'iris',
  'jolt',
  'kilo',
  'luna',
] as const

export const avatarFor = (name?: string): string => {
  const key = name ?? ''
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return `/avatars/${AVATAR_SEEDS[hash % AVATAR_SEEDS.length]}.svg`
}

interface AvatarProps {
  name?: string
  src?: string
  size?: number
  ring?: 'none' | 'gold' | 'sky' | 'mint'
  className?: string
}

const RING_CLASS: Record<NonNullable<AvatarProps['ring']>, string> = {
  none: 'ring-1 ring-white/10',
  gold: 'ring-2 ring-gold',
  sky: 'ring-2 ring-sky',
  mint: 'ring-2 ring-mint',
}

export default function Avatar({ name, src, size = 36, ring = 'none', className = '' }: AvatarProps) {
  return (
    <img
      src={src || avatarFor(name)}
      alt={name || 'Player'}
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 rounded-full bg-ink-600 object-cover ${RING_CLASS[ring]} ${className}`}
      style={{ width: size, height: size }}
      onError={(event) => {
        const img = event.currentTarget
        const fallback = avatarFor(name)
        if (img.src !== window.location.origin + fallback) img.src = fallback
      }}
    />
  )
}
