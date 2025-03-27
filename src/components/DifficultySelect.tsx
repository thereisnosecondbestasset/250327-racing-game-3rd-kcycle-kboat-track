import React from 'react'
import { useGameStore } from '@/store/gameStore'
import '../styles/ui.css'

export const DifficultySelect: React.FC = () => {
  const { gameMode, setDifficulty, goBack } = useGameStore()

  const handleDifficultySelect = (difficulty: 'easy' | 'normal' | 'hard') => {
    setDifficulty(difficulty)
  }

  return (
    <div className="difficulty-select-container">
      <h2 className="difficulty-title">
        {gameMode === 'keirin' ? '경륜' : '경정'} 난이도 선택
      </h2>
      <div className="difficulty-buttons">
        <button 
          className="difficulty-button easy"
          onClick={() => handleDifficultySelect('easy')}
        >
          쉬움
          <span className="difficulty-desc">단승식 / 연승식</span>
        </button>
        <button 
          className="difficulty-button normal"
          onClick={() => handleDifficultySelect('normal')}
        >
          보통
          <span className="difficulty-desc">복승식 / 쌍승식</span>
        </button>
        <button 
          className="difficulty-button hard"
          onClick={() => handleDifficultySelect('hard')}
        >
          어려움
          <span className="difficulty-desc">삼복승식 / 쌍복승식 / 삼쌍승식</span>
        </button>
        <button 
          className="difficulty-button back"
          onClick={goBack}
        >
          돌아가기
        </button>
      </div>
    </div>
  )
} 