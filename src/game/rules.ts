export interface PlayerConfig {
  good: number
  evil: number
  questSizes: number[]
  doubleFailQuest: number | null
}

export const PLAYER_CONFIGS: Record<number, PlayerConfig> = {
  5:  { good: 3, evil: 2, questSizes: [2, 3, 2, 3, 3], doubleFailQuest: null },
  6:  { good: 4, evil: 2, questSizes: [2, 3, 4, 3, 4], doubleFailQuest: null },
  7:  { good: 4, evil: 3, questSizes: [2, 3, 3, 4, 4], doubleFailQuest: 4 },
  8:  { good: 5, evil: 3, questSizes: [3, 4, 4, 5, 5], doubleFailQuest: 4 },
  9:  { good: 6, evil: 3, questSizes: [3, 4, 4, 5, 5], doubleFailQuest: 4 },
  10: { good: 6, evil: 4, questSizes: [3, 4, 4, 5, 5], doubleFailQuest: 4 },
}

export const MIN_PLAYERS = 5
export const MAX_PLAYERS = 10
export const MAX_REJECTIONS = 5
export const QUESTS_TO_WIN = 3
export const TOTAL_QUESTS = 5
