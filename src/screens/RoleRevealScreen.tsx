import { useState, useMemo } from 'react'
import { useGameStore } from '../store/gameStore'
import { RoleCard } from '../components/RoleCard'
import { Button } from '../components/Button'

export function RoleRevealScreen() {
  const game = useGameStore((s) => s.game)!
  const advanceToNight = useGameStore((s) => s.advanceToNight)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(-1)
  const [confirmed, setConfirmed] = useState(false)

  const playerNameMap = useMemo(
    () => Object.fromEntries(game.players.map((p) => [p.id, p.name])),
    [game.players]
  )

  const allRevealed = currentPlayerIndex >= game.players.length

  if (currentPlayerIndex === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <h1 className="text-2xl font-bold mb-4">Role Assignment</h1>
        <p className="text-slate-400 text-center mb-8 max-w-xs">
          Each player will privately view their role. Pass the phone to each
          player in turn.
        </p>
        <p className="text-slate-300 mb-2">Starting with:</p>
        <p className="text-xl font-bold text-avalon-gold mb-8">
          {game.players[0].name}
        </p>
        <Button onClick={() => setCurrentPlayerIndex(0)}>
          Begin Role Reveal
        </Button>
      </div>
    )
  }

  if (allRevealed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <h1 className="text-2xl font-bold mb-4">All Roles Assigned</h1>
        <p className="text-slate-400 text-center mb-8">
          Everyone has seen their role. Ready for the Night Phase?
        </p>
        <Button onClick={advanceToNight}>Continue to Night Phase</Button>
      </div>
    )
  }

  const player = game.players[currentPlayerIndex]
  const nightInfo = game.nightInfo.find((n) => n.playerId === player.id)!

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <RoleCard
          role={nightInfo.role}
          alignment={nightInfo.alignment}
          playerName={player.name}
          sees={nightInfo.sees}
          playerNameMap={playerNameMap}
          description={nightInfo.description}
        />
        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmed(false)
              setCurrentPlayerIndex(currentPlayerIndex + 1)
            }}
          >
            {currentPlayerIndex < game.players.length - 1
              ? `Done — Pass to ${game.players[currentPlayerIndex + 1].name}`
              : 'Done — All players revealed'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <div className="text-center mb-8">
        <p className="text-slate-400 mb-1">
          Pass the phone to:
        </p>
        <h2 className="text-2xl font-bold text-avalon-gold">{player.name}</h2>
        <p className="text-slate-500 text-sm mt-1">
          Player {currentPlayerIndex + 1} of {game.players.length}
        </p>
      </div>
      <Button onClick={() => setConfirmed(true)}>
        I am {player.name} — Show My Role
      </Button>
    </div>
  )
}
