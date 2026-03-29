export type Alignment = 'good' | 'evil'

export type RoleId =
  | 'loyalServant'
  | 'merlin'
  | 'percival'
  | 'minionOfMordred'
  | 'assassin'
  | 'morgana'
  | 'mordred'
  | 'oberon'

export interface RoleDefinition {
  id: RoleId
  name: string
  alignment: Alignment
  description: string
  isOptional: boolean
  pairedWith?: RoleId
}

export type GamePhase =
  | 'setup'
  | 'roleReveal'
  | 'nightPhase'
  | 'teamProposal'
  | 'teamVote'
  | 'quest'
  | 'questResult'
  | 'assassination'
  | 'gameOver'
  | 'ladyOfTheLake'

export type GameMode = 'local' | 'online'

export interface Player {
  id: string
  name: string
  role?: RoleId
  alignment?: Alignment
}

export type VoteValue = 'approve' | 'reject'
export type QuestAction = 'success' | 'fail'
export type QuestResult = 'success' | 'fail' | 'pending'

export interface QuestVote {
  playerId: string
  vote: VoteValue
}

export interface QuestCard {
  playerId: string
  action: QuestAction
}

export interface Quest {
  questNumber: number
  teamSize: number
  requiresDoubleFail: boolean
  leader: string
  proposedTeam: string[]
  votes: QuestVote[]
  cards: QuestCard[]
  result: QuestResult
  voteRejections: number
}

export interface GameConfig {
  playerCount: number
  includePercivalMorgana: boolean
  includeMordred: boolean
  includeOberon: boolean
  includeLadyOfTheLake: boolean
}

export interface NightInfo {
  playerId: string
  role: RoleId
  alignment: Alignment
  sees: { playerId: string; label: string }[]
  description: string
}

export interface GameState {
  mode: GameMode
  phase: GamePhase
  config: GameConfig
  players: Player[]
  quests: Quest[]
  currentQuest: number
  currentLeaderIndex: number
  consecutiveRejections: number
  nightInfo: NightInfo[]
  votes: QuestVote[]
  questCards: QuestCard[]
  assassinTarget?: string
  winner?: Alignment
  winReason?: string
  ladyOfTheLakeHolder?: string
  ladyOfTheLakeHistory: string[]
  ladyOfTheLakeResult?: { targetId: string; alignment: Alignment }
}
