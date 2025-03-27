import { create } from 'zustand'

export type GameMode = 'keirin' | 'boat'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type BetType = 
  | 'single'      // 단승식 (쉬움)
  | 'double'      // 연승식 (쉬움)
  | 'multiple'    // 복승식 (보통)
  | 'triple'      // 삼복승식 (보통)
  | 'pair'        // 쌍승식 (어려움)
  | 'pairMultiple' // 복쌍승식 (어려움)
  | 'triplePair'  // 삼쌍승식 (어려움)

export interface BetTypeInfo {
  type: BetType
  name: string
  desc: string
  selectDesc: string
  maxSelections: number
  orderMatters: boolean
}

export const BET_TYPE_INFO: Record<BetType, BetTypeInfo> = {
  single: {
    type: 'single',
    name: '단승식',
    desc: '1위 선수 맞히기',
    selectDesc: '1위 예상 선수 1명 선택',
    maxSelections: 1,
    orderMatters: false
  },
  double: {
    type: 'double',
    name: '연승식',
    desc: '2위 안에 들 선수 맞히기',
    selectDesc: '2위 안에 들 선수 1명 선택',
    maxSelections: 1,
    orderMatters: false
  },
  multiple: {
    type: 'multiple',
    name: '복승식',
    desc: '1,2위 선수 맞히기 (순서무관)',
    selectDesc: '1,2위 예상 선수 2명 선택',
    maxSelections: 2,
    orderMatters: false
  },
  triple: {
    type: 'triple',
    name: '삼복승식',
    desc: '1,2,3위 선수 맞히기 (순서무관)',
    selectDesc: '1,2,3위 예상 선수 3명 선택',
    maxSelections: 3,
    orderMatters: false
  },
  pair: {
    type: 'pair',
    name: '쌍승식',
    desc: '1,2위 순서 맞히기',
    selectDesc: '1위 선수 → 2위 선수 순서대로 선택',
    maxSelections: 2,
    orderMatters: true
  },
  pairMultiple: {
    type: 'pairMultiple',
    name: '쌍복승식',
    desc: '1위와 2,3위 순서 맞히기',
    selectDesc: '1위 선수 → 2,3위 선수 2명 선택',
    maxSelections: 3,
    orderMatters: true
  },
  triplePair: {
    type: 'triplePair',
    name: '삼쌍승식',
    desc: '1,2,3위 순서 맞히기',
    selectDesc: '1위 → 2위 → 3위 순서대로 선택',
    maxSelections: 3,
    orderMatters: true
  }
}

interface BetInfo {
  selectedRacers: number[]
  betAmount: number
  expectedReturn: number
}

interface GameState {
  gameMode: GameMode | null
  difficulty: Difficulty | null
  betType: BetType | null
  selectedRacers: number[]
  betAmount: number
  userPoints: number // 사용자 보유 포인트
  betInfo: BetInfo | null
  gameState: 'idle' | 'selecting_difficulty' | 'selecting_bet_type' | 'betting' | 'racing' | 'finished'
  setGameMode: (mode: GameMode) => void
  setDifficulty: (difficulty: Difficulty) => void
  setBetType: (type: BetType) => void
  setSelectedRacers: (racers: number[]) => void
  setBetAmount: (amount: number) => void
  setGameState: (state: GameState['gameState']) => void
  setBetInfo: (info: BetInfo) => void
  resetGame: () => void
  goBack: () => void
  resetBetting: () => void // 베팅 선택 초기화
}

const initialState = {
  gameMode: null,
  difficulty: null,
  betType: null,
  selectedRacers: [],
  betAmount: 5000, // 최소 베팅 금액으로 초기화
  userPoints: 100000, // 초기 포인트 10만
  betInfo: null,
  gameState: 'idle' as const,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  setGameMode: (mode) => set({ gameMode: mode, gameState: 'selecting_difficulty' }),
  
  setDifficulty: (difficulty) => set({ 
    difficulty, 
    gameState: 'selecting_bet_type',
    betType: null, // 난이도 변경 시 승식 초기화
    selectedRacers: [] // 선택된 선수도 초기화
  }),
  
  setBetType: (type) => set({ 
    betType: type,
    gameState: 'betting',
    selectedRacers: [] // 승식 변경 시 선택된 선수 초기화
  }),
  
  setSelectedRacers: (racers) => set({ selectedRacers: racers }),
  setBetAmount: (amount) => set((state) => ({ 
    betAmount: Math.max(5000, Math.min(amount, Math.min(100000, state.userPoints))) 
  })),
  setGameState: (state) => set({ gameState: state }),
  setBetInfo: (info) => set({ betInfo: info }),
  resetGame: () => set(initialState),
  resetBetting: () => set((state) => ({
    selectedRacers: [],
    betAmount: 5000
  })),
  
  goBack: () => set((state) => {
    switch (state.gameState) {
      case 'selecting_difficulty':
        return initialState
      case 'selecting_bet_type':
        return { ...state, difficulty: null, gameState: 'selecting_difficulty' }
      case 'betting':
        return { ...state, betType: null, selectedRacers: [], betAmount: 5000, gameState: 'selecting_bet_type' }
      case 'racing':
        return { ...state, selectedRacers: [], betAmount: 5000, gameState: 'betting' }
      case 'finished':
        return initialState
      default:
        return state
    }
  })
})) 