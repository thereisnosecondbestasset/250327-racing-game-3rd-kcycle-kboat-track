import React from 'react'
import { useGameStore } from '@/store/gameStore'
import { BET_TYPE_INFO } from '@/store/gameStore'
import '../styles/betting.css'

interface Racer {
  id: number;
  name: string;
  color: string;
  stats: {
    speed: number;
    accel: number;
    stamina: number;
    overall: number;
  };
  odds: number;
}

const KEIRIN_RACERS: Racer[] = [
  {
    id: 1, name: 'LEE', color: '#FFFFFF',
    stats: { speed: 99, accel: 92, stamina: 97, overall: 95 }, odds: 1.5
  },
  {
    id: 2, name: 'KIM', color: '#333333',
    stats: { speed: 95, accel: 95, stamina: 94, overall: 94 }, odds: 2.1
  },
  {
    id: 3, name: 'LIM', color: '#FF3B3B',
    stats: { speed: 92, accel: 97, stamina: 93, overall: 93 }, odds: 2.8
  },
  {
    id: 4, name: 'JUNG', color: '#007BFF',
    stats: { speed: 90, accel: 96, stamina: 95, overall: 92 }, odds: 3.2
  },
  {
    id: 5, name: 'CHO', color: '#FFD700',
    stats: { speed: 88, accel: 94, stamina: 96, overall: 91 }, odds: 4.5
  },
  {
    id: 6, name: 'YU', color: '#00E676',
    stats: { speed: 86, accel: 93, stamina: 98, overall: 90 }, odds: 6.0
  },
  {
    id: 7, name: 'KANG', color: '#FF1493',
    stats: { speed: 85, accel: 91, stamina: 99, overall: 89 }, odds: 8.0
  },
];

const BOAT_RACERS: Racer[] = [
  {
    id: 1, name: 'AHN', color: '#FFFFFF',
    stats: { speed: 98, accel: 93, stamina: 96, overall: 95 }, odds: 1.8
  },
  {
    id: 2, name: 'YU', color: '#333333',
    stats: { speed: 96, accel: 96, stamina: 93, overall: 94 }, odds: 2.2
  },
  {
    id: 3, name: 'OH', color: '#FF3B3B',
    stats: { speed: 93, accel: 98, stamina: 92, overall: 93 }, odds: 2.5
  },
  {
    id: 4, name: 'KANG', color: '#007BFF',
    stats: { speed: 91, accel: 95, stamina: 94, overall: 92 }, odds: 3.5
  },
  {
    id: 5, name: 'JANG', color: '#FFD700',
    stats: { speed: 89, accel: 92, stamina: 95, overall: 91 }, odds: 5.0
  },
  {
    id: 6, name: 'SUL', color: '#00E676',
    stats: { speed: 87, accel: 90, stamina: 97, overall: 90 }, odds: 7.0
  },
];

