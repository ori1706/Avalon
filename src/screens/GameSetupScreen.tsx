import { useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { useGameStore } from '../store/gameStore'
import { PLAYER_CONFIGS, MIN_PLAYERS, MAX_PLAYERS } from '../game/rules'
import { canAddRole } from '../game/engine'
import { usePlayerRoster } from '../hooks/usePlayerRoster'
import type { GameConfig, GameMode, Player } from '../game/types'

export function GameSetupScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = (searchParams.get('mode') || 'local') as GameMode
  const startGame = useGameStore((s) => s.startGame)
  const { roster, addPlayer, removePlayer } = usePlayerRoster()

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 0,
    includePercivalMorgana: false,
    includeMordred: false,
    includeOberon: false,
    includeLadyOfTheLake: false,
  })

  const playerCount = selectedIds.size
  const playerConfig = PLAYER_CONFIGS[playerCount] ?? null
  const isValidCount = playerCount >= MIN_PLAYERS && playerCount <= MAX_PLAYERS

  const selectedPlayers = useMemo(
    () => roster.filter((p) => selectedIds.has(p.id)),
    [roster, selectedIds]
  )

  const configWithCount = useMemo(
    () => ({ ...config, playerCount }),
    [config, playerCount]
  )

  const togglePlayer = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_PLAYERS) {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleAddPlayer = useCallback(() => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const duplicate = roster.some(
      (p) => p.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) return
    const player = addPlayer(trimmed)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.size < MAX_PLAYERS) next.add(player.id)
      return next
    })
    setNewName('')
  }, [newName, roster, addPlayer])

  const handleRemovePlayer = useCallback(
    (id: string) => {
      removePlayer(id)
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (editingId === id) setEditingId(null)
    },
    [removePlayer, editingId]
  )

  const toggleRole = useCallback(
    (role: 'percivalMorgana' | 'mordred' | 'oberon') => {
      setConfig((prev) => {
        const next = { ...prev, playerCount }
        if (role === 'percivalMorgana')
          next.includePercivalMorgana = !next.includePercivalMorgana
        if (role === 'mordred') next.includeMordred = !next.includeMordred
        if (role === 'oberon') next.includeOberon = !next.includeOberon
        return next
      })
    },
    [playerCount]
  )

  const toggleLady = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      includeLadyOfTheLake: !prev.includeLadyOfTheLake,
    }))
  }, [])

  // Auto-disable roles that no longer fit when player count changes
  const effectiveConfig = useMemo(() => {
    if (!isValidCount) return configWithCount
    const c = { ...configWithCount }
    if (c.includePercivalMorgana && !canAddRole(c, 'percivalMorgana'))
      c.includePercivalMorgana = false
    if (c.includeMordred && !canAddRole(c, 'mordred'))
      c.includeMordred = false
    if (c.includeOberon && !canAddRole(c, 'oberon')) c.includeOberon = false
    return c
  }, [configWithCount, isValidCount])

  const evilRoleCount =
    1 +
    (effectiveConfig.includePercivalMorgana ? 1 : 0) +
    (effectiveConfig.includeMordred ? 1 : 0) +
    (effectiveConfig.includeOberon ? 1 : 0)

  const handleStart = () => {
    const players: Player[] = selectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
    }))
    const finalConfig = { ...effectiveConfig, playerCount }
    startGame(players, finalConfig, mode)
    navigate(mode === 'local' ? '/player-order' : '/game')
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <div className="flex items-center px-4 py-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white mr-3"
        >
          &#8592; Back
        </button>
        <h1 className="text-lg font-semibold">Game Setup</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Player Selection */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-1">
            Select Players
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            {playerCount} selected
            {isValidCount && playerConfig
              ? ` (${playerConfig.good} good, ${playerConfig.evil} evil)`
              : playerCount > 0
                ? ` — need ${playerCount < MIN_PLAYERS ? `at least ${MIN_PLAYERS}` : `at most ${MAX_PLAYERS}`}`
                : ''}
          </p>

          {roster.length > 0 && (
            <div className="space-y-1 mb-3">
              {roster.map((player) => {
                const isSelected = selectedIds.has(player.id)
                return (
                  <div key={player.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePlayer(player.id)}
                      className={`
                        flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                        ${isSelected ? 'bg-avalon-gold/10 border border-avalon-gold/30' : 'bg-avalon-navy border border-transparent'}
                        active:scale-[0.98]
                      `}
                    >
                      <div
                        className={`
                          w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                          ${isSelected ? 'bg-avalon-gold border-avalon-gold' : 'border-avalon-slate'}
                        `}
                      >
                        {isSelected && (
                          <span className="text-avalon-darker text-xs font-bold">
                            &#10003;
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{player.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(player.id)}
                      className="p-2 text-slate-500 hover:text-avalon-evil-light transition-colors rounded-lg hover:bg-white/5"
                      title="Remove player"
                    >
                      <span className="text-sm">&#10005;</span>
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add new player */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddPlayer()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a player..."
              className="flex-1 px-4 py-2.5 bg-avalon-navy border border-avalon-slate rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-avalon-gold transition-colors text-sm"
            />
            <Button
              size="sm"
              disabled={
                !newName.trim() ||
                roster.some(
                  (p) =>
                    p.name.toLowerCase() === newName.trim().toLowerCase()
                )
              }
              onClick={handleAddPlayer}
            >
              Add
            </Button>
          </form>

          {roster.length === 0 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Add your friends above. They&apos;ll be saved for next time.
            </p>
          )}
        </section>

        {/* Optional Roles */}
        {isValidCount && playerConfig && (
          <section>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Optional Roles ({evilRoleCount}/{playerConfig.evil} evil slots
              used)
            </h2>
            <div className="space-y-2">
              <RoleToggle
                label="Percival & Morgana"
                description="Percival sees Merlin & Morgana (can't tell which). Morgana appears as Merlin."
                checked={effectiveConfig.includePercivalMorgana}
                disabled={
                  !effectiveConfig.includePercivalMorgana &&
                  !canAddRole(effectiveConfig, 'percivalMorgana')
                }
                onChange={() => toggleRole('percivalMorgana')}
              />
              <RoleToggle
                label="Mordred"
                description="Evil, but hidden from Merlin's sight."
                checked={effectiveConfig.includeMordred}
                disabled={
                  !effectiveConfig.includeMordred &&
                  !canAddRole(effectiveConfig, 'mordred')
                }
                onChange={() => toggleRole('mordred')}
              />
              <RoleToggle
                label="Oberon"
                description="Evil, but unknown to other evil players (and vice versa)."
                checked={effectiveConfig.includeOberon}
                disabled={
                  !effectiveConfig.includeOberon &&
                  !canAddRole(effectiveConfig, 'oberon')
                }
                onChange={() => toggleRole('oberon')}
              />
            </div>
          </section>
        )}

        {/* Lady of the Lake */}
        {isValidCount && (
          <section>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Optional Mechanics
            </h2>
            <RoleToggle
              label="Lady of the Lake"
              description="After quest 2, the holder can inspect a player's loyalty. The token then passes."
              checked={effectiveConfig.includeLadyOfTheLake}
              disabled={false}
              onChange={toggleLady}
            />
          </section>
        )}
      </div>

      {/* Start Button */}
      <div className="px-4 py-4 border-t border-white/5">
        {playerCount > 0 && !isValidCount && (
          <p className="text-avalon-evil-light text-xs text-center mb-2">
            {playerCount < MIN_PLAYERS
              ? `Select at least ${MIN_PLAYERS} players (${MIN_PLAYERS - playerCount} more)`
              : `Maximum ${MAX_PLAYERS} players`}
          </p>
        )}
        <Button
          size="lg"
          fullWidth
          disabled={!isValidCount}
          onClick={handleStart}
        >
          {isValidCount
            ? `Start Game (${playerCount} players)`
            : 'Select Players to Start'}
        </Button>
      </div>
    </div>
  )
}

function RoleToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string
  description: string
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
        w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all
        ${checked ? 'bg-avalon-gold/10 border border-avalon-gold/30' : 'bg-avalon-navy border border-transparent'}
        ${disabled ? 'opacity-40' : 'active:scale-[0.98]'}
      `}
    >
      <div
        className={`
          mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${checked ? 'bg-avalon-gold border-avalon-gold' : 'border-avalon-slate'}
        `}
      >
        {checked && (
          <span className="text-avalon-darker text-xs font-bold">
            &#10003;
          </span>
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </button>
  )
}
