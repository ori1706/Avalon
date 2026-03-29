import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Button } from '../components/Button'

export function LadyOfTheLakeScreen() {
  const game = useGameStore((s) => s.game)!
  const useLady = useGameStore((s) => s.useLadyOfTheLake)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const holder = game.players.find((p) => p.id === game.ladyOfTheLakeHolder)!
  const eligibleTargets = game.players.filter(
    (p) =>
      p.id !== game.ladyOfTheLakeHolder &&
      !game.ladyOfTheLakeHistory.includes(p.id)
  )

  if (showResult && game.ladyOfTheLakeResult) {
    const target = game.players.find(
      (p) => p.id === game.ladyOfTheLakeResult!.targetId
    )!
    const isGood = game.ladyOfTheLakeResult.alignment === 'good'

    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <h1 className="text-xl font-bold mb-4">Lady of the Lake</h1>
          <p className="text-slate-400 mb-6">{holder.name} inspected {target.name}</p>

          <div
            className={`
              px-8 py-6 rounded-2xl border-2 text-center
              ${
                isGood
                  ? 'bg-avalon-good/10 border-avalon-good/30'
                  : 'bg-avalon-evil/10 border-avalon-evil/30'
              }
            `}
          >
            <p className="text-sm text-slate-400 mb-1">{target.name} is</p>
            <p
              className={`text-2xl font-bold ${
                isGood ? 'text-avalon-good-light' : 'text-avalon-evil-light'
              }`}
            >
              {isGood ? 'Good' : 'Evil'}
            </p>
          </div>

          <p className="text-xs text-slate-500 mt-4 text-center max-w-xs">
            The Lady of the Lake token now passes to {target.name}.
            Only {holder.name} sees this result — they may choose to share or lie.
          </p>

          <Button className="mt-6" onClick={() => setShowResult(false)}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  if (game.ladyOfTheLakeResult) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <p className="text-slate-400 text-center mb-6">
            {holder.name} has used the Lady of the Lake.
            The game continues.
          </p>
          <Button
            onClick={() => {
              useGameStore.getState().setPhase('questResult')
            }}
          >
            Continue to Quest Result
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold mb-2">Lady of the Lake</h1>
          <p className="text-slate-400 text-sm max-w-xs">
            <span className="text-avalon-gold font-medium">{holder.name}</span>{' '}
            holds the Lady of the Lake. Choose a player to inspect their
            loyalty.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Pass the phone to {holder.name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {eligibleTargets.map((player) => (
            <PlayerAvatarWithName
              key={player.id}
              name={player.name}
              isSelected={selectedTarget === player.id}
              onClick={() => setSelectedTarget(player.id)}
              size="md"
            />
          ))}
        </div>

        <Button
          fullWidth
          className="max-w-xs"
          disabled={!selectedTarget}
          onClick={() => {
            if (selectedTarget) {
              useLady(selectedTarget)
              setShowResult(true)
            }
          }}
        >
          Inspect Player
        </Button>
      </div>
    </div>
  )
}
