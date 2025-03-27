import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { useGameStore } from '@/store/gameStore'
import { RaceTrack } from './RaceTrack'

export const RacingScreen = () => {
  const { gameMode } = useGameStore()

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{
          position: [40, 30, 40],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        shadows
      >
        <color attach="background" args={['#1a1a1a']} />
        <fog attach="fog" args={['#1a1a1a', 150, 250]} />
        
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[50, 50, 0]}
          intensity={1.0}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <directionalLight
          position={[-50, 50, 0]}
          intensity={0.8}
        />
        <pointLight position={[0, 30, 0]} intensity={0.5} />
        <pointLight position={[0, 10, 0]} intensity={0.3} color="#66ccff" />
        
        <RaceTrack type={gameMode} />
        
        <OrbitControls
          target={[0, 0, 0]}
          maxPolarAngle={Math.PI / 2 - 0.1}
          minDistance={30}
          maxDistance={200}
        />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  )
}

export default RacingScreen 