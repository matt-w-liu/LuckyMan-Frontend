import { DoorOpen, Play, SkipForward } from 'lucide-react'

interface GameControlsProps {
  onPlayCards: () => void
  onPass: () => void
  onExit: () => void
  canPlay: boolean
  canPass: boolean
  isMyTurn: boolean | undefined
  selectedCount?: number
  /** Why the play button is disabled, when we know. */
  hint?: string
}

export default function GameControls({
  onPlayCards,
  onPass,
  onExit,
  canPlay,
  canPass,
  isMyTurn,
  selectedCount = 0,
  hint,
}: GameControlsProps) {
  if (!isMyTurn) {
    return (
      <div className="pointer-events-none rounded-full border border-white/10 bg-black/55 px-5 py-2 backdrop-blur-sm">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
          Waiting for another player
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-gold/30 bg-black/60 px-3 py-2 shadow-panel backdrop-blur-sm">
      <span className="pill pill-muted whitespace-nowrap">{selectedCount} selected</span>

      <button onClick={onPlayCards} disabled={!canPlay} className="btn btn-gold px-6 py-3">
        <Play size={18} fill="currentColor" />
        Play cards
      </button>

      <button onClick={onPass} disabled={!canPass} className="btn btn-ghost px-5 py-3">
        <SkipForward size={16} />
        Pass
      </button>

      <button onClick={onExit} className="btn btn-punch px-5 py-3">
        <DoorOpen size={16} />
        Exit
      </button>

      {hint && !canPlay && <span className="max-w-[160px] text-[11px] text-mist-500">{hint}</span>}
    </div>
  )
}
