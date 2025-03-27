import React from 'react'
import { Game } from './core/Game'
import { useGameStore } from './store/gameStore'
import RacingScreen from './components/racing/RacingScreen'

const App: React.FC = () => {
  const { gameState } = useGameStore()

  return (
    <div className="app">
      {gameState === 'racing' ? (
        <RacingScreen />
      ) : (
        <Game />
      )}
    </div>
  )
}

export default App 