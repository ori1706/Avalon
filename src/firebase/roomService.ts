import {
  ref,
  set,
  get,
  onValue,
  update,
  remove,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database'
import { getDb } from './config'
import type { GameState, GameConfig } from '../game/types'

// Firebase Realtime Database rejects `undefined` values.
// JSON round-trip strips them cleanly (undefined → omitted, functions → omitted).
function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export interface RoomData {
  code: string
  hostId: string
  status: 'lobby' | 'playing' | 'finished'
  config: GameConfig | null
  players: Record<string, { name: string; ready: boolean }>
  gameState: GameState | null
  createdAt: unknown
  lastActivity: unknown
}

export async function createRoom(
  hostName: string
): Promise<{ code: string; playerId: string }> {
  const db = getDb()
  const code = generateRoomCode()
  const playerId = crypto.randomUUID().slice(0, 8)

  const roomData: RoomData = {
    code,
    hostId: playerId,
    status: 'lobby',
    config: null,
    players: {
      [playerId]: { name: hostName, ready: true },
    },
    gameState: null,
    createdAt: serverTimestamp(),
    lastActivity: serverTimestamp(),
  }

  await set(ref(db, `rooms/${code}`), roomData)
  return { code, playerId }
}

export async function joinRoom(
  code: string,
  playerName: string
): Promise<{ playerId: string; room: RoomData } | null> {
  const db = getDb()
  const roomRef = ref(db, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) return null

  const room = snapshot.val() as RoomData
  if (room.status !== 'lobby') return null

  const playerId = crypto.randomUUID().slice(0, 8)
  await update(ref(db, `rooms/${code}/players/${playerId}`), {
    name: playerName,
    ready: true,
  })
  await update(ref(db, `rooms/${code}`), { lastActivity: serverTimestamp() })

  return { playerId, room }
}

export function subscribeToRoom(
  code: string,
  callback: (room: RoomData | null) => void
): Unsubscribe {
  const db = getDb()
  return onValue(ref(db, `rooms/${code}`), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as RoomData) : null)
  })
}

export async function updateRoomConfig(
  code: string,
  config: GameConfig
): Promise<void> {
  const db = getDb()
  await update(ref(db, `rooms/${code}`), {
    config,
    lastActivity: serverTimestamp(),
  })
}

export async function updateGameState(
  code: string,
  gameState: GameState
): Promise<void> {
  const db = getDb()
  await update(ref(db, `rooms/${code}`), {
    gameState: sanitize(gameState),
    status: gameState.phase === 'gameOver' ? 'finished' : 'playing',
    lastActivity: serverTimestamp(),
  })
}

export async function startOnlineGame(
  code: string,
  gameState: GameState
): Promise<void> {
  const db = getDb()
  await update(ref(db, `rooms/${code}`), {
    gameState: sanitize(gameState),
    status: 'playing',
    lastActivity: serverTimestamp(),
  })
}

export async function deleteRoom(code: string): Promise<void> {
  const db = getDb()
  await remove(ref(db, `rooms/${code}`))
}

export async function leaveRoom(
  code: string,
  playerId: string
): Promise<void> {
  const db = getDb()
  await remove(ref(db, `rooms/${code}/players/${playerId}`))
}

export function subscribeToGameState(
  code: string,
  callback: (state: GameState | null) => void
): Unsubscribe {
  const db = getDb()
  return onValue(ref(db, `rooms/${code}/gameState`), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as GameState) : null)
  })
}

export async function submitOnlineVote(
  code: string,
  playerId: string,
  vote: 'approve' | 'reject'
): Promise<void> {
  const db = getDb()
  const stateRef = ref(db, `rooms/${code}/gameState`)
  const snapshot = await get(stateRef)
  if (!snapshot.exists()) return

  const state = snapshot.val() as GameState
  const newVotes = [...(state.votes || []), { playerId, vote }]
  await update(stateRef, { votes: newVotes })
}

export async function submitOnlineQuestCard(
  code: string,
  playerId: string,
  action: 'success' | 'fail'
): Promise<void> {
  const db = getDb()
  const stateRef = ref(db, `rooms/${code}/gameState`)
  const snapshot = await get(stateRef)
  if (!snapshot.exists()) return

  const state = snapshot.val() as GameState
  const newCards = [...(state.questCards || []), { playerId, action }]
  await update(stateRef, { questCards: newCards })
}