export const BettingScreen: React.FC = () => {
  const { 
    gameMode, 
    betType, 
    selectedRacers,
    betAmount,
    userPoints,
    setBetAmount,
    setSelectedRacers,
    goBack,
    setGameState,
    setBetInfo
  } = useGameStore()
  const [selectedRacer, setSelectedRacer] = React.useState<Racer | null>(null)

  const racers = gameMode === 'keirin' ? KEIRIN_RACERS : BOAT_RACERS
  const betInfo = BET_TYPE_INFO[betType!]

  // 선택된 선수들의 평균 배당률 계산
  const calculateExpectedReturn = () => {
    if (selectedRacers.length === 0) return 0
    const selectedOdds = selectedRacers.map(id => 
      racers.find(r => r.id === id)?.odds || 0
    )
    const averageOdds = selectedOdds.reduce((a, b) => a + b, 0) / selectedOdds.length
    return Math.round(betAmount * averageOdds)
  }

  const handleBetAmountChange = (delta: number) => {
    setBetAmount(betAmount + delta)
  }

  const canStartRace = selectedRacers.length === betInfo.maxSelections && betAmount >= 5000

  const handleRacerSelect = (racer: Racer) => {
    // 이미 선택된 선수를 클릭하면 선택 해제
    if (selectedRacers.includes(racer.id)) {
      const newSelectedRacers = selectedRacers.filter(id => id !== racer.id)
      setSelectedRacers(newSelectedRacers)
      // 상세 정보에 표시된 선수가 선택 해제되면 상세 정보도 제거
      if (selectedRacer?.id === racer.id) {
        setSelectedRacer(null)
      }
      return
    }

    // 최대 선택 가능 수를 초과하지 않도록 체크
    if (selectedRacers.length < betInfo.maxSelections) {
      setSelectedRacers([...selectedRacers, racer.id])
      setSelectedRacer(racer)
    }
  }

  const handleConfirmBet = () => {
    if (selectedRacers.length === 0) {
      alert('선수를 선택해주세요.')
      return
    }
    if (betAmount <= 0) {
      alert('베팅 금액을 입력해주세요.')
      return
    }
    
    // 베팅 정보 저장
    setBetInfo({
      selectedRacers,
      betAmount,
      expectedReturn: calculateExpectedReturn()
    })
    
    // 레이싱 화면으로 전환
    setGameState('racing')
  }

  return (
    <div className="betting-screen">
      {/* 좌측: 순위 선택 테이블 */}
      <div className="rank-selection">
        <h3>선택한 선수</h3>
        <div className="selection-guide">
          {betInfo.selectDesc}
          <div className="selection-count">
            {selectedRacers.length} / {betInfo.maxSelections}명 선택
          </div>
        </div>
        <div className="rank-table">
          {selectedRacers.map((id, index) => (
            <div key={id} className="rank-row">
              {betInfo.orderMatters ? `${index + 1}위: ` : ''}{racers.find(r => r.id === id)?.name}
            </div>
          ))}
        </div>
      </div>

      {/* 중앙: 선수 목록 */}
      <div className="racers-list">
        {racers.map(racer => (
          <div
            key={racer.id}
            className={`racer-card ${selectedRacers.includes(racer.id) ? 'selected' : ''}`}
            onClick={() => handleRacerSelect(racer)}
          >
            <div 
              className="racer-color" 
              style={{ backgroundColor: racer.color }} 
            />
            <div className="racer-name">{racer.name}</div>
            {selectedRacers.includes(racer.id) && (
              <div className="selection-indicator">
                {betInfo.orderMatters 
                  ? `${selectedRacers.indexOf(racer.id) + 1}위` 
                  : '선택됨'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 우측: 선수 정보 */}
      {selectedRacer && (
        <div className="racer-info">
          <h3>{selectedRacer.name} 선수 정보</h3>
          <div className="stats-graph">
            <div className="stat-row overall">
              <span>종합</span>
              <div className="stat-bar">
                <div className="stat-value overall" style={{ width: `${selectedRacer.stats.overall}%` }} />
              </div>
              <span>{selectedRacer.stats.overall}</span>
            </div>
            <div className="stat-row">
              <span>속력</span>
              <div className="stat-bar">
                <div className="stat-value" style={{ width: `${selectedRacer.stats.speed}%` }} />
              </div>
              <span>{selectedRacer.stats.speed}</span>
            </div>
            <div className="stat-row">
              <span>가속</span>
              <div className="stat-bar">
                <div className="stat-value" style={{ width: `${selectedRacer.stats.accel}%` }} />
              </div>
              <span>{selectedRacer.stats.accel}</span>
            </div>
            <div className="stat-row">
              <span>체력</span>
              <div className="stat-bar">
                <div className="stat-value" style={{ width: `${selectedRacer.stats.stamina}%` }} />
              </div>
              <span>{selectedRacer.stats.stamina}</span>
            </div>
          </div>
          <div className="odds">
            <span>배당률</span>
            <span className="odds-value">{selectedRacer.odds}배</span>
          </div>
        </div>
      )}

      {/* 하단: 베팅 컨트롤 */}
      <div className="betting-controls">
        <div className="betting-main-controls">
          <div className="betting-amount-controls">
            <div className="points-info">
              <span>보유 포인트: {userPoints.toLocaleString()}P</span>
            </div>
            <div className="bet-amount">
              <span>베팅 포인트:</span>
              <button 
                className="adjust-button"
                onClick={() => handleBetAmountChange(-1000)}
                disabled={betAmount <= 5000}
              >
                -
              </button>
              <span className="amount">{betAmount.toLocaleString()}P</span>
              <button 
                className="adjust-button"
                onClick={() => handleBetAmountChange(1000)}
                disabled={betAmount >= Math.min(100000, userPoints)}
              >
                +
              </button>
            </div>
            <div className="expected-return">
              <span>예상 당첨금: </span>
              <span className="amount">{calculateExpectedReturn().toLocaleString()}P</span>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="reset-button"
              onClick={goBack}
            >
              돌아가기
            </button>
            <button 
              className="start-button"
              disabled={!canStartRace}
              onClick={handleConfirmBet}
            >
              베팅 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 