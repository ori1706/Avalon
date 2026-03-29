import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'avalon_player_roster'

export interface SavedPlayer {
  id: string
  name: string
}

function loadRoster(): SavedPlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedPlayer[]
  } catch {
    return []
  }
}

function saveRoster(roster: SavedPlayer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roster))
}

export function usePlayerRoster() {
  const [roster, setRoster] = useState<SavedPlayer[]>(loadRoster)

  useEffect(() => {
    saveRoster(roster)
  }, [roster])

  const addPlayer = useCallback((name: string): SavedPlayer => {
    const player: SavedPlayer = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substring(2, 9),
      name: name.trim(),
    }
    setRoster((prev) => [...prev, player])
    return player
  }, [])

  const removePlayer = useCallback((id: string) => {
    setRoster((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const renamePlayer = useCallback((id: string, name: string) => {
    setRoster((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
    )
  }, [])

  return { roster, addPlayer, removePlayer, renamePlayer }
}
