import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Button } from '../components/Button'

export function AssassinationScreen() {
  const game = useGameStore((s) => s.game)!
  const selectTarget = useGameStore((s) => s.selectAssassinTarget)
  const resolveAssassination = useGameStore((s) => s.resolveAssassinationPhase)

  const assassin = game.players.find((p) => p.role === 'assassin')!
  const goodPlayers = game.players.filter((p) => p.alignment === 'good')

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-avalon-evil-light mb-2">
            Assassination
          </h1>
          <p className="text-slate-400 text-sm max-w-xs">
            Good has completed 3 quests! But{' '}
            <span className="text-avalon-evil-light font-medium">
              {assassin.name}
            </span>{' '}
            (the Assassin) gets one chance to identify Merlin.
          </p>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Pass the phone to {assassin.name}
        </p>

        <div className="bg-avalon-navy/50 rounded-xl p-4 w-full max-w-sm mb-4 border border-white/5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 text-center">
            Who is Merlin?
          </p>
          <div className="grid grid-cols-3 gap-4">
            {goodPlayers.map((player) => (
              <PlayerAvatarWithName
                key={player.id}
                name={player.name}
                isSelected={game.assassinTarget === player.id}
                onClick={() => selectTarget(player.id)}
                size="md"
              />
            ))}
          </div>
        </div>

        <Button
          variant="evil"
          fullWidth
          className="max-w-xs"
          disabled={!game.assassinTarget}
          onClick={resolveAssassination}
        >
          Assassinate
        </Button>
      </div>
    </div>
  )
}
