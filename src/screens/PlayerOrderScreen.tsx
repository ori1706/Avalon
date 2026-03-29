import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useGameStore } from '../store/gameStore'
import { Button } from '../components/Button'
import type { Player } from '../game/types'

function SortablePlayer({ player, index }: { player: Player; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-3 px-4 py-3.5 rounded-xl border select-none
        ${isDragging
          ? 'bg-avalon-gold/10 border-avalon-gold/40 shadow-xl shadow-avalon-gold/10 scale-[1.02]'
          : 'bg-avalon-navy border-transparent active:bg-avalon-gold/5'
        }
        transition-colors duration-150
      `}
    >
      <span className="text-slate-500 text-sm font-mono w-6 text-center flex-shrink-0">
        {index + 1}
      </span>

      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{player.name}</span>
      </div>

      <div className="flex flex-col gap-0.5 text-slate-500 flex-shrink-0 px-1">
        <span className="text-[10px] leading-none">&#9776;</span>
      </div>
    </div>
  )
}

export function PlayerOrderScreen() {
  const navigate = useNavigate()
  const game = useGameStore((s) => s.game)
  const reorderPlayers = useGameStore((s) => s.reorderPlayers)

  const [players, setLocalPlayers] = useState<Player[]>(game?.players ?? [])

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  })
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  })
  const sensors = useSensors(touchSensor, mouseSensor)

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalPlayers((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id)
      const newIndex = prev.findIndex((p) => p.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    reorderPlayers(players)
    navigate('/game')
  }, [players, reorderPlayers, navigate])

  const handleShuffle = useCallback(() => {
    setLocalPlayers((prev) => {
      const shuffled = [...prev]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    })
  }, [])

  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="flex flex-col min-h-full bg-avalon-dark">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white"
        >
          &#8592; Back
        </button>
        <h1 className="text-lg font-semibold">Player Order</h1>
        <button
          type="button"
          onClick={handleShuffle}
          className="text-avalon-gold text-sm font-medium hover:text-avalon-gold-light"
        >
          Shuffle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-slate-400 text-center mb-4">
          Hold and drag to reorder. This determines the turn order.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={players.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {players.map((player, index) => (
                <SortablePlayer
                  key={player.id}
                  player={player}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="px-4 py-4 border-t border-white/5">
        <Button size="lg" fullWidth onClick={handleConfirm}>
          Confirm Order
        </Button>
      </div>
    </div>
  )
}
