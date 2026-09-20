import { useEffect, useRef } from 'react'
import { Activity, Layers, LogIn, Pause, PlayCircle, SkipForward, Trophy } from 'lucide-react'
import Avatar from '../ui/Avatar'
import type { FeedEntry, FeedKind } from '../../hooks/useGameFeed'

const STYLES: Record<FeedKind, { icon: typeof Activity; pill: string; tint: string }> = {
  play: { icon: Layers, pill: 'pill-sky', tint: 'border-sky/30 bg-sky/5' },
  pass: { icon: SkipForward, pill: 'pill-muted', tint: 'border-ink-400/60 bg-ink-800/50' },
  start: { icon: PlayCircle, pill: 'pill-mint', tint: 'border-mint/30 bg-mint/5' },
  win: { icon: Trophy, pill: 'pill-gold', tint: 'border-gold/40 bg-gold/10' },
  pause: { icon: Pause, pill: 'pill-punch', tint: 'border-punch/30 bg-punch/5' },
  join: { icon: LogIn, pill: 'pill-grape', tint: 'border-grape/30 bg-grape/5' },
  draw: { icon: Layers, pill: 'pill-grape', tint: 'border-grape/30 bg-grape/5' },
}

interface GameFeedProps {
  entries: FeedEntry[]
  playersOnline: number
}

export default function GameFeed({ entries, playersOnline }: GameFeedProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries.length])

  return (
    <section className="panel flex min-h-0 flex-col">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Table feed</h2>
          <p className="text-xs text-mist-500">{playersOnline} seated</p>
        </div>
        <span className="pill pill-mint">
          <Activity size={11} />
          Live
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {entries.length === 0 && (
          <p className="px-1 py-8 text-center text-sm text-mist-500">
            Waiting for the first move…
          </p>
        )}

        {entries.map((entry) => {
          const style = STYLES[entry.kind]
          const EntryIcon = style.icon
          return (
            <article
              key={entry.id}
              className={`flex items-start gap-2.5 rounded-xl border p-2.5 animate-fade-up ${style.tint}`}
            >
              {entry.player ? (
                <Avatar name={entry.player} size={28} />
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-600 text-mist-300">
                  <EntryIcon size={14} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-mist-300">
                  {entry.player && (
                    <span className="font-bold text-mist-100">{entry.player} </span>
                  )}
                  {entry.text}
                </p>
                <p className="mt-0.5 text-[11px] text-mist-500">{entry.at}</p>
              </div>
              {entry.count !== undefined && (
                <span className={`pill ${style.pill}`}>{entry.count}</span>
              )}
            </article>
          )
        })}
        <div ref={endRef} />
      </div>
    </section>
  )
}
