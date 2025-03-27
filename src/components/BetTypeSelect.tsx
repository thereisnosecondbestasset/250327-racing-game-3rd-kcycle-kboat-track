import React from 'react'
import { useGameStore } from '@/store/gameStore'
import type { BetType } from '@/store/gameStore'
import { BET_TYPE_INFO } from '@/store/gameStore'
import '../styles/ui.css'

export const BetTypeSelect: React.FC = () => {
  const { gameMode, difficulty, setBetType, goBack } = useGameStore()

  const getBetTypes = () => {
    switch (difficulty) {
      case 'easy':
        return ['single', 'double']
      case 'normal':
        return ['multiple', 'triple']
      case 'hard':
        return ['pair', 'pairMultiple', 'triplePair']
      default:
        return []
    }
  }

  return (
    <div className="bet-type-select-container">
      <h2 className="bet-type-title">
        {gameMode === 'keirin' ? '경륜' : '경정'} 승식 선택
      </h2>
      <div className="bet-type-buttons">
        {getBetTypes().map((type) => {
          const info = BET_TYPE_INFO[type as BetType]
          return (
            <button 
              key={type}
              className="bet-type-button"
              onClick={() => setBetType(type as BetType)}
            >
              <span className="bet-type-name">{info.name}</span>
              <span className="bet-type-desc">{info.desc}</span>
            </button>
          )
        })}
        <button 
          className="bet-type-button back"
          onClick={goBack}
        >
          돌아가기
        </button>
      </div>
    </div>
  )
} 