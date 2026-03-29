import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'

export function HomeScreen() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 bg-gradient-to-b from-avalon-dark to-avalon-darker">
      <div className="flex flex-col items-center gap-2 mb-12">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-avalon-gold to-amber-600 flex items-center justify-center shadow-2xl shadow-avalon-gold/20 mb-4">
          <span className="text-5xl">&#9876;</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Avalon</h1>
        <p className="text-slate-400 text-center text-sm">
          The Resistance: Avalon
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate('/setup?mode=local')}
        >
          Pass &amp; Play
        </Button>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={() => navigate('/room')}
        >
          Online Room
        </Button>
      </div>

      <p className="text-slate-500 text-xs mt-12 text-center max-w-xs">
        Pass &amp; Play: One device, pass it between players.
        <br />
        Online Room: Each player uses their own device.
      </p>
    </div>
  )
}
