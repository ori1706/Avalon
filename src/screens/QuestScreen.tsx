import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { GameHeader } from '../components/GameHeader'
import { Button } from '../components/Button'
import { getCurrentQuest } from '../game/engine'
import type { QuestCard, QuestAction } from '../game/types'

export function QuestScreen() {
  const game = useGameStore((s) => s.game)!
  const submitQuestCard = useGameStore((s) => s.submitQuestCard)
  const [currentMemberIndex, setCurrentMemberIndex] = useState(-1)
  const [localCards, setLocalCards] = useState<QuestCard[]>([])
  const [phase, setPhase] = useState<'intro' | 'playing' | 'passed' | 'reveal'>('intro')

  const quest = getCurrentQuest(game)

  const teamMembers = useMemo(
    () => game.players.filter((p) => quest.proposedTeam.includes(p.id)),
    [game.players, quest.proposedTeam]
  )

  // Randomize button order per player so onlookers can't tell from position
  const buttonOrders = useMemo(() => {
    return teamMembers.map(() => {
      const order: [QuestAction, QuestAction] =
        Math.random() < 0.5 ? ['success', 'fail'] : ['fail', 'success']
      return order
    })
  }, [teamMembers])

  const commitCardsAndContinue = useCallback(() => {
    for (const c of localCards) {
      submitQuestCard(c.playerId, c.action)
    }
  }, [localCards, submitQuestCard])

  if (phase === 'intro') {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Quest {game.currentQuest + 1}</h1>
          <p className="text-slate-400 text-center mb-6 max-w-xs">
            The team goes on the quest. Each member secretly chooses Success or Fail.
            {quest.requiresDoubleFail && (
              <span className="text-avalon-evil-light block mt-2">
                This quest requires 2 fail cards to fail.
              </span>
            )}
          </p>
          <p className="text-slate-300 mb-2">First team member:</p>
          <p className="text-xl font-bold text-avalon-gold mb-6">
            {teamMembers[0].name}
          </p>
          <Button onClick={() => { setCurrentMemberIndex(0); setPhase('playing') }}>
            Begin Quest
          </Button>
        </div>
      </div>
    )
  }

  if (phase === 'reveal') {
    return <QuestReveal localCards={localCards} quest={quest} game={game} onContinue={commitCardsAndContinue} />
  }

  if (phase === 'passed') {
    const isLast = currentMemberIndex === teamMembers.length - 1
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <p className="text-lg text-slate-300 mb-4">Card submitted!</p>
        {isLast ? (
          <Button onClick={() => setPhase('reveal')}>
            Reveal Quest Result
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-slate-400 mb-2">Pass the phone to:</p>
            <p className="text-xl font-bold text-avalon-gold mb-4">
              {teamMembers[currentMemberIndex + 1].name}
            </p>
            <Button
              onClick={() => {
                setCurrentMemberIndex(currentMemberIndex + 1)
                setPhase('playing')
              }}
            >
              I am {teamMembers[currentMemberIndex + 1].name}
            </Button>
          </div>
        )}
      </div>
    )
  }

  const currentMember = teamMembers[currentMemberIndex]
  const isEvil = currentMember.alignment === 'evil'
  const [firstAction, secondAction] = buttonOrders[currentMemberIndex]

  const handleSubmit = (action: QuestAction) => {
    setLocalCards((prev) => [...prev, { playerId: currentMember.id, action }])
    setPhase('passed')
  }

  const buttonLabel = (action: QuestAction) =>
    action === 'success' ? 'Success' : 'Fail'

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <p className="text-sm text-slate-400 mb-1">
          Team member {currentMemberIndex + 1} of {teamMembers.length}
        </p>
        <h1 className="text-xl font-bold mb-6">{currentMember.name}</h1>
        <p className="text-slate-400 text-sm mb-8 text-center max-w-xs">
          Choose your quest card.
        </p>

        <div className="flex gap-4 w-full max-w-xs">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={firstAction === 'fail' && !isEvil}
            onClick={() => handleSubmit(firstAction)}
          >
            {buttonLabel(firstAction)}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled={secondAction === 'fail' && !isEvil}
            onClick={() => handleSubmit(secondAction)}
          >
            {buttonLabel(secondAction)}
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- Animated quest result reveal ---

import { useEffect, useRef } from 'react'
import type { GameState, Quest } from '../game/types'

function QuestReveal({
  localCards,
  quest,
  game,
  onContinue,
}: {
  localCards: QuestCard[]
  quest: Quest
  game: GameState
  onContinue: () => void
}) {
  const [revealPhase, setRevealPhase] = useState<'waiting' | 'flashing' | 'done'>('waiting')
  const [flashIndex, setFlashIndex] = useState(-1)
  const [flashColor, setFlashColor] = useState<'blue' | 'red' | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Sort cards: successes first, fails last — for dramatic effect
  const sortedCards = useMemo(() => {
    const successes = localCards.filter((c) => c.action === 'success')
    const fails = localCards.filter((c) => c.action === 'fail')
    return [...successes, ...fails]
  }, [localCards])

  const fails = localCards.filter((c) => c.action === 'fail').length
  const questFailed = quest.requiresDoubleFail ? fails >= 2 : fails >= 1

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(clearTimeout)
    }
  }, [])

  const startReveal = useCallback(() => {
    setRevealPhase('flashing')
    timeoutRef.current = []

    sortedCards.forEach((card, i) => {
      const showTime = i * 2000
      const t1 = setTimeout(() => {
        setFlashIndex(i)
        setFlashColor(card.action === 'success' ? 'blue' : 'red')
      }, showTime)
      timeoutRef.current.push(t1)

      const clearTime = showTime + 1400
      const t2 = setTimeout(() => {
        setFlashColor(null)
      }, clearTime)
      timeoutRef.current.push(t2)
    })

    const doneTime = sortedCards.length * 2000 + 400
    const t3 = setTimeout(() => {
      setRevealPhase('done')
      setFlashColor(null)
    }, doneTime)
    timeoutRef.current.push(t3)
  }, [sortedCards])

  if (revealPhase === 'waiting') {
    return (
      <div className="flex flex-col min-h-full bg-avalon-dark">
        <GameHeader game={game} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Quest {game.currentQuest + 1}</h1>
          <p className="text-slate-400 text-center mb-8 max-w-xs">
            All cards are in. Ready to reveal the results?
          </p>
          <Button onClick={startReveal}>
            Reveal Results
          </Button>
        </div>
      </div>
    )
  }

  if (revealPhase === 'flashing') {
    let bg = 'bg-avalon-dark'
    if (flashColor === 'blue') bg = 'bg-blue-600'
    if (flashColor === 'red') bg = 'bg-red-600'

    return (
      <div className={`flex flex-col min-h-full transition-colors duration-200 ${bg}`}>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <p className="text-white/60 text-sm mb-4">
            Card {flashIndex + 1} of {sortedCards.length}
          </p>
          <h1 className="text-5xl font-bold text-white">
            {flashColor === 'blue' ? 'Success' : flashColor === 'red' ? 'Fail' : '...'}
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <GameHeader game={game} />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <h1
          className={`text-3xl font-bold mb-4 ${
            questFailed ? 'text-avalon-evil-light' : 'text-avalon-good-light'
          }`}
        >
          Quest {questFailed ? 'Failed!' : 'Succeeded!'}
        </h1>

        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-avalon-good-light">
              {localCards.filter((c) => c.action === 'success').length}
            </p>
            <p className="text-xs text-slate-400">Success</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-avalon-evil-light">{fails}</p>
            <p className="text-xs text-slate-400">Fail</p>
          </div>
        </div>

        <Button fullWidth className="max-w-xs" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  )
}
