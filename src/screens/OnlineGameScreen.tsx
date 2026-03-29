import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFirebaseRoom } from '../hooks/useFirebaseRoom'
import { subscribeToGameState, updateGameState } from '../firebase/roomService'
import { GameHeader } from '../components/GameHeader'
import { PlayerAvatarWithName } from '../components/PlayerAvatar'
import { RoleCard } from '../components/RoleCard'
import { QuestTracker } from '../components/QuestTracker'
import { Button } from '../components/Button'
import {
  resolveTeamVote,
  resolveQuest,
  checkGameEnd,
  resolveAssassination,
  getNextLeaderIndex,
  getCurrentQuest,
  getLeader,
  shouldUseLadyOfTheLake,
} from '../game/engine'
import { ROLES } from '../game/roles'
import type { GameState, Alignment } from '../game/types'

export function OnlineGameScreen() {
  const navigate = useNavigate()
  const { roomCode, playerId, isHost } = useFirebaseRoom()
  const [game, setGame] = useState<GameState | null>(null)

  useEffect(() => {
    if (!roomCode) {
      navigate('/', { replace: true })
      return
    }
    const unsub = subscribeToGameState(roomCode, setGame)
    return unsub
  }, [roomCode, navigate])

  if (!game || !playerId || !roomCode) {
    return (
      <div className="flex items-center justify-center min-h-full bg-avalon-dark">
        <div className="animate-pulse text-slate-400">Loading game...</div>
      </div>
    )
  }

  const myPlayer = game.players.find((p) => p.id === playerId)
  if (!myPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-avalon-dark px-6">
        <p className="text-avalon-evil-light mb-4">You are not in this game.</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    )
  }

  const props = { game, playerId, roomCode, isHost, myPlayer }

  switch (game.phase) {
    case 'roleReveal':
      return <OnlineRoleReveal {...props} />
    case 'nightPhase':
      return <OnlineNightPhase {...props} />
    case 'teamProposal':
      return <OnlineTeamProposal {...props} />
    case 'teamVote':
      return <OnlineTeamVote {...props} />
    case 'quest':
      return <OnlineQuest {...props} />
    case 'questResult':
      return <OnlineQuestResult {...props} />
    case 'assassination':
      return <OnlineAssassination {...props} />
    case 'ladyOfTheLake':
      return <OnlineLadyOfTheLake {...props} />
    case 'gameOver':
      return <OnlineGameOver {...props} />
    default:
      return null
  }
}

interface PhaseProps {
  game: GameState
  playerId: string
  roomCode: string
  isHost: boolean
  myPlayer: GameState['players'][0]
}

function OnlineRoleReveal({ game, playerId, roomCode, isHost }: PhaseProps) {
  const myInfo = game.nightInfo.find((n) => n.playerId === playerId)!
  const playerNameMap = useMemo(
    () => Object.fromEntries(game.players.map((p) => [p.id, p.name])),
    [game.players]
  )

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <RoleCard
        role={myInfo.role}
        alignment={myInfo.alignment}
        playerName={playerNameMap[playerId]}
        sees={myInfo.sees}
        playerNameMap={playerNameMap}
        description={myInfo.description}
      />
      {isHost && (
        <Button
          className="mt-6"
          onClick={() => updateGameState(roomCode, { ...game, phase: 'nightPhase' })}
        >
          Everyone Ready — Continue
        </Button>
      )}
      {!isHost && (
        <p className="text-slate-400 text-sm mt-6">Waiting for host to continue...</p>
      )}
    </div>
  )
}

