import { useState, useEffect, useRef, useCallback } from 'react'
import type { RoleId, Alignment } from '../game/types'
import { ROLES } from '../game/roles'

interface RoleCardProps {
  role: RoleId
  alignment: Alignment
  playerName: string
  sees?: { playerId: string; label: string }[]
  playerNameMap?: Record<string, string>
  description?: string
  mode?: 'tap' | 'always'
  onFirstReveal?: () => void
}

export function RoleCard({
  role,
  alignment,
  playerName,
  sees = [],
  playerNameMap = {},
  description,
  mode = 'tap',
  onFirstReveal,
}: RoleCardProps) {
  const [revealed, setRevealed] = useState(mode === 'always')
  const hasRevealedOnce = useRef(false)
  const roleDef = ROLES[role]

  const borderColor = 'border-avalon-gold/30'

  const alignmentLabel = alignment === 'good' ? 'Good' : 'Evil'
  const alignmentColor =
    alignment === 'good' ? 'text-avalon-good-light' : 'text-avalon-evil-light'

  const handleRevealStart = useCallback(() => {
    setRevealed(true)
    if (!hasRevealedOnce.current) {
      hasRevealedOnce.current = true
      onFirstReveal?.()
    }
  }, [onFirstReveal])

  const handleRevealEnd = useCallback(() => {
    if (mode === 'tap') setRevealed(false)
  }, [mode])

  const cardContent = (
    <>
      <span className={`text-sm font-medium uppercase tracking-wider ${alignmentColor}`}>
        {alignmentLabel}
      </span>
      <h2 className="text-2xl font-bold mt-2 text-center">{roleDef.name}</h2>
      <p className="text-sm text-slate-300 mt-3 text-center leading-relaxed">
        {description || roleDef.description}
      </p>

      {sees.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 w-full">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 text-center">
            You see:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {sees.map((s) => (
              <span
                key={s.playerId}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${s.label === 'Evil' ? 'bg-avalon-evil/20 text-avalon-evil-light' : 'bg-avalon-good/20 text-avalon-good-light'}
                `}
              >
                {playerNameMap[s.playerId] || '???'} ({s.label})
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="flex flex-col items-center gap-4">
      {mode === 'tap' && (
        <p className="text-lg text-slate-300">{playerName}, it&apos;s your turn</p>
      )}

      <div className="flex items-stretch gap-3">
        {/* The card */}
        <div
          className={`
            w-56 min-h-80 rounded-2xl border-2 ${borderColor}
            bg-gradient-to-b ${revealed ? 'from-slate-800/80 to-slate-900/90' : 'from-avalon-navy to-avalon-darker'}
            flex flex-col items-center justify-center p-6
            shadow-xl transition-all duration-300
          `}
        >
          {revealed ? cardContent : (
            <div className="text-center">
              <div className="text-3xl mb-2 opacity-30">?</div>
              <p className="text-slate-500 text-xs">Role hidden</p>
            </div>
          )}
        </div>

        {/* Hold-to-reveal button on the right */}
        {mode === 'tap' && (
          <button
            type="button"
            onTouchStart={handleRevealStart}
            onTouchEnd={handleRevealEnd}
            onTouchCancel={handleRevealEnd}
            onMouseDown={handleRevealStart}
            onMouseUp={handleRevealEnd}
            onMouseLeave={handleRevealEnd}
            className={`
              w-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-2
              transition-all duration-150 select-none
              ${revealed
                ? 'bg-avalon-gold/20 border-avalon-gold scale-95'
                : 'bg-avalon-navy border-avalon-slate active:scale-95'
              }
            `}
          >
            <span className="text-2xl">{revealed ? '\u{1F441}' : '\u{1F441}'}</span>
            <span className="text-[10px] text-slate-400 leading-tight text-center px-1">
              {revealed ? 'Release to hide' : 'Hold to reveal'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export function CountdownButton({
  durationMs,
  active,
  onClick,
  children,
}: {
  durationMs: number
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const [timeLeft, setTimeLeft] = useState(durationMs)
  const startedRef = useRef(false)

  useEffect(() => {
    if (active && !startedRef.current) {
      startedRef.current = true
      setTimeLeft(durationMs)
    }
  }, [active, durationMs])

  useEffect(() => {
    if (!active || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 100))
    }, 100)
    return () => clearInterval(interval)
  }, [active, timeLeft])

  const disabled = !active || timeLeft > 0
  const seconds = Math.ceil(timeLeft / 1000)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200
        flex items-center justify-center gap-2 min-w-[200px]
        ${disabled
          ? 'bg-avalon-slate text-slate-400 cursor-not-allowed'
          : 'bg-avalon-slate text-white active:scale-95 hover:bg-avalon-slate/80'
        }
      `}
    >
      {disabled && (
        <span className="relative w-5 h-5 flex-shrink-0">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path
              className="opacity-80"
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
      {disabled ? `Wait ${seconds}s...` : children}
    </button>
  )
}
