import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useFirebaseRoom } from '../hooks/useFirebaseRoom'
import { Button } from '../components/Button'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { PLAYER_CONFIGS, MIN_PLAYERS, MAX_PLAYERS } from '../game/rules'
import { canAddRole } from '../game/engine'
import type { GameConfig } from '../game/types'
import { initializeGame } from '../game/engine'
import { startOnlineGame } from '../firebase/roomService'

export function LobbyScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const action = searchParams.get('action')
  const code = searchParams.get('code')
  const name = searchParams.get('name') || 'Player'

  const {
    room,
    playerId: _,
    roomCode,
    isHost,
    loading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useFirebaseRoom()
  void _

  const [initialized, setInitialized] = useState(false)
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 5,
    includePercivalMorgana: false,
    includeMordred: false,
    includeOberon: false,
    includeLadyOfTheLake: false,
  })

  useEffect(() => {
    if (initialized) return
    setInitialized(true)

    if (action === 'create') {
      createRoom(name)
    } else if (action === 'join' && code) {
      joinRoom(code, name)
    }
  }, [action, code, name, initialized, createRoom, joinRoom])

  useEffect(() => {
    if (room?.status === 'playing' && room.gameState && !isHost) {
      navigate('/online-game')
    }
  }, [room, isHost, navigate])

  const playerList = room?.players
    ? Object.entries(room.players).map(([id, data]) => ({
        id,
        name: data.name,
      }))
    : []

  const playerCount = playerList.length

  const handleStartGame = useCallback(async () => {
    if (!room || !roomCode) return

    const players = playerList.map((p) => ({
      id: p.id,
      name: p.name,
    }))

    const finalConfig = { ...config, playerCount: players.length }
    const gameState = initializeGame(players, finalConfig, 'online')

    await startOnlineGame(roomCode, gameState)
    navigate('/online-game')
  }, [room, roomCode, playerList, config, navigate])

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/room')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-avalon-dark">
        <div className="animate-pulse text-avalon-gold text-lg">
          {action === 'create' ? 'Creating room...' : 'Joining room...'}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-avalon-dark px-6">
        <p className="text-avalon-evil-light text-center mb-4">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/room')}>
          Go Back
        </Button>
      </div>
    )
  }

  if (!room || !roomCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-avalon-dark">
        <div className="animate-pulse text-slate-400">Connecting...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button
          type="button"
          onClick={handleLeave}
          className="text-slate-400 hover:text-white"
        >
          &#8592; Leave
        </button>
        <h1 className="text-lg font-semibold">Lobby</h1>
        <div />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Room Code */}
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-1">Room Code</p>
          <p className="text-4xl font-bold tracking-[0.3em] text-avalon-gold">
            {roomCode}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Share this code with your friends
          </p>
        </div>

        {/* Players */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
            Players ({playerCount})
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {playerList.map((player) => (
              <PlayerAvatarWithName
                key={player.id}
                name={player.name}
                isLeader={player.id === room.hostId}
                subtitle={player.id === room.hostId ? 'Host' : undefined}
                size="md"
              />
            ))}
          </div>
        </section>

        {/* Game Config - Host Only */}
        {isHost && playerCount >= MIN_PLAYERS && (
          <section>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Game Settings
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              {PLAYER_CONFIGS[playerCount]?.good} good, {PLAYER_CONFIGS[playerCount]?.evil} evil
            </p>

            <div className="space-y-2">
              <ToggleRow
                label="Percival & Morgana"
                checked={config.includePercivalMorgana}
                disabled={
                  !config.includePercivalMorgana &&
                  !canAddRole({ ...config, playerCount }, 'percivalMorgana')
                }
                onChange={() =>
                  setConfig((c) => ({
                    ...c,
                    includePercivalMorgana: !c.includePercivalMorgana,
                  }))
                }
              />
              <ToggleRow
                label="Mordred"
                checked={config.includeMordred}
                disabled={
                  !config.includeMordred &&
                  !canAddRole({ ...config, playerCount }, 'mordred')
                }
                onChange={() =>
                  setConfig((c) => ({ ...c, includeMordred: !c.includeMordred }))
                }
              />
              <ToggleRow
                label="Oberon"
                checked={config.includeOberon}
                disabled={
                  !config.includeOberon &&
                  !canAddRole({ ...config, playerCount }, 'oberon')
                }
                onChange={() =>
                  setConfig((c) => ({ ...c, includeOberon: !c.includeOberon }))
                }
              />
              <ToggleRow
                label="Lady of the Lake"
                checked={config.includeLadyOfTheLake}
                disabled={false}
                onChange={() =>
                  setConfig((c) => ({
                    ...c,
                    includeLadyOfTheLake: !c.includeLadyOfTheLake,
                  }))
                }
              />
            </div>
          </section>
        )}

        {/* Status Messages */}
        {!isHost && (
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Waiting for the host to start the game...
            </p>
          </div>
        )}

        {isHost && playerCount < MIN_PLAYERS && (
          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Need at least {MIN_PLAYERS} players ({MIN_PLAYERS - playerCount} more)
            </p>
          </div>
        )}

        {isHost && playerCount > MAX_PLAYERS && (
          <div className="text-center">
            <p className="text-avalon-evil-light text-sm">
              Maximum {MAX_PLAYERS} players allowed
            </p>
          </div>
        )}
      </div>

      {/* Start Button - Host Only */}
      {isHost && (
        <div className="px-4 py-4 border-t border-white/5">
          <Button
            size="lg"
            fullWidth
            disabled={playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS}
            onClick={handleStartGame}
          >
            Start Game ({playerCount} players)
          </Button>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between p-3 rounded-xl transition-all
        ${checked ? 'bg-avalon-gold/10 border border-avalon-gold/30' : 'bg-avalon-navy border border-transparent'}
        ${disabled ? 'opacity-40' : 'active:scale-[0.98]'}
      `}
    >
      <span className="text-sm font-medium">{label}</span>
      <div
        className={`
          w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
          ${checked ? 'bg-avalon-gold border-avalon-gold' : 'border-avalon-slate'}
        `}
      >
        {checked && <span className="text-avalon-darker text-xs font-bold">&#10003;</span>}
      </div>
    </button>
  )
}
