import { useState, useEffect, useCallback } from 'react'
import type { RoomData } from '../firebase/roomService'
import { isFirebaseConfigured } from '../firebase/config'

const SESSION_ROOM_CODE = 'avalon_room_code'
const SESSION_PLAYER_ID = 'avalon_player_id'

function loadSession() {
  return {
    roomCode: sessionStorage.getItem(SESSION_ROOM_CODE),
    playerId: sessionStorage.getItem(SESSION_PLAYER_ID),
  }
}

function saveSession(roomCode: string | null, playerId: string | null) {
  if (roomCode) sessionStorage.setItem(SESSION_ROOM_CODE, roomCode)
  else sessionStorage.removeItem(SESSION_ROOM_CODE)
  if (playerId) sessionStorage.setItem(SESSION_PLAYER_ID, playerId)
  else sessionStorage.removeItem(SESSION_PLAYER_ID)
}

interface UseFirebaseRoomReturn {
  room: RoomData | null
  playerId: string | null
  roomCode: string | null
  isHost: boolean
  isConfigured: boolean
  loading: boolean
  error: string | null
  createRoom: (hostName: string) => Promise<void>
  joinRoom: (code: string, playerName: string) => Promise<boolean>
  leaveRoom: () => Promise<void>
}

export function useFirebaseRoom(): UseFirebaseRoomReturn {
  const [room, setRoom] = useState<RoomData | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(() => loadSession().playerId)
  const [roomCode, setRoomCode] = useState<string | null>(() => loadSession().roomCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (!roomCode || !configured) return
    let unsub: (() => void) | undefined

    import('../firebase/roomService').then((mod) => {
      unsub = mod.subscribeToRoom(roomCode, (data) => {
        setRoom(data)
      })
    })

    return () => unsub?.()
  }, [roomCode, configured])

  const handleCreateRoom = useCallback(async (hostName: string) => {
    if (!configured) {
      setError('Firebase is not configured. Add your Firebase config to .env')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const mod = await import('../firebase/roomService')
      const { code, playerId: pid } = await mod.createRoom(hostName)
      setRoomCode(code)
      setPlayerId(pid)
      saveSession(code, pid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }, [configured])

  const handleJoinRoom = useCallback(async (code: string, playerName: string): Promise<boolean> => {
    if (!configured) {
      setError('Firebase is not configured. Add your Firebase config to .env')
      return false
    }
    setLoading(true)
    setError(null)
    try {
      const mod = await import('../firebase/roomService')
      const result = await mod.joinRoom(code, playerName)
      if (!result) {
        setError('Room not found or game already started')
        return false
      }
      setRoomCode(code)
      setPlayerId(result.playerId)
      saveSession(code, result.playerId)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join room')
      return false
    } finally {
      setLoading(false)
    }
  }, [configured])

  const handleLeaveRoom = useCallback(async () => {
    if (!roomCode || !playerId) return
    try {
      const mod = await import('../firebase/roomService')
      await mod.leaveRoom(roomCode, playerId)
    } catch {
      // ignore cleanup errors
    }
    setRoom(null)
    setRoomCode(null)
    setPlayerId(null)
    saveSession(null, null)
  }, [roomCode, playerId])

  return {
    room,
    playerId,
    roomCode,
    isHost: Boolean(room && playerId && room.hostId === playerId),
    isConfigured: configured,
    loading,
    error,
    createRoom: handleCreateRoom,
    joinRoom: handleJoinRoom,
    leaveRoom: handleLeaveRoom,
  }
}
