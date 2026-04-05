import type { GameState } from '../game/types'
import { QuestTracker } from './QuestTracker'
import { VoteTracker } from './VoteTracker'

interface GameHeaderProps {
  game: GameState
}

export function GameHeader({ game }: GameHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-3 px-4 bg-avalon-darker/50 border-b border-white/5">
      <QuestTracker quests={game.quests ?? []} currentQuest={game.currentQuest} players={game.players ?? []} />
      <VoteTracker rejections={game.consecutiveRejections ?? 0} />
    </div>
  )
}
