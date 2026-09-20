/** Inline sprites for the play flourishes. Drawn as SVG so they stay crisp. */

export function BombSprite({ size = 58 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="bomb-body" cx="35%" cy="30%">
          <stop offset="0" stopColor="#5b6478" />
          <stop offset="0.5" stopColor="#222835" />
          <stop offset="1" stopColor="#0b0e16" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="38" r="21" fill="url(#bomb-body)" />
      <ellipse cx="23" cy="30" rx="6" ry="4" fill="#fff" opacity="0.25" />
      <rect x="26" y="12" width="9" height="8" rx="2" fill="#3b4256" />
      <path d="M35 14 C46 6, 52 14, 47 20" stroke="#c98b3f" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="20" r="5" fill="#ffd426" />
      <circle cx="48" cy="20" r="2.5" fill="#fff6cf" />
    </svg>
  )
}

export function MissileSprite({ size = 70 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.42} viewBox="0 0 100 42" aria-hidden="true">
      <path d="M2 21 L22 8 L74 8 Q96 21 74 34 L22 34 Z" fill="#b6c0d4" />
      <path d="M22 8 L74 8 Q96 21 74 34 L22 34 Z" fill="#8a94ab" opacity="0.5" />
      <path d="M74 8 Q96 21 74 34 Z" fill="#ff3d71" />
      <rect x="30" y="16" width="26" height="10" rx="3" fill="#2b3145" />
      <path d="M26 8 L14 -2 L30 6 Z" fill="#7a8399" />
      <path d="M26 34 L14 44 L30 36 Z" fill="#7a8399" />
    </svg>
  )
}

export function TrainSprite({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 200 120" aria-hidden="true">
      {/* chimney + cab */}
      <rect x="24" y="26" width="22" height="24" rx="3" fill="#2b3145" />
      <rect x="18" y="20" width="34" height="8" rx="4" fill="#3b4256" />
      <rect x="10" y="50" width="150" height="42" rx="8" fill="#1f4f8f" />
      <rect x="110" y="24" width="50" height="30" rx="6" fill="#2a63ad" />
      <rect x="120" y="32" width="14" height="14" rx="2" fill="#bfe3ff" />
      <rect x="140" y="32" width="14" height="14" rx="2" fill="#bfe3ff" />
      <rect x="10" y="86" width="160" height="10" rx="4" fill="#12213a" />
      <circle cx="40" cy="102" r="14" fill="#2b3145" stroke="#5b6478" strokeWidth="4" />
      <circle cx="90" cy="102" r="14" fill="#2b3145" stroke="#5b6478" strokeWidth="4" />
      <circle cx="140" cy="102" r="14" fill="#2b3145" stroke="#5b6478" strokeWidth="4" />
      <circle cx="24" cy="70" r="9" fill="#ffd426" />
      <path d="M170 60 L192 70 L170 80 Z" fill="#ffd426" opacity="0.8" />
    </svg>
  )
}

export function PlaneSprite({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 200 100" aria-hidden="true">
      <path d="M10 52 L120 40 Q176 40 192 50 Q176 60 120 60 L10 48 Z" fill="#e6ecfa" />
      <path d="M120 40 Q176 40 192 50 Q176 60 120 60 Z" fill="#b6c0d4" />
      <path d="M96 44 L56 8 L76 8 L126 42 Z" fill="#cfd8ec" />
      <path d="M96 56 L56 92 L76 92 L126 58 Z" fill="#aab4d4" />
      <path d="M30 46 L8 22 L20 22 L46 44 Z" fill="#cfd8ec" />
      <circle cx="168" cy="50" r="5" fill="#3d8bff" />
      <rect x="130" y="45" width="26" height="6" rx="3" fill="#3d8bff" opacity="0.7" />
    </svg>
  )
}
