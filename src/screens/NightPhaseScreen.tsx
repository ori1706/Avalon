import { useGameStore } from '../store/gameStore'
import { Button } from '../components/Button'
import { getLeader } from '../game/engine'

export function NightPhaseScreen() {
  const game = useGameStore((s) => s.game)!
  const advanceToTeamProposal = useGameStore((s) => s.advanceToTeamProposal)

  const leader = getLeader(game)
  const quest = game.quests[game.currentQuest]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <h1 className="text-2xl font-bold mb-6">Night Phase Complete</h1>

      <div className="bg-avalon-navy/50 rounded-2xl p-6 max-w-sm w-full mb-6 border border-white/5">
        <p className="text-slate-400 text-sm mb-4 text-center">
          All players have seen their roles and know who to look for. Now the game begins!
        </p>

        <div className="space-y-3 text-center">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Quest 1</p>
            <p className="text-lg font-semibold text-avalon-gold">
              {quest.teamSize} players needed
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Leader</p>
            <p className="text-lg font-semibold">{leader.name}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-500 text-xs text-center max-w-xs mb-6">
        The leader will propose a team. All players vote on the proposal.
        If rejected, leadership passes to the next player.
      </p>

      <Button onClick={advanceToTeamProposal}>
        Begin Quest Phase
      </Button>
    </div>
  )
}
