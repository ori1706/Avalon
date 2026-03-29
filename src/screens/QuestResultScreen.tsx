import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { Button } from '../components/Button'
import { getLeader, getQuestSuccesses, getQuestFailures } from '../game/engine'

export function QuestResultScreen() {
  const game = useGameStore((s) => s.game)!
  const advanceToTeamProposal = useGameStore((s) => s.advanceToTeamProposal)

  const justCompletedQuest = game.quests[game.currentQuest - 1]
  const isSuccess = justCompletedQuest?.result === 'success'
  const failCount = justCompletedQuest?.cards.filter((c) => c.action === 'fail').length ?? 0
  const successCount = justCompletedQuest?.cards.filter((c) => c.action === 'success').length ?? 0

  const totalSuccesses = getQuestSuccesses(game)
  const totalFailures = getQuestFailures(game)
  const leader = getLeader(game)
  const nextQuest = game.quests[game.currentQuest]

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1
          className={`text-3xl font-bold mb-2 ${
            isSuccess ? 'text-avalon-good-light' : 'text-avalon-evil-light'
          }`}
        >
          Quest {isSuccess ? 'Succeeded!' : 'Failed!'}
        </h1>

        <div className="flex gap-6 mb-6 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-avalon-good-light">{successCount}</p>
            <p className="text-xs text-slate-400">Success</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-avalon-evil-light">{failCount}</p>
            <p className="text-xs text-slate-400">Fail</p>
          </div>
        </div>

        <div className="bg-avalon-navy/50 rounded-xl p-4 w-full max-w-sm mb-6 border border-white/5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Overall Score</span>
            <span>
              <span className="text-avalon-good-light">{totalSuccesses}</span>
              <span className="text-slate-500"> — </span>
              <span className="text-avalon-evil-light">{totalFailures}</span>
            </span>
          </div>
        </div>

        {nextQuest && (
          <div className="text-center mb-6">
            <p className="text-sm text-slate-400">
              Next: Quest {game.currentQuest + 1} ({nextQuest.teamSize} players)
            </p>
            <p className="text-sm text-slate-400">
              Leader: <span className="text-white">{leader.name}</span>
            </p>
          </div>
        )}

        <Button onClick={advanceToTeamProposal} fullWidth className="max-w-xs">
          Continue
        </Button>
      </div>
    </div>
  )
}
