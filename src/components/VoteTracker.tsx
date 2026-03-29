interface VoteTrackerProps {
  rejections: number
  maxRejections?: number
}

export function VoteTracker({ rejections, maxRejections = 5 }: VoteTrackerProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400 mr-1">Rejections:</span>
      {Array.from({ length: maxRejections }).map((_, i) => (
        <div
          key={i}
          className={`
            w-4 h-4 rounded-full border transition-all duration-200
            ${
              i < rejections
                ? 'bg-avalon-evil/60 border-avalon-evil'
                : 'bg-transparent border-avalon-slate'
            }
          `}
        />
      ))}
    </div>
  )
}