function OnlineNightPhase({ game, roomCode, isHost }: PhaseProps) {
  const leader = getLeader(game)
  const quest = game.quests[game.currentQuest]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <h1 className="text-2xl font-bold mb-6">Night Phase Complete</h1>
      <div className="bg-avalon-navy/50 rounded-2xl p-6 max-w-sm w-full mb-6 border border-white/5 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Quest 1</p>
        <p className="text-lg font-semibold text-avalon-gold">{quest.teamSize} players needed</p>
        <p className="text-xs text-slate-500 uppercase tracking-wide mt-3">Leader</p>
        <p className="text-lg font-semibold">{leader.name}</p>
      </div>
      {isHost && (
        <Button onClick={() => updateGameState(roomCode, { ...game, phase: 'teamProposal', votes: [], questCards: [] })}>
          Begin Quest Phase
        </Button>
      )}
      {!isHost && <p className="text-slate-400 text-sm">Waiting for host...</p>}
    </div>
  )
}

function OnlineTeamProposal({ game, roomCode, playerId }: PhaseProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const leader = getLeader(game)
  const quest = getCurrentQuest(game)
  const isLeader = leader.id === playerId

  const togglePlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < quest.teamSize) next.add(id)
      return next
    })
  }

  const handlePropose = async () => {
    const quests = [...game.quests]
    quests[game.currentQuest] = {
      ...quests[game.currentQuest],
      leader: leader.id,
      proposedTeam: Array.from(selectedIds),
    }
    await updateGameState(roomCode, { ...game, quests, phase: 'teamVote', votes: [] })
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <p className="text-sm text-slate-400">Quest {game.currentQuest + 1}</p>
        <h1 className="text-xl font-bold mt-1 mb-1">
          {isLeader ? 'Propose your team' : `${leader.name} is choosing a team`}
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Select {quest.teamSize} players
          {quest.requiresDoubleFail && <span className="text-avalon-evil-light"> (needs 2 fails)</span>}
        </p>

        {isLeader ? (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {game.players.map((p) => (
                <PlayerAvatarWithName
                  key={p.id}
                  name={p.name}
                  isSelected={selectedIds.has(p.id)}
                  isLeader={p.id === leader.id}
                  onClick={() => togglePlayer(p.id)}
                />
              ))}
            </div>
            <p className="text-sm text-slate-400 mb-4">{selectedIds.size} / {quest.teamSize}</p>
            <Button fullWidth disabled={selectedIds.size !== quest.teamSize} onClick={handlePropose} className="max-w-xs">
              Propose Team
            </Button>
          </>
        ) : (
          <div className="text-center">
            <p className="text-slate-400 animate-pulse">Waiting for {leader.name} to propose a team...</p>
          </div>
        )}
      </div>
    </div>
  )
}

