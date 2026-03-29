import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { Button } from '../components/Button'
import { ROLES } from '../game/roles'
import { QuestTracker } from '../components/QuestTracker'

export function GameOverScreen() {
  const navigate = useNavigate()
  const game = useGameStore((s) => s.game)!
  const resetGame = useGameStore((s) => s.resetGame)

  const goodWon = game.winner === 'good'

  const handlePlayAgain = () => {
    resetGame()
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8">
        <div
          className={`text-center mb-6 ${
            goodWon ? 'text-avalon-good-light' : 'text-avalon-evil-light'
          }`}
        >
          <h1 className="text-4xl font-bold mb-2">
            {goodWon ? 'Good Wins!' : 'Evil Wins!'}
          </h1>
          <p className="text-sm opacity-80">{game.winReason}</p>
        </div>

        <QuestTracker quests={game.quests} currentQuest={-1} />

        <div className="w-full max-w-sm mt-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4 text-center">
            All Roles Revealed
          </h2>

          <div className="space-y-2">
            {game.players.map((player) => (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${
                    player.alignment === 'good'
                      ? 'bg-avalon-good/10 border border-avalon-good/20'
                      : 'bg-avalon-evil/10 border border-avalon-evil/20'
                  }
                `}
              >
                <PlayerAvatarWithName
                  name={player.name}
                  alignment={player.alignment}
                  showAlignment
                  size="sm"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{player.name}</p>
                  <p
                    className={`text-xs ${
                      player.alignment === 'good'
                        ? 'text-avalon-good-light'
                        : 'text-avalon-evil-light'
                    }`}
                  >
                    {ROLES[player.role!].name}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    player.alignment === 'good'
                      ? 'bg-avalon-good/20 text-avalon-good-light'
                      : 'bg-avalon-evil/20 text-avalon-evil-light'
                  }`}
                >
                  {player.alignment === 'good' ? 'Good' : 'Evil'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 w-full max-w-xs">
          <Button fullWidth onClick={handlePlayAgain}>
            Play Again
          </Button>
        </div>
      </div>
    </div>
  )
}
