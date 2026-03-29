import type {
  GameConfig,
  GameState,
  Player,
  RoleId,
  Quest,
  QuestVote,
  QuestCard,
  NightInfo,
  Alignment,
  QuestResult,
} from './types'
import { ROLES } from './roles'
import { PLAYER_CONFIGS, QUESTS_TO_WIN, TOTAL_QUESTS } from './rules'

function shuffle<T>(array: T[]): T[] {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function buildRolePool(config: GameConfig): RoleId[] {
  const { playerCount, includePercivalMorgana, includeMordred, includeOberon } = config
  const playerConfig = PLAYER_CONFIGS[playerCount]
  if (!playerConfig) throw new Error(`Invalid player count: ${playerCount}`)

  const goodRoles: RoleId[] = ['merlin']
  const evilRoles: RoleId[] = ['assassin']

  if (includePercivalMorgana) {
    goodRoles.push('percival')
    evilRoles.push('morgana')
  }

  if (includeMordred) {
    evilRoles.push('mordred')
  }

  if (includeOberon) {
    evilRoles.push('oberon')
  }

  if (evilRoles.length > playerConfig.evil) {
    throw new Error(
      `Too many evil roles selected (${evilRoles.length}) for ${playerCount} players (max ${playerConfig.evil} evil)`
    )
  }
  if (goodRoles.length > playerConfig.good) {
    throw new Error(
      `Too many good roles selected (${goodRoles.length}) for ${playerCount} players (max ${playerConfig.good} good)`
    )
  }

  while (goodRoles.length < playerConfig.good) {
    goodRoles.push('loyalServant')
  }
  while (evilRoles.length < playerConfig.evil) {
    evilRoles.push('minionOfMordred')
  }

  return [...goodRoles, ...evilRoles]
}

export function assignRoles(players: Player[], config: GameConfig): Player[] {
  const roles = shuffle(buildRolePool(config))
  return players.map((player, i) => ({
    ...player,
    role: roles[i],
    alignment: ROLES[roles[i]].alignment,
  }))
}

export function buildNightInfo(players: Player[]): NightInfo[] {
  const evilPlayers = players.filter(
    (p) => p.alignment === 'evil' && p.role !== 'oberon'
  )
  const merlin = players.find((p) => p.role === 'merlin')
  const morgana = players.find((p) => p.role === 'morgana')

  return players.map((player) => {
    const info: NightInfo = {
      playerId: player.id,
      role: player.role!,
      alignment: player.alignment!,
      sees: [],
      description: ROLES[player.role!].description,
    }

    switch (player.role) {
      case 'merlin': {
        const visibleEvil = players.filter(
          (p) => p.alignment === 'evil' && p.role !== 'mordred'
        )
        info.sees = visibleEvil.map((p) => ({
          playerId: p.id,
          label: 'Evil',
        }))
        break
      }
      case 'percival': {
        const targets: { playerId: string; label: string }[] = []
        if (merlin) targets.push({ playerId: merlin.id, label: 'Merlin?' })
        if (morgana) targets.push({ playerId: morgana.id, label: 'Merlin?' })
        info.sees = shuffle(targets)
        break
      }
      case 'assassin':
      case 'morgana':
      case 'mordred':
      case 'minionOfMordred': {
        info.sees = evilPlayers
          .filter((p) => p.id !== player.id)
          .map((p) => ({ playerId: p.id, label: 'Evil' }))
        break
      }
      case 'oberon':
      case 'loyalServant':
      default:
        break
    }

    return info
  })
}

export function createQuests(playerCount: number): Quest[] {
  const config = PLAYER_CONFIGS[playerCount]
  return config.questSizes.map((size, i) => ({
    questNumber: i + 1,
    teamSize: size,
    requiresDoubleFail: config.doubleFailQuest === i + 1,
    leader: '',
    proposedTeam: [],
    votes: [],
    cards: [],
    result: 'pending' as QuestResult,
    voteRejections: 0,
  }))
}

export function initializeGame(
  players: Player[],
  config: GameConfig,
  mode: 'local' | 'online'
): GameState {
  const assignedPlayers = assignRoles(players, config)
  const nightInfo = buildNightInfo(assignedPlayers)
  const quests = createQuests(config.playerCount)
  const startingLeaderIndex = Math.floor(Math.random() * players.length)

  return {
    mode,
    phase: 'roleReveal',
    config,
    players: assignedPlayers,
    quests,
    currentQuest: 0,
    currentLeaderIndex: startingLeaderIndex,
    consecutiveRejections: 0,
    nightInfo,
    votes: [],
    questCards: [],
    winner: undefined,
    winReason: undefined,
    ladyOfTheLakeHolder: config.includeLadyOfTheLake
      ? assignedPlayers[(startingLeaderIndex + assignedPlayers.length - 1) % assignedPlayers.length].id
      : undefined,
    ladyOfTheLakeHistory: [],
  }
}

export function resolveTeamVote(votes: QuestVote[]): boolean {
  const approvals = votes.filter((v) => v.vote === 'approve').length
  return approvals > votes.length / 2
}

export function resolveQuest(
  cards: QuestCard[],
  requiresDoubleFail: boolean
): QuestResult {
  const fails = cards.filter((c) => c.action === 'fail').length
  const failsNeeded = requiresDoubleFail ? 2 : 1
  return fails >= failsNeeded ? 'fail' : 'success'
}

export function checkGameEnd(quests: Quest[]): {
  ended: boolean
  winner?: Alignment
  reason?: string
} {
  const successes = quests.filter((q) => q.result === 'success').length
  const failures = quests.filter((q) => q.result === 'fail').length

  if (successes >= QUESTS_TO_WIN) {
    return { ended: true, winner: 'good', reason: 'Good completed 3 quests! But the Assassin gets one chance...' }
  }
  if (failures >= QUESTS_TO_WIN) {
    return { ended: true, winner: 'evil', reason: 'Evil sabotaged 3 quests!' }
  }
  return { ended: false }
}

export function resolveAssassination(
  targetId: string,
  players: Player[]
): { winner: Alignment; reason: string } {
  const target = players.find((p) => p.id === targetId)
  if (target?.role === 'merlin') {
    return { winner: 'evil', reason: 'The Assassin identified Merlin! Evil wins!' }
  }
  return { winner: 'good', reason: 'The Assassin failed to find Merlin! Good wins!' }
}

export function getNextLeaderIndex(
  currentIndex: number,
  playerCount: number
): number {
  return (currentIndex + 1) % playerCount
}

export function getCurrentQuest(state: GameState): Quest {
  return state.quests[state.currentQuest]
}

export function getLeader(state: GameState): Player {
  return state.players[state.currentLeaderIndex]
}

export function getQuestSuccesses(state: GameState): number {
  return state.quests.filter((q) => q.result === 'success').length
}

export function getQuestFailures(state: GameState): number {
  return state.quests.filter((q) => q.result === 'fail').length
}

export function canAddRole(
  config: GameConfig,
  role: 'percivalMorgana' | 'mordred' | 'oberon'
): boolean {
  const playerConfig = PLAYER_CONFIGS[config.playerCount]
  if (!playerConfig) return false

  let evilCount = 1 // assassin is always included
  if (config.includePercivalMorgana || role === 'percivalMorgana') evilCount++
  if (config.includeMordred || role === 'mordred') evilCount++
  if (config.includeOberon || role === 'oberon') evilCount++

  if (role === 'percivalMorgana' && config.includePercivalMorgana) evilCount--
  if (role === 'mordred' && config.includeMordred) evilCount--
  if (role === 'oberon' && config.includeOberon) evilCount--

  return evilCount <= playerConfig.evil
}

export function getCompletedQuestCount(state: GameState): number {
  return state.quests.filter((q) => q.result !== 'pending').length
}

export function shouldUseLadyOfTheLake(state: GameState): boolean {
  if (!state.config.includeLadyOfTheLake) return false
  const completed = getCompletedQuestCount(state)
  return completed >= 2 && completed <= TOTAL_QUESTS - 1
}
