import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Button } from '../components/Button'
import { getLeader, getCurrentQuest } from '../game/engine'

export function TeamProposalScreen() {
  const game = useGameStore((s) => s.game)!
  const proposeTeam = useGameStore((s) => s.proposeTeam)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const leader = getLeader(game)
  const quest = getCurrentQuest(game)

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < quest.teamSize) {
        next.add(id)
      }
      return next
    })
  }

  const handlePropose = () => {
    proposeTeam(Array.from(selectedIds))
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />

      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="text-center mb-6">
          <p className="text-sm text-slate-400">Quest {game.currentQuest + 1}</p>
          <h1 className="text-xl font-bold mt-1">
            <span className="text-avalon-gold">{leader.name}</span>, propose your team
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Select {quest.teamSize} players
            {quest.requiresDoubleFail && (
              <span className="text-avalon-evil-light"> (needs 2 fails)</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {game.players.map((player) => (
            <PlayerAvatarWithName
              key={player.id}
              name={player.name}
              isSelected={selectedIds.has(player.id)}
              isLeader={player.id === leader.id}
              onClick={() => togglePlayer(player.id)}
            />
          ))}
        </div>

        <p className="text-sm text-slate-400 mb-4">
          {selectedIds.size} / {quest.teamSize} selected
        </p>

        <Button
          fullWidth
          disabled={selectedIds.size !== quest.teamSize}
          onClick={handlePropose}
          className="max-w-xs"
        >
          Propose Team
        </Button>
      </div>
    </div>
  )
}
