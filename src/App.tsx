import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { GameSetupScreen } from './screens/GameSetupScreen'
import { GameScreen } from './screens/GameScreen'
import { RoomScreen } from './screens/RoomScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { OnlineGameScreen } from './screens/OnlineGameScreen'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/setup" element={<GameSetupScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/room" element={<RoomScreen />} />
        <Route path="/lobby" element={<LobbyScreen />} />
        <Route path="/online-game" element={<OnlineGameScreen />} />
      </Routes>
    </BrowserRouter>
  )
}
