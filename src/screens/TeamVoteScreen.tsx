import { useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Button } from '../components/Button'
import { getCurrentQuest, getLeader } from '../game/engine'

export function TeamVoteScreen() {
  const game = useGameStore((s) => s.game)!
  const resolveVoteOutcome = useGameStore((s) => s.resolveVoteOutcome)

  const quest = getCurrentQuest(game)
  const leader = getLeader(game)

  const teamPlayers = useMemo(
    () => game.players.filter((p) => quest.proposedTeam.includes(p.id)),
    [game.players, quest.proposedTeam]
  )

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <p className="text-sm text-slate-400 mb-1">Quest {game.currentQuest + 1}</p>
        <h1 className="text-xl font-bold mb-2">
          {leader.name}&apos;s Team
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Vote now — was this team approved or rejected?
        </p>

        <div className="flex gap-4 mb-8">
          {teamPlayers.map((p) => (
            <PlayerAvatarWithName
              key={p.id}
              name={p.name}
              isLeader={p.id === leader.id}
              size="lg"
            />
          ))}
        </div>

        <div className="flex gap-4 w-full max-w-xs">
          <Button
            variant="good"
            size="lg"
            fullWidth
            onClick={() => resolveVoteOutcome(true)}
          >
            Approved
          </Button>
          <Button
            variant="evil"
            size="lg"
            fullWidth
            onClick={() => resolveVoteOutcome(false)}
          >
            Rejected
          </Button>
        </div>

        <p className="text-slate-500 text-xs mt-4 text-center max-w-xs">
          Rejected {game.consecutiveRejections}/5 times in a row.
          {game.consecutiveRejections >= 3 && (
            <span className="text-avalon-evil-light block mt-1">
              2 more rejections and evil wins!
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
