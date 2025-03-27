import { useMemo } from 'react'
import * as THREE from 'three'

interface GridProps {
  size?: number
  divisions?: number
  color?: string
  opacity?: number
  fadeDistance?: number
  fadeStrength?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  renderOrder?: number
  depthWrite?: boolean
  depthTest?: boolean
}

export const Grid = ({
  size = 1000,
  divisions = 100,
  color = '#61dafb',
  opacity = 0.5,
  fadeDistance = 200,
  fadeStrength = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  renderOrder = 0,
  depthWrite = true,
  depthTest = true,
}: GridProps) => {
  const geometry = useMemo(() => {
    const vertices = []
    const colors = []
    const color1 = new THREE.Color(color)
    const color2 = new THREE.Color('#ff61d5')

    // 가로 선
    for (let i = 0; i <= divisions; i++) {
      const y = (i / divisions - 0.5) * size
      vertices.push(-size/2, y, 0, size/2, y, 0)
      
      const alpha = Math.abs(y) / fadeDistance
      const fade = Math.pow(1 - Math.min(1, alpha), fadeStrength)
      const mixedColor = color1.clone().lerp(color2, Math.abs(y) / size)
      
      colors.push(
        mixedColor.r, mixedColor.g, mixedColor.b,
        mixedColor.r, mixedColor.g, mixedColor.b
      )
    }

    // 세로 선
    for (let i = 0; i <= divisions; i++) {
      const x = (i / divisions - 0.5) * size
      vertices.push(x, -size/2, 0, x, size/2, 0)
      
      const alpha = Math.abs(x) / fadeDistance
      const fade = Math.pow(1 - Math.min(1, alpha), fadeStrength)
      const mixedColor = color1.clone().lerp(color2, Math.abs(x) / size)
      
      colors.push(
        mixedColor.r, mixedColor.g, mixedColor.b,
        mixedColor.r, mixedColor.g, mixedColor.b
      )
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    return geometry
  }, [size, divisions, color, fadeDistance, fadeStrength])

  return (
    <lineSegments position={position} rotation={rotation} renderOrder={renderOrder}>
      <primitive object={geometry} />
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={depthWrite}
        depthTest={depthTest}
      />
    </lineSegments>
  )
}

export default Grid 