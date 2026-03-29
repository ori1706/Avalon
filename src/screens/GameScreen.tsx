import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { RoleRevealScreen } from './RoleRevealScreen'
import { NightPhaseScreen } from './NightPhaseScreen'
import { TeamProposalScreen } from './TeamProposalScreen'
import { TeamVoteScreen } from './TeamVoteScreen'
import { QuestScreen } from './QuestScreen'
import { QuestResultScreen } from './QuestResultScreen'
import { AssassinationScreen } from './AssassinationScreen'
import { GameOverScreen } from './GameOverScreen'
import { LadyOfTheLakeScreen } from './LadyOfTheLakeScreen'

export function GameScreen() {
  const navigate = useNavigate()
  const game = useGameStore((s) => s.game)

  useEffect(() => {
    if (!game) navigate('/', { replace: true })
  }, [game, navigate])

  if (!game) return null

  switch (game.phase) {
    case 'roleReveal':
      return <RoleRevealScreen />
    case 'nightPhase':
      return <NightPhaseScreen />
    case 'teamProposal':
      return <TeamProposalScreen />
    case 'teamVote':
      return <TeamVoteScreen />
    case 'quest':
      return <QuestScreen />
    case 'questResult':
      return <QuestResultScreen />
    case 'assassination':
      return <AssassinationScreen />
    case 'gameOver':
      return <GameOverScreen />
    case 'ladyOfTheLake':
      return <LadyOfTheLakeScreen />
    default:
      return null
  }
}
