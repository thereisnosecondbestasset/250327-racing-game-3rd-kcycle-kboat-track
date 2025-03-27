import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { ModeSelect } from '@/components/ModeSelect'
import { DifficultySelect } from '@/components/DifficultySelect'
import { BetTypeSelect } from '@/components/BetTypeSelect'
import { BettingScreen } from '@/components/BettingScreen'
import '../styles/ui.css'

export const Game: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { gameState, setGameState, selectedRacers, setBetInfo } = useGameStore()

  useEffect(() => {
    if (!containerRef.current) return

    // Three.js 씬 설정
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    
    renderer.setSize(window.innerWidth, window.innerHeight)
    containerRef.current.appendChild(renderer.domElement)

    // 배경색 설정
    scene.background = new THREE.Color(0x1C1F26)

    // 기본 큐브 추가 (테스트용)
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    camera.position.z = 5

    // 애니메이션 루프
    const animate = () => {
      requestAnimationFrame(animate)
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    // 리사이즈 핸들러
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize)
      containerRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  const renderUI = () => {
    switch (gameState) {
      case 'idle':
        return <ModeSelect />
      case 'selecting_difficulty':
        return <DifficultySelect />
      case 'selecting_bet_type':
        return <BetTypeSelect />
      case 'betting':
        return <BettingScreen />
      default:
        return null
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
    <div ref={containerRef} className="game-container">
      {renderUI()}
    </div>
  )
} 