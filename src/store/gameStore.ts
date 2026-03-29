import { create } from 'zustand'
import type {
  GameState,
  GameConfig,
  GameMode,
  GamePhase,
  Player,
  QuestVote,
  QuestCard,
  Alignment,
} from '../game/types'
import {
  initializeGame,
  resolveTeamVote,
  resolveQuest,
  checkGameEnd,
  resolveAssassination,
  getNextLeaderIndex,
  shouldUseLadyOfTheLake,
} from '../game/engine'

interface GameStore {
  game: GameState | null

  startGame: (players: Player[], config: GameConfig, mode: GameMode) => void
  setPhase: (phase: GamePhase) => void
  advanceToNight: () => void
  advanceToTeamProposal: () => void
  proposeTeam: (teamIds: string[]) => void
  submitVote: (playerId: string, vote: 'approve' | 'reject') => void
  resolveVoteOutcome: (approved: boolean) => void
  submitQuestCard: (playerId: string, action: 'success' | 'fail') => void
  selectAssassinTarget: (targetId: string) => void
  resolveAssassinationPhase: () => void
  useLadyOfTheLake: (targetId: string) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,

  startGame: (players, config, mode) => {
    const game = initializeGame(players, config, mode)
    set({ game })
  },

  setPhase: (phase) => {
    const { game } = get()
    if (!game) return
    set({ game: { ...game, phase } })
  },

  advanceToNight: () => {
    const { game } = get()
    if (!game) return
    set({ game: { ...game, phase: 'nightPhase' } })
  },

  advanceToTeamProposal: () => {
    const { game } = get()
    if (!game) return
    set({
      game: {
        ...game,
        phase: 'teamProposal',
        votes: [],
        questCards: [],
      },
    })
  },

  proposeTeam: (teamIds) => {
    const { game } = get()
    if (!game) return
    const quests = [...game.quests]
    quests[game.currentQuest] = {
      ...quests[game.currentQuest],
      leader: game.players[game.currentLeaderIndex].id,
      proposedTeam: teamIds,
    }
    set({
      game: {
        ...game,
        quests,
        phase: 'teamVote',
        votes: [],
      },
    })
  },

  submitVote: (playerId, vote) => {
    const { game } = get()
    if (!game) return

    const newVotes: QuestVote[] = [...game.votes, { playerId, vote }]

    if (newVotes.length < game.players.length) {
      set({ game: { ...game, votes: newVotes } })
      return
    }

    const approved = resolveTeamVote(newVotes)
    const quests = [...game.quests]

    if (approved) {
      quests[game.currentQuest] = {
        ...quests[game.currentQuest],
        votes: newVotes,
      }
      set({
        game: {
          ...game,
          quests,
          votes: newVotes,
          consecutiveRejections: 0,
          phase: 'quest',
          questCards: [],
        },
      })
    } else {
      const newRejections = game.consecutiveRejections + 1
      quests[game.currentQuest] = {
        ...quests[game.currentQuest],
        voteRejections: quests[game.currentQuest].voteRejections + 1,
      }

      if (newRejections >= 5) {
        set({
          game: {
            ...game,
            quests,
            votes: newVotes,
            consecutiveRejections: newRejections,
            winner: 'evil',
            winReason: '5 team proposals were rejected in a row! Evil wins!',
            phase: 'gameOver',
          },
        })
      } else {
        set({
          game: {
            ...game,
            quests,
            votes: newVotes,
            consecutiveRejections: newRejections,
            currentLeaderIndex: getNextLeaderIndex(
              game.currentLeaderIndex,
              game.players.length
            ),
            phase: 'teamProposal',
          },
        })
      }
    }
  },

  resolveVoteOutcome: (approved) => {
    const { game } = get()
    if (!game) return

    const quests = [...game.quests]

    if (approved) {
      set({
        game: {
          ...game,
          quests,
          votes: [],
          consecutiveRejections: 0,
          phase: 'quest',
          questCards: [],
        },
      })
    } else {
      const newRejections = game.consecutiveRejections + 1
      quests[game.currentQuest] = {
        ...quests[game.currentQuest],
        voteRejections: quests[game.currentQuest].voteRejections + 1,
      }

      if (newRejections >= 5) {
        set({
          game: {
            ...game,
            quests,
            votes: [],
            consecutiveRejections: newRejections,
            winner: 'evil',
            winReason: '5 team proposals were rejected in a row! Evil wins!',
            phase: 'gameOver',
          },
        })
      } else {
        set({
          game: {
            ...game,
            quests,
            votes: [],
            consecutiveRejections: newRejections,
            currentLeaderIndex: getNextLeaderIndex(
              game.currentLeaderIndex,
              game.players.length
            ),
            phase: 'teamProposal',
          },
        })
      }
    }
  },

  submitQuestCard: (playerId, action) => {
    const { game } = get()
    if (!game) return

    const newCards: QuestCard[] = [...game.questCards, { playerId, action }]
    const quest = game.quests[game.currentQuest]

    if (newCards.length < quest.proposedTeam.length) {
      set({ game: { ...game, questCards: newCards } })
      return
    }

    const result = resolveQuest(newCards, quest.requiresDoubleFail)
    const quests = [...game.quests]
    quests[game.currentQuest] = {
      ...quests[game.currentQuest],
      cards: newCards,
      result,
    }

    const endCheck = checkGameEnd(quests)

    if (endCheck.ended) {
      if (endCheck.winner === 'good') {
        set({
          game: {
            ...game,
            quests,
            questCards: newCards,
            phase: 'assassination',
          },
        })
      } else {
        set({
          game: {
            ...game,
            quests,
            questCards: newCards,
            winner: endCheck.winner,
            winReason: endCheck.reason,
            phase: 'gameOver',
          },
        })
      }
    } else {
      const useLady = shouldUseLadyOfTheLake({
        ...game,
        quests,
        currentQuest: game.currentQuest + 1,
      })

      set({
        game: {
          ...game,
          quests,
          questCards: newCards,
          currentQuest: game.currentQuest + 1,
          currentLeaderIndex: getNextLeaderIndex(
            game.currentLeaderIndex,
            game.players.length
          ),
          phase: useLady ? 'ladyOfTheLake' : 'questResult',
        },
      })
    }
  },

  selectAssassinTarget: (targetId) => {
    const { game } = get()
    if (!game) return
    set({ game: { ...game, assassinTarget: targetId } })
  },

  resolveAssassinationPhase: () => {
    const { game } = get()
    if (!game || !game.assassinTarget) return

    const { winner, reason } = resolveAssassination(
      game.assassinTarget,
      game.players
    )
    set({
      game: {
        ...game,
        winner,
        winReason: reason,
        phase: 'gameOver',
      },
    })
  },

  useLadyOfTheLake: (targetId) => {
    const { game } = get()
    if (!game) return

    const target = game.players.find((p) => p.id === targetId)
    if (!target) return

    set({
      game: {
        ...game,
        ladyOfTheLakeResult: {
          targetId,
          alignment: target.alignment as Alignment,
        },
        ladyOfTheLakeHistory: [...game.ladyOfTheLakeHistory, targetId],
        ladyOfTheLakeHolder: targetId,
        phase: 'questResult',
      },
    })
  },

  resetGame: () => {
    set({ game: null })
  },
}))