function OnlineTeamVote({ game, roomCode, playerId }: PhaseProps) {
  const quest = getCurrentQuest(game)
  const leader = getLeader(game)
  const hasVoted = game.votes.some((v) => v.playerId === playerId)
  const allVoted = game.votes.length === game.players.length

  const teamPlayers = useMemo(
    () => game.players.filter((p) => quest.proposedTeam.includes(p.id)),
    [game.players, quest.proposedTeam]
  )

  const handleVote = async (vote: 'approve' | 'reject') => {
    const newVotes = [...game.votes, { playerId, vote }]
    const updatedGame = { ...game, votes: newVotes }

    if (newVotes.length === game.players.length) {
      const approved = resolveTeamVote(newVotes)
      if (approved) {
        const quests = [...game.quests]
        quests[game.currentQuest] = { ...quests[game.currentQuest], votes: newVotes }
        await updateGameState(roomCode, {
          ...updatedGame,
          quests,
          consecutiveRejections: 0,
          phase: 'quest',
          questCards: [],
        })
      } else {
        const rej = game.consecutiveRejections + 1
        const quests = [...game.quests]
        quests[game.currentQuest] = {
          ...quests[game.currentQuest],
          voteRejections: quests[game.currentQuest].voteRejections + 1,
        }
        if (rej >= 5) {
          await updateGameState(roomCode, {
            ...updatedGame,
            quests,
            consecutiveRejections: rej,
            winner: 'evil',
            winReason: '5 team proposals were rejected in a row! Evil wins!',
            phase: 'gameOver',
          })
        } else {
          await updateGameState(roomCode, {
            ...updatedGame,
            quests,
            consecutiveRejections: rej,
            currentLeaderIndex: getNextLeaderIndex(game.currentLeaderIndex, game.players.length),
            phase: 'teamProposal',
          })
        }
      }
    } else {
      await updateGameState(roomCode, updatedGame)
    }
  }

  if (allVoted) {
    const approvals = game.votes.filter((v) => v.vote === 'approve').length
    const rejections = game.votes.filter((v) => v.vote === 'reject').length
    const approved = approvals > rejections

    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <h1 className={`text-3xl font-bold mb-2 ${approved ? 'text-avalon-good-light' : 'text-avalon-evil-light'}`}>
            {approved ? 'Team Approved!' : 'Team Rejected!'}
          </h1>
          <p className="text-slate-400 mb-4">{approvals} approve / {rejections} reject</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Team Vote</h1>
        <p className="text-sm text-slate-400 mb-2">{leader.name}&apos;s proposal:</p>
        <div className="flex gap-3 mb-6">
          {teamPlayers.map((p) => (
            <PlayerAvatarWithName key={p.id} name={p.name} size="sm" />
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-4">
          {game.votes.length} / {game.players.length} voted
        </p>

        {hasVoted ? (
          <p className="text-avalon-gold">Vote submitted! Waiting for others...</p>
        ) : (
          <div className="flex gap-4 w-full max-w-xs">
            <Button variant="good" size="lg" fullWidth onClick={() => handleVote('approve')}>Approve</Button>
            <Button variant="evil" size="lg" fullWidth onClick={() => handleVote('reject')}>Reject</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function OnlineQuest({ game, roomCode, playerId }: PhaseProps) {
  const quest = getCurrentQuest(game)
  const isOnTeam = quest.proposedTeam.includes(playerId)
  const hasPlayed = game.questCards.some((c) => c.playerId === playerId)
  const allPlayed = game.questCards.length === quest.proposedTeam.length
  const myPlayer = game.players.find((p) => p.id === playerId)!
  const isEvil = myPlayer.alignment === 'evil'

  const handlePlay = async (action: 'success' | 'fail') => {
    const newCards = [...game.questCards, { playerId, action }]

    if (newCards.length === quest.proposedTeam.length) {
      const result = resolveQuest(newCards, quest.requiresDoubleFail)
      const quests = [...game.quests]
      quests[game.currentQuest] = { ...quests[game.currentQuest], cards: newCards, result }

      const endCheck = checkGameEnd(quests)
      if (endCheck.ended) {
        if (endCheck.winner === 'good') {
          await updateGameState(roomCode, { ...game, quests, questCards: newCards, phase: 'assassination' })
        } else {
          await updateGameState(roomCode, {
            ...game,
            quests,
            questCards: newCards,
            winner: endCheck.winner,
            winReason: endCheck.reason,
            phase: 'gameOver',
          })
        }
      } else {
        const nextGame = {
          ...game,
          quests,
          questCards: newCards,
          currentQuest: game.currentQuest + 1,
          currentLeaderIndex: getNextLeaderIndex(game.currentLeaderIndex, game.players.length),
        }
        const useLady = shouldUseLadyOfTheLake(nextGame)
        await updateGameState(roomCode, { ...nextGame, phase: useLady ? 'ladyOfTheLake' : 'questResult' })
      }
    } else {
      await updateGameState(roomCode, { ...game, questCards: newCards })
    }
  }

  if (allPlayed) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <p className="text-slate-400 animate-pulse">Processing quest...</p>
        </div>
      </div>
    )
  }

  if (!isOnTeam) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-xl font-bold mb-4">Quest {game.currentQuest + 1}</h1>
          <p className="text-slate-400">You are not on this quest.</p>
          <p className="text-sm text-slate-500 mt-2">
            {game.questCards.length} / {quest.proposedTeam.length} cards played
          </p>
        </div>
      </div>
    )
  }

  if (hasPlayed) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-xl font-bold mb-4">Quest {game.currentQuest + 1}</h1>
          <p className="text-avalon-gold">Card submitted! Waiting for others...</p>
          <p className="text-sm text-slate-500 mt-2">
            {game.questCards.length} / {quest.proposedTeam.length} cards played
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1 className="text-xl font-bold mb-2">Quest {game.currentQuest + 1}</h1>
        <p className="text-slate-400 text-sm mb-6 text-center max-w-xs">
          Choose your quest card.
          {isEvil && <span className="text-avalon-evil-light block mt-1">You are evil — you may choose Fail.</span>}
          {quest.requiresDoubleFail && <span className="text-slate-500 block mt-1">This quest requires 2 fails.</span>}
        </p>
        <div className="flex gap-4 w-full max-w-xs">
          <Button variant="good" size="lg" fullWidth onClick={() => handlePlay('success')}>Success</Button>
          <Button variant="evil" size="lg" fullWidth disabled={!isEvil} onClick={() => handlePlay('fail')}>Fail</Button>
        </div>
      </div>
    </div>
  )
}

function OnlineQuestResult({ game, roomCode, isHost }: PhaseProps) {
  const justCompleted = game.quests[game.currentQuest - 1]
  const isSuccess = justCompleted?.result === 'success'
  const failCount = justCompleted?.cards.filter((c) => c.action === 'fail').length ?? 0
  const successCount = justCompleted?.cards.filter((c) => c.action === 'success').length ?? 0

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1 className={`text-3xl font-bold mb-2 ${isSuccess ? 'text-avalon-good-light' : 'text-avalon-evil-light'}`}>
          Quest {isSuccess ? 'Succeeded!' : 'Failed!'}
        </h1>
        <div className="flex gap-6 mt-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-avalon-good-light">{successCount}</p>
            <p className="text-xs text-slate-400">Success</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-avalon-evil-light">{failCount}</p>
            <p className="text-xs text-slate-400">Fail</p>
          </div>
        </div>
        {isHost && (
          <Button onClick={() => updateGameState(roomCode, { ...game, phase: 'teamProposal', votes: [], questCards: [] })}>
            Continue
          </Button>
        )}
        {!isHost && <p className="text-slate-400 text-sm">Waiting for host...</p>}
      </div>
    </div>
  )
}

function OnlineAssassination({ game, roomCode, playerId }: PhaseProps) {
  const [target, setTarget] = useState<string | null>(game.assassinTarget || null)
  const assassin = game.players.find((p) => p.role === 'assassin')!
  const isAssassin = assassin.id === playerId
  const goodPlayers = game.players.filter((p) => p.alignment === 'good')

  const handleAssassinate = async () => {
    if (!target) return
    const { winner, reason } = resolveAssassination(target, game.players)
    await updateGameState(roomCode, {
      ...game,
      assassinTarget: target,
      winner,
      winReason: reason,
      phase: 'gameOver',
    })
  }

  if (!isAssassin) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-2xl font-bold text-avalon-evil-light mb-4">Assassination</h1>
          <p className="text-slate-400 text-center">
            Good completed 3 quests! {assassin.name} (the Assassin) is choosing their target...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <h1 className="text-2xl font-bold text-avalon-evil-light mb-2">Assassination</h1>
        <p className="text-slate-400 text-sm mb-6 text-center max-w-xs">
          Good completed 3 quests. You have one chance to identify Merlin!
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {goodPlayers.map((p) => (
            <PlayerAvatarWithName key={p.id} name={p.name} isSelected={target === p.id} onClick={() => setTarget(p.id)} size="md" />
          ))}
        </div>
        <Button variant="evil" fullWidth className="max-w-xs" disabled={!target} onClick={handleAssassinate}>
          Assassinate
        </Button>
      </div>
    </div>
  )
}

