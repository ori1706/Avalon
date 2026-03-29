import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { isFirebaseConfigured } from '../firebase/config'

export function RoomScreen() {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice')

  const configured = isFirebaseConfigured()

  if (!configured) {
    return (
      <div className="flex flex-col min-h-full bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white mr-3"
          >
            &#8592; Back
          </button>
          <h1 className="text-lg font-semibold">Online Room</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="bg-avalon-navy/50 rounded-2xl p-6 max-w-sm w-full border border-white/5 text-center">
            <h2 className="text-xl font-bold mb-3">Firebase Not Configured</h2>
            <p className="text-slate-400 text-sm mb-4">
              To use Online Room mode, you need to set up a Firebase project
              and add your config to a <code className="text-avalon-gold">.env</code> file.
            </p>
            <div className="bg-avalon-darker rounded-lg p-3 text-left text-xs text-slate-400 font-mono">
              <p>VITE_FIREBASE_API_KEY=...</p>
              <p>VITE_FIREBASE_DATABASE_URL=...</p>
              <p>VITE_FIREBASE_PROJECT_ID=...</p>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              See .env.example for all required variables.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex flex-col min-h-full bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="text-slate-400 hover:text-white mr-3"
          >
            &#8592; Back
          </button>
          <h1 className="text-lg font-semibold">Create Room</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xs space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-avalon-navy border border-avalon-slate rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-avalon-gold transition-colors"
              />
            </div>
            <Button
              fullWidth
              size="lg"
              disabled={!playerName.trim()}
              onClick={() => {
                navigate(`/lobby?action=create&name=${encodeURIComponent(playerName.trim())}`)
              }}
            >
              Create Room
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'join') {
    return (
      <div className="flex flex-col min-h-full bg-gradient-to-b from-avalon-dark to-avalon-darker">
        <div className="flex items-center px-4 py-3 border-b border-white/5">
          <button
            type="button"
            onClick={() => setMode('choice')}
            className="text-slate-400 hover:text-white mr-3"
          >
            &#8592; Back
          </button>
          <h1 className="text-lg font-semibold">Join Room</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-xs space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-avalon-navy border border-avalon-slate rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-avalon-gold transition-colors"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="XXXX"
                maxLength={4}
                className="w-full px-4 py-3 bg-avalon-navy border border-avalon-slate rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-slate-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-avalon-gold transition-colors uppercase"
              />
            </div>
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              disabled={roomCode.length !== 4 || !playerName.trim()}
              onClick={() => {
                navigate(`/lobby?action=join&code=${roomCode}&name=${encodeURIComponent(playerName.trim())}`)
              }}
            >
              Join Room
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <div className="flex items-center px-4 py-3 border-b border-white/5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white mr-3"
        >
          &#8592; Back
        </button>
        <h1 className="text-lg font-semibold">Online Room</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs space-y-6">
          <Button fullWidth size="lg" onClick={() => setMode('create')}>
            Create New Room
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <Button
            variant="secondary"
            fullWidth
            size="lg"
            onClick={() => setMode('join')}
          >
            Join Existing Room
          </Button>
        </div>
      </div>
    </div>
  )
}
