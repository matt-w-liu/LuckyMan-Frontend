/** Gold poker chip — the platform's currency mark (bounty). */
export function ChipIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" fill="#8a5a00" />
      <circle cx="16" cy="16" r="13.5" fill="#ffd426" />
      <circle
        cx="16"
        cy="16"
        r="13.5"
        fill="none"
        stroke="#fff6cf"
        strokeWidth="3.2"
        strokeDasharray="5.4 5.4"
        opacity="0.95"
      />
      <circle cx="16" cy="16" r="8.6" fill="#e0a800" stroke="#8a5a00" strokeWidth="1.1" />
      <path d="M16 9.6l1.7 4.2 4.3.2-3.4 2.7 1.2 4.3L16 18.5l-3.8 2.5 1.2-4.3L10 14l4.3-.2z" fill="#fff6cf" />
    </svg>
  )
}

/** Brand mark: spade on a felt tile. */
export function LogoMark({ size = 38, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#17805f" />
          <stop offset="1" stopColor="#0a3c2d" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lm-bg)" />
      <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="#ffd426" strokeWidth="1.5" />
      <path
        d="M16 6.5c-2.6 4.3-6.9 6.5-6.9 10.4a3.4 3.4 0 0 0 6 2.2c-.2 1.7-.8 3-1.7 4.4h5.2c-.9-1.3-1.5-2.6-1.7-4.4a3.4 3.4 0 0 0 6-2.2c0-3.9-4.3-6.1-6.9-10.4z"
        fill="#fff6cf"
      />
    </svg>
  )
}

/** Amount + chip, used for every bounty figure on the platform. */
export function Bounty({
  value,
  size = 14,
  className = '',
}: {
  value: number | undefined
  size?: number
  className?: string
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <ChipIcon size={size} />
      {(value ?? 0).toLocaleString()}
    </span>
  )
}
