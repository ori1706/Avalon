import { useState } from 'react'
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
}

export function RoleCard({
  role,
  alignment,
  playerName,
  sees = [],
  playerNameMap = {},
  description,
  mode = 'tap',
}: RoleCardProps) {
  const [revealed, setRevealed] = useState(mode === 'always')
  const roleDef = ROLES[role]

  const bgGradient = 'from-slate-800/80 to-slate-900/90'
  const borderColor = 'border-avalon-gold/30'

  const alignmentLabel = alignment === 'good' ? 'Good' : 'Evil'
  const alignmentColor =
    alignment === 'good' ? 'text-avalon-good-light' : 'text-avalon-evil-light'

  if (!revealed && mode === 'tap') {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg text-slate-300">{playerName}, it&apos;s your turn</p>
        <button
          type="button"
          onTouchStart={() => setRevealed(true)}
          onTouchEnd={() => setRevealed(false)}
          onMouseDown={() => setRevealed(true)}
          onMouseUp={() => setRevealed(false)}
          onMouseLeave={() => setRevealed(false)}
          className={`
            w-64 h-80 rounded-2xl border-2 ${borderColor}
            bg-gradient-to-b from-avalon-navy to-avalon-darker
            flex items-center justify-center
            active:scale-95 transition-transform duration-150
            shadow-xl
          `}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">&#128065;</div>
            <p className="text-slate-400 text-sm">Hold to reveal your role</p>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {mode === 'tap' && (
        <p className="text-lg text-slate-300">{playerName}, it&apos;s your turn</p>
      )}
      <div
        onTouchEnd={mode === 'tap' ? () => setRevealed(false) : undefined}
        onMouseUp={mode === 'tap' ? () => setRevealed(false) : undefined}
        className={`
          w-64 min-h-80 rounded-2xl border-2 ${borderColor}
          bg-gradient-to-b ${bgGradient}
          flex flex-col items-center justify-center p-6
          shadow-xl transition-all duration-300
        `}
      >
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
      </div>
    </div>
  )
}