function OnlineLadyOfTheLake({ game, roomCode, playerId }: PhaseProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const holder = game.players.find((p) => p.id === game.ladyOfTheLakeHolder)!
  const isHolder = holder.id === playerId

  const eligibleTargets = game.players.filter(
    (p) => p.id !== game.ladyOfTheLakeHolder && !game.ladyOfTheLakeHistory.includes(p.id)
  )

  if (showResult && game.ladyOfTheLakeResult) {
    const target = game.players.find((p) => p.id === game.ladyOfTheLakeResult!.targetId)!
    const isGood = game.ladyOfTheLakeResult.alignment === 'good'

    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <h1 className="text-xl font-bold mb-4">Lady of the Lake</h1>
          <div className={`px-8 py-6 rounded-2xl border-2 text-center ${isGood ? 'bg-avalon-good/10 border-avalon-good/30' : 'bg-avalon-evil/10 border-avalon-evil/30'}`}>
            <p className="text-sm text-slate-400 mb-1">{target.name} is</p>
            <p className={`text-2xl font-bold ${isGood ? 'text-avalon-good-light' : 'text-avalon-evil-light'}`}>
              {isGood ? 'Good' : 'Evil'}
            </p>
          </div>
          <Button className="mt-6" onClick={() => updateGameState(roomCode, { ...game, phase: 'questResult' })}>
            Continue
          </Button>
        </div>
      </div>
    )
  }

  if (!isHolder) {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-xl font-bold mb-4">Lady of the Lake</h1>
          <p className="text-slate-400">{holder.name} is using the Lady of the Lake...</p>
        </div>
      </div>
    )
  }

  const handleInspect = async () => {
    if (!selectedTarget) return
    const target = game.players.find((p) => p.id === selectedTarget)!
    await updateGameState(roomCode, {
      ...game,
      ladyOfTheLakeResult: { targetId: selectedTarget, alignment: target.alignment as Alignment },
      ladyOfTheLakeHistory: [...game.ladyOfTheLakeHistory, selectedTarget],
      ladyOfTheLakeHolder: selectedTarget,
    })
    setShowResult(true)
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <h1 className="text-xl font-bold mb-2">Lady of the Lake</h1>
        <p className="text-slate-400 text-sm mb-6 text-center">Choose a player to inspect their loyalty.</p>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {eligibleTargets.map((p) => (
            <PlayerAvatarWithName key={p.id} name={p.name} isSelected={selectedTarget === p.id} onClick={() => setSelectedTarget(p.id)} size="md" />
          ))}
        </div>
        <Button fullWidth className="max-w-xs" disabled={!selectedTarget} onClick={handleInspect}>
          Inspect Player
        </Button>
      </div>
    </div>
  )
}

