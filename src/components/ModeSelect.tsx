import React from 'react'
import { useGameStore } from '@/store/gameStore'
import '../styles/ui.css'

export const ModeSelect: React.FC = () => {
  const { setGameMode } = useGameStore()

  const handleModeSelect = (mode: 'keirin' | 'boat') => {
    setGameMode(mode)
  }

  return (
    <div className="mode-select-container">
      <h1 className="mode-title">경륜·경정 스퍼트 챌린지</h1>
      <div className="mode-buttons">
        <button 
          className="mode-button"
          onClick={() => handleModeSelect('keirin')}
        >
          경륜 모드
        </button>
        <button 
          className="mode-button boat"
          onClick={() => handleModeSelect('boat')}
        >
          경정 모드
        </button>
      </div>
    </div>
  )
} 