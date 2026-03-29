import type { Quest } from '../game/types'

interface QuestTrackerProps {
  quests: Quest[]
  currentQuest: number
}

export function QuestTracker({ quests, currentQuest }: QuestTrackerProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      {quests.map((quest, i) => {
        const isCurrent = i === currentQuest && quest.result === 'pending'
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
          <div
            key={quest.questNumber}
            className={`
              flex flex-col items-center justify-center
              w-12 h-14 rounded-lg border-2 transition-all duration-300 overflow-hidden
              ${bg} ${border}
              ${isCurrent ? 'scale-110 shadow-lg shadow-avalon-gold/20' : ''}
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
          </div>
        )
      })}
    </div>
  )
}