function OnlineGameOver({ game }: PhaseProps) {
  const navigate = useNavigate()
  const goodWon = game.winner === 'good'

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-4 py-8">
        <div className={`text-center mb-6 ${goodWon ? 'text-avalon-good-light' : 'text-avalon-evil-light'}`}>
          <h1 className="text-4xl font-bold mb-2">{goodWon ? 'Good Wins!' : 'Evil Wins!'}</h1>
          <p className="text-sm opacity-80">{game.winReason}</p>
        </div>
        <QuestTracker quests={game.quests} currentQuest={-1} />
        <div className="w-full max-w-sm mt-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4 text-center">All Roles Revealed</h2>
          <div className="space-y-2">
            {game.players.map((player) => (
              <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl ${player.alignment === 'good' ? 'bg-avalon-good/10 border border-avalon-good/20' : 'bg-avalon-evil/10 border border-avalon-evil/20'}`}>
                <PlayerAvatarWithName name={player.name} alignment={player.alignment} showAlignment size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{player.name}</p>
                  <p className={`text-xs ${player.alignment === 'good' ? 'text-avalon-good-light' : 'text-avalon-evil-light'}`}>
                    {ROLES[player.role!].name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 w-full max-w-xs">
          <Button fullWidth onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    </div>
  )
}
