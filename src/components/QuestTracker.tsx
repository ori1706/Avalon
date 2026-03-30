import { useState } from 'react'
import type { Quest, Player } from '../game/types'

interface QuestTrackerProps {
  quests: Quest[]
  currentQuest: number
  players?: Player[]
}

export function QuestTracker({ quests, currentQuest, players }: QuestTrackerProps) {
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)

  return (
    <>
      <div className="flex items-center justify-center gap-3">
        {quests.map((quest, i) => {
          const isCurrent = i === currentQuest && quest.result === 'pending'
          const isCompleted = quest.result !== 'pending'
          let bg = 'bg-avalon-slate'
          let border = 'border-avalon-slate'
          let textColor = 'text-slate-400'
          let icon: string | null = null
          let iconColor = ''

          if (quest.result === 'success') {
            bg = 'bg-avalon-good/20'
            border = 'border-avalon-good'
            textColor = 'text-avalon-good-light'
            icon = '\u2713'
            iconColor = 'text-avalon-good'
          } else if (quest.result === 'fail') {
            bg = 'bg-avalon-evil/20'
            border = 'border-avalon-evil'
            textColor = 'text-avalon-evil-light'
            icon = '\u2717'
            iconColor = 'text-avalon-evil'
          } else if (isCurrent) {
            bg = 'bg-avalon-gold/10'
            border = 'border-avalon-gold'
            textColor = 'text-avalon-gold'
          }

          return (
            <button
              type="button"
              key={quest.questNumber}
              onClick={isCompleted ? () => setSelectedQuest(quest) : undefined}
              disabled={!isCompleted}
              className={`
                flex flex-col items-center justify-center
                w-12 h-14 rounded-lg border-2 transition-all duration-300 overflow-hidden
                ${bg} ${border}
                ${isCurrent ? 'scale-110 shadow-lg shadow-avalon-gold/20' : ''}
                ${isCompleted ? 'active:scale-95 cursor-pointer' : ''}
              `}
            >
              {icon ? (
                <span className={`text-xl font-bold leading-none ${iconColor}`}>
                  {icon}
                </span>
              ) : (
                <span className={`text-lg font-bold ${textColor}`}>
                  {quest.teamSize}
                </span>
              )}
              {quest.requiresDoubleFail && quest.result === 'pending' && (
                <span className="text-[10px] text-avalon-evil-light">2F</span>
              )}
            </button>
          )
        })}
      </div>

      {selectedQuest && (
        <QuestDetailModal
          quest={selectedQuest}
          players={players}
          onClose={() => setSelectedQuest(null)}
        />
      )}
    </>
  )
}

function QuestDetailModal({
  quest,
  players,
  onClose,
}: {
  quest: Quest
  players?: Player[]
  onClose: () => void
}) {
  const getName = (id: string) =>
    players?.find((p) => p.id === id)?.name ?? '???'

  const successes = quest.cards.filter((c) => c.action === 'success').length
  const fails = quest.cards.filter((c) => c.action === 'fail').length
  const isSuccess = quest.result === 'success'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-avalon-navy rounded-2xl border border-white/10 p-5 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-lg font-bold ${
              isSuccess ? 'text-avalon-good-light' : 'text-avalon-evil-light'
            }`}
          >
            Quest {quest.questNumber} — {isSuccess ? 'Success' : 'Fail'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none p-1"
          >
            &#10005;
          </button>
        </div>

        {/* Team */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Team ({quest.proposedTeam.length} players)
          </p>
          <div className="flex flex-wrap gap-2">
            {quest.proposedTeam.map((id) => (
              <span
                key={id}
                className="px-3 py-1 bg-avalon-slate/50 rounded-full text-sm text-slate-200"
              >
                {getName(id)}
              </span>
            ))}
          </div>
        </div>

        {/* Leader */}
        {quest.leader && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Leader
            </p>
            <p className="text-sm text-slate-300">{getName(quest.leader)}</p>
          </div>
        )}

        {/* Result Cards */}
        <div className="mb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            Quest Cards
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-avalon-good/20 border border-avalon-good/30 flex items-center justify-center">
                <span className="text-avalon-good-light text-sm font-bold">{successes}</span>
              </div>
              <span className="text-xs text-slate-400">Success</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-avalon-evil/20 border border-avalon-evil/30 flex items-center justify-center">
                <span className="text-avalon-evil-light text-sm font-bold">{fails}</span>
              </div>
              <span className="text-xs text-slate-400">Fail</span>
            </div>
          </div>
        </div>

        {quest.requiresDoubleFail && (
          <p className="text-xs text-slate-500 mt-2">
            This quest required 2 fail cards to fail.
          </p>
        )}
      </div>
    </div>
  )
}
