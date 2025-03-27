import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Water } from 'three/examples/jsm/objects/Water.js'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Grid } from './Grid'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'

interface RaceTrackProps {
  type: 'keirin' | 'boat'
}

interface MTLMaterials {
  preload: () => void
  materials: { [key: string]: THREE.Material }
}

// smoothstep 함수 추가
const smoothstep = (min: number, max: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
};

export const RaceTrack = ({ type }: RaceTrackProps) => {
  const isBoatRace = type === 'boat'
  const waterRef = useRef()
  const { scene } = useThree()
  const [trackModel, setTrackModel] = useState<THREE.Group | null>(null)
  
  const cubesRef = useRef<THREE.Mesh[]>([])
  const particlesRef = useRef<THREE.Mesh[]>([])
  const waterParticlesRef = useRef<THREE.Mesh[]>([])
  const textMeshRef = useRef<THREE.Mesh | null>(null)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    const trackSize = isBoatRace ? { width: 160, height: 80 } : { width: 50, height: 50 }
    
    cubesRef.current.forEach(cube => {
      cube.position.y = 5 + Math.sin(time + cube.userData.offset) * 2
      cube.rotation.x += 0.01
      cube.rotation.y += 0.01
    })

    particlesRef.current.forEach(particle => {
      const { direction, speed, forward } = particle.userData
      if (direction === 'horizontal') {
        const delta = (speed * (forward ? 1 : -1)) * (1 / 60)
        particle.position.x += delta
        if (particle.position.x >= trackSize.width / 2) {
          particle.userData.forward = false
        } else if (particle.position.x <= -trackSize.width / 2) {
          particle.userData.forward = true
        }
      } else {
        const delta = (speed * (forward ? 1 : -1)) * (1 / 60)
        particle.position.z += delta
        if (particle.position.z >= trackSize.height / 2) {
          particle.userData.forward = false
        } else if (particle.position.z <= -trackSize.height / 2) {
          particle.userData.forward = true
        }
      }
    })

    waterParticlesRef.current.forEach(particle => {
      particle.position.y += 0.05
      const material = particle.material as THREE.MeshBasicMaterial
      material.opacity -= 0.01
      
      if (material.opacity <= 0) {
        particle.position.y = -0.1
        particle.position.x = (Math.random() - 0.5) * 160
        particle.position.z = (Math.random() - 0.5) * 80
        material.opacity = 0.8
      }
    })

    if (waterEffect && isBoatRace) {
      waterEffect.material.uniforms.time.value = time
    }
  })

  // 배경 색상 설정 (Vaporwave 스타일의 어두운 보라색)
  useEffect(() => {
    scene.background = new THREE.Color('#1a0d2b')
    scene.fog = new THREE.Fog('#1a0d2b', 100, 1000)
  }, [scene])

  // 공통 지오메트리 생성 (재사용)
  const geometries = useMemo(() => ({
    ground: new THREE.PlaneGeometry(80, 40),
    waterGround: new THREE.PlaneGeometry(160, 320, 1, 1),
    water: new THREE.PlaneGeometry(80, 160, 128, 128)
  }), [])

  // 공통 머티리얼 생성 (재사용)
  const materials = useMemo(() => ({
    track: new THREE.MeshStandardMaterial({
      color: "#444444",
      roughness: 0.3,
      metalness: 0.8,
      emissive: "#8000ff",
      emissiveIntensity: 1.0,
      envMapIntensity: 2.0,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      wireframe: false,
    }),
    ground: new THREE.MeshStandardMaterial({
      color: "#1a0d2b",
      roughness: 0.8,
      metalness: 0.2,
      emissive: "#0a0518",
      transparent: false,
      depthWrite: true,
    }),
  }), [])

  // Sun 위치 설정 (공통으로 사용)
  const sun = useMemo(() => {
    const parameters = {
      elevation: 60,
      azimuth: 45
    }
    
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation)
    const theta = THREE.MathUtils.degToRad(parameters.azimuth)
    
    const sunPosition = new THREE.Vector3()
    sunPosition.setFromSphericalCoords(1, phi, theta)
    
    return sunPosition
  }, [])

  // 경륜 트랙 생성
  const keirinTrack = useMemo(() => {
    const trackWidth = 10;
    const straightLength = 50;
    const curveRadius = 25;
    const curveSegments = 64;

    const shape = new THREE.Shape();
    const holePath = new THREE.Path();

    // 외부 경로
    shape.moveTo(-straightLength / 2, -curveRadius);
    shape.lineTo(straightLength / 2, -curveRadius);
    const curve1 = new THREE.EllipseCurve(
      straightLength / 2, 0,
      curveRadius, curveRadius,
      -Math.PI / 2, Math.PI / 2,
      false
    );
    shape.setFromPoints([...shape.getPoints(), ...curve1.getPoints(curveSegments)]);
    shape.lineTo(-straightLength / 2, curveRadius);
    const curve2 = new THREE.EllipseCurve(
      -straightLength / 2, 0,
      curveRadius, curveRadius,
      Math.PI / 2, -Math.PI / 2,
      false
    );
    shape.setFromPoints([...shape.getPoints(), ...curve2.getPoints(curveSegments)]);
    shape.closePath();

    // 내부 경로
    const innerCurveRadius = curveRadius - trackWidth;
    holePath.moveTo(-straightLength / 2, -innerCurveRadius);
    holePath.lineTo(straightLength / 2, -innerCurveRadius);
    const innerCurve1 = new THREE.EllipseCurve(
      straightLength / 2, 0,
      innerCurveRadius, innerCurveRadius,
      -Math.PI / 2, Math.PI / 2,
      true
    );
    holePath.setFromPoints([...holePath.getPoints(), ...innerCurve1.getPoints(curveSegments)]);
    holePath.lineTo(-straightLength / 2, innerCurveRadius);
    const innerCurve2 = new THREE.EllipseCurve(
      -straightLength / 2, 0,
      innerCurveRadius, innerCurveRadius,
      Math.PI / 2, -Math.PI / 2,
      true
    );
    holePath.setFromPoints([...holePath.getPoints(), ...innerCurve2.getPoints(curveSegments)]);
    holePath.closePath();

    shape.holes.push(holePath);

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 5,
      curveSegments: curveSegments
    });

    const positions = geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];

      const transitionZone = 5;
      const isInCurve1 = x > straightLength / 2 - transitionZone && Math.abs(y) <= curveRadius + transitionZone;
      const isInCurve2 = x < -straightLength / 2 + transitionZone && Math.abs(y) <= curveRadius + transitionZone;

      if (isInCurve1 || isInCurve2) {
        const centerX = isInCurve1 ? straightLength / 2 : -straightLength / 2;
        const relativeX = x - centerX;
        const angleFactor = Math.abs(Math.atan2(y, relativeX) / (Math.PI / 2));
        
        const distFromInner = Math.abs(Math.sqrt(relativeX * relativeX + y * y) - innerCurveRadius);
        const relative = THREE.MathUtils.clamp(distFromInner / trackWidth, 0, 1);
        
        const maxAngle = Math.PI / 4.3;
        const angle = relative * maxAngle * (0.7 + 0.3 * angleFactor);

        let transitionFactor = 1.0;
        if (isInCurve1) {
          const dist = Math.abs(x - straightLength / 2);
          transitionFactor = smoothstep(transitionZone, 0, dist);
        } else {
          const dist = Math.abs(x + straightLength / 2);
          transitionFactor = smoothstep(transitionZone, 0, dist);
        }

        const heightCurve = (1 - Math.cos(relative * Math.PI)) / 2;
        positions[i + 2] = Math.sin(angle) * 4 * transitionFactor * heightCurve;
      } else {
        const distFromInner = Math.abs(Math.abs(y) - innerCurveRadius);
        const relative = THREE.MathUtils.clamp(distFromInner / trackWidth, 0, 1);
        const minAngle = Math.PI / 36;
        const heightCurve = (1 - Math.cos(relative * Math.PI)) / 2;
        positions[i + 2] = Math.sin(relative * minAngle) * 0.5 * heightCurve;
      }
    }

    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // 물 효과 생성
  const waterEffect = useMemo(() => {
    if (!isBoatRace) return null;

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 512, 512);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load('/textures/waternormals.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
      }),
      sunDirection: sun,
      sunColor: 0xffffff,
      waterColor: 0x006994,
      distortionScale: 3.7,
      fog: false,
      alpha: 1.0,
    });

    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.2;
    water.renderOrder = 1;

    return water;
  }, [isBoatRace, sun]);

  // 경정 트랙 경계선 생성
  const boatTrackBoundary = useMemo(() => {
    if (!isBoatRace) return null;

    const trackWidth = 80;
    const straightLength = 160;
    const curveRadius = 40;
    const curveSegments = 64;

    // 경계선 경로 생성
    const points: THREE.Vector3[] = [];
    
    // 직선 구간
    points.push(new THREE.Vector3(-straightLength / 2, -curveRadius, 0));
    points.push(new THREE.Vector3(straightLength / 2, -curveRadius, 0));
    
    // 우측 곡선
    const curve1 = new THREE.EllipseCurve(
      straightLength / 2, 0,
      curveRadius, curveRadius,
      -Math.PI / 2, Math.PI / 2,
      false
    );
    points.push(...curve1.getPoints(curveSegments).map(p => new THREE.Vector3(p.x, p.y, 0)));
    
    // 직선 구간
    points.push(new THREE.Vector3(-straightLength / 2, curveRadius, 0));
    
    // 좌측 곡선
    const curve2 = new THREE.EllipseCurve(
      -straightLength / 2, 0,
      curveRadius, curveRadius,
      Math.PI / 2, -Math.PI / 2,
      false
    );
    points.push(...curve2.getPoints(curveSegments).map(p => new THREE.Vector3(p.x, p.y, 0)));

    // BufferGeometry로 변환
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: '#00ffff',
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const boundary = new THREE.LineLoop(geometry, material);
    boundary.rotation.x = -Math.PI / 2;
    boundary.position.y = -0.1;

    return boundary;
  }, [isBoatRace]);

  // 레이싱 라인 생성
  const racingLines = useMemo(() => {
    const trackWidth = 10
    const straightLength = 50
    const curveRadius = 25
    
    const points: THREE.Vector3[] = []
    const midRadius = curveRadius - trackWidth / 2
    
    points.push(new THREE.Vector3(-straightLength / 2, -midRadius, 0))
    points.push(new THREE.Vector3(straightLength / 2, -midRadius, 0))
    
    const curve1 = new THREE.EllipseCurve(
      straightLength / 2, 0,
      midRadius, midRadius,
      -Math.PI / 2, Math.PI / 2,
      false
    )
    points.push(...curve1.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0)))
    
    points.push(new THREE.Vector3(straightLength / 2, midRadius, 0))
    points.push(new THREE.Vector3(-straightLength / 2, midRadius, 0))
    
    const curve2 = new THREE.EllipseCurve(
      -straightLength / 2, 0,
      midRadius, midRadius,
      Math.PI / 2, -Math.PI / 2,
      false
    )
    points.push(...curve2.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0)))

    // keirinTrack의 높이를 기준으로 레이싱 라인 높이 조정
    const positions = keirinTrack.attributes.position.array as Float32Array
    points.forEach(point => {
      let minDist = Infinity
      let height = 0
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        const z = positions[i + 2]
        const dist = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2)
        if (dist < minDist) {
          minDist = dist
          height = z
        }
      }
      point.z = height + 0.5 // 더 높게 띄우기
    })

    return new THREE.BufferGeometry().setFromPoints(points)
  }, [keirinTrack])

  // 3D 모델 로드
  useEffect(() => {
    if (isBoatRace) return;

    // 기존 keirinTrack 메쉬 제거
    scene.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.geometry === keirinTrack) {
        scene.remove(child);
        console.log('Removed keirinTrack mesh from scene');
      }
    });

    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/assets/models/');
    mtlLoader.load('Velodrome+250m_Geometry.mtl', (mtlMaterials: MTLMaterials) => {
      mtlMaterials.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(mtlMaterials as any);
      objLoader.setPath('/assets/models/');
      objLoader.load(
        'Velodrome+250m_Geometry.obj',
        (object: THREE.Group) => {
          const box = new THREE.Box3().setFromObject(object);
          const size = new THREE.Vector3();
          box.getSize(size);

          const center = new THREE.Vector3();
          box.getCenter(center);
          object.position.sub(center);

          const trackWidth = 10;
          const straightLength = 50;
          const curveRadius = 25;
          const totalWidth = straightLength + curveRadius * 2;
          const totalHeight = curveRadius * 2;

          const scaleX = totalWidth / size.x;
          const scaleY = totalHeight / size.y;
          const scaleFactor = Math.min(scaleX, scaleY) * 0.95;
          object.scale.set(scaleFactor, scaleFactor, scaleFactor);

          const positions = keirinTrack.attributes.position.array as Float32Array;
          let maxHeight = 0;
          for (let i = 0; i < positions.length; i += 3) {
            const height = positions[i + 2];
            if (height > maxHeight) maxHeight = height;
          }

          const racingLinePoints = racingLines.attributes.position.array as Float32Array;
          let centerX = 0, centerZ = 0;
          for (let i = 0; i < racingLinePoints.length; i += 3) {
            centerX += racingLinePoints[i];
            centerZ += racingLinePoints[i + 2];
          }
          centerX /= (racingLinePoints.length / 3);
          centerZ /= (racingLinePoints.length / 3);

          object.position.set(centerX, maxHeight + 0.1, centerZ);
          object.rotation.set(-Math.PI / 2, 0, 0);

          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              const material = materials.track.clone();
              material.wireframe = false;
              material.transparent = true;
              material.opacity = 0.8;
              material.side = THREE.DoubleSide;
              material.emissive = new THREE.Color('#8000ff');
              material.emissiveIntensity = 1.0;
              child.material = material;
              child.receiveShadow = true;
              child.castShadow = true;
            }
          });

          setTrackModel(object);
        },
        (xhr: ProgressEvent) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (err: unknown) => {
          console.error('Error loading OBJ:', err);
        }
      );
    });

    return () => {
      if (trackModel) {
        scene.remove(trackModel);
        trackModel.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
          }
        });
        setTrackModel(null);
      }
    };
  }, [isBoatRace, scene]);

  // 네온 사인 추가 (별도의 useEffect로 분리)
  useEffect(() => {
    const fontLoader = new FontLoader();
    fontLoader.load(
      '/fonts/Orbitron_Regular.json',
      (font) => {
        const textGeometry = new TextGeometry(isBoatRace ? 'KBOAT' : 'KCYCLE', {
          font: font,
          size: isBoatRace ? 8 : 5,  // KBOAT 크기를 더 크게
          height: isBoatRace ? 0.8 : 0.5,  // 두께도 비례해서 증가
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: isBoatRace ? 0.16 : 0.1,
          bevelSize: isBoatRace ? 0.08 : 0.05,
          bevelSegments: 5,
        });
        
        const textMaterial = new THREE.MeshBasicMaterial({
          color: '#00ffff',
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textGeometry.computeBoundingBox();
        const textWidth = textGeometry.boundingBox!.max.x - textGeometry.boundingBox!.min.x;
        
        // 경정/경륜 트랙에 따라 위치 조정 (90도로 세움)
        if (isBoatRace) {
          textMesh.position.set(-textWidth / 2, 15, 0);  // z 위치를 0으로 조정하여 중앙에 배치
          textMesh.rotation.set(0, 0, 0);  // 90도로 세움
        } else {
          textMesh.position.set(-textWidth / 2, 15, 0);  // z 위치를 0으로 조정하여 중앙에 배치
          textMesh.rotation.set(0, 0, 0);  // 90도로 세움
        }
        
        textMesh.renderOrder = 3;
        
        if (textMeshRef.current) {
          scene.remove(textMeshRef.current);
          textMeshRef.current.geometry.dispose();
          if (textMeshRef.current.material instanceof THREE.Material) {
            textMeshRef.current.material.dispose();
          }
        }
        
        textMeshRef.current = textMesh;
        scene.add(textMesh);
        console.log('Added neon sign:', isBoatRace ? 'KBOAT' : 'KCYCLE');
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
      }
    );

    return () => {
      if (textMeshRef.current) {
        scene.remove(textMeshRef.current);
        textMeshRef.current.geometry.dispose();
        if (textMeshRef.current.material instanceof THREE.Material) {
          textMeshRef.current.material.dispose();
        }
        textMeshRef.current = null;
      }
    };
  }, [isBoatRace, scene]);

  // 플로팅 큐브 추가
  useEffect(() => {
    const trackSize = isBoatRace ? { width: 160, height: 80 } : { width: 50, height: 50 }
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1)
    const cubeMaterial = new THREE.MeshBasicMaterial({
      color: isBoatRace ? '#00ffff' : '#8000ff',
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })
    
    for (let i = 0; i < 10; i++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
      cube.position.set(
        (Math.random() - 0.5) * trackSize.width,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * trackSize.height
      )
      cube.userData = { offset: Math.random() * Math.PI * 2 }
      cube.renderOrder = 3
      scene.add(cube)
      cubesRef.current.push(cube)
    }

    return () => {
      cubesRef.current.forEach(cube => {
        scene.remove(cube)
        cube.geometry.dispose()
        if (cube.material instanceof THREE.Material) {
          cube.material.dispose()
        }
      })
      cubesRef.current = []
    }
  }, [isBoatRace, scene])

  // 그리드 선 파티클 추가
  useEffect(() => {
    const trackSize = isBoatRace ? { width: 160, height: 80 } : { width: 50, height: 50 }
    const particleGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    })
    
    for (let i = 0; i < 10; i++) {
      const y = -trackSize.height / 2 + (i * trackSize.height) / 9
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.set(-trackSize.width / 2, -0.14, y)
      particle.userData = {
        direction: 'horizontal',
        speed: 20 + Math.random() * 10,
        forward: true,
      }
      particle.renderOrder = 3
      scene.add(particle)
      particlesRef.current.push(particle)
    }

    for (let i = 0; i < 10; i++) {
      const x = -trackSize.width / 2 + (i * trackSize.width) / 9
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.set(x, -0.14, -trackSize.height / 2)
      particle.userData = {
        direction: 'vertical',
        speed: 20 + Math.random() * 10,
        forward: true,
      }
      particle.renderOrder = 3
      scene.add(particle)
      particlesRef.current.push(particle)
    }

    return () => {
      particlesRef.current.forEach(particle => {
        scene.remove(particle)
        particle.geometry.dispose()
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose()
        }
      })
      particlesRef.current = []
    }
  }, [isBoatRace, scene])

  // 물 위 파티클 추가 (경정 트랙 전용)
  useEffect(() => {
    if (!isBoatRace) {
      waterParticlesRef.current.forEach(particle => {
        scene.remove(particle)
        particle.geometry.dispose()
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose()
        }
      })
      waterParticlesRef.current = []
      return
    }

    const waterParticleGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const waterParticleMaterial = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    for (let i = 0; i < 50; i++) {
      const particle = new THREE.Mesh(waterParticleGeometry, waterParticleMaterial.clone())
      particle.position.set(
        (Math.random() - 0.5) * 160,
        -0.1,
        (Math.random() - 0.5) * 80
      )
      particle.material.opacity = Math.random() * 0.8
      particle.renderOrder = 3
      scene.add(particle)
      waterParticlesRef.current.push(particle)
    }

    return () => {
      waterParticlesRef.current.forEach(particle => {
        scene.remove(particle)
        particle.geometry.dispose()
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose()
        }
      })
      waterParticlesRef.current = []
    }
  }, [isBoatRace, scene])

  // 공통 조명 컴포넌트
  const Lighting = () => (
    <>
      <directionalLight 
        position={[sun.x * 100, sun.y * 100, sun.z * 100]}
        intensity={1.5}
        color={isBoatRace ? "#00b7eb" : "#ff61d5"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight
        position={[-50, 50, -50]}
        intensity={1.0}
        color={isBoatRace ? "#00ffff" : "#61dafb"}
        castShadow
      />
      <ambientLight intensity={0.2} color="#ffffff" />
      <pointLight position={[0, 20, 0]} intensity={2.0} color={isBoatRace ? "#00ffff" : "#8000ff"} distance={100} decay={2} />
      <pointLight position={[0, 20, 50]} intensity={2.0} color="#00ffff" distance={100} decay={2} />
      <pointLight position={[0, 20, -50]} intensity={2.0} color={isBoatRace ? "#00ffff" : "#8000ff"} distance={100} decay={2} />
    </>
  )

  if (isBoatRace) {
    return (
      <>
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            height={300}
          />
        </EffectComposer>
        <group>
          <OrbitControls 
            enablePan={false}
            minDistance={50}
            maxDistance={200}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2.5}
            target={[0, -0.2, 0]}
          />
          <Lighting />
          
          <Grid 
            size={1000}
            divisions={50}
            fadeDistance={200}
            fadeStrength={1}
            opacity={0.3}
            position={[0, -0.15, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={1}
            depthWrite={false}
            depthTest={true}
            color="#00ffff"
          />

          {waterEffect && (
            <primitive 
              object={waterEffect}
              ref={waterRef}
              position={[0, -0.2, 0]}
              renderOrder={2}
            />
          )}

          {boatTrackBoundary && (
            <primitive 
              object={boatTrackBoundary} 
              renderOrder={3}
            />
          )}
        </group>
      </>
    );
  }

  return (
    <>
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          height={300}
        />
      </EffectComposer>
      <group>
        <OrbitControls 
          enablePan={false}
          minDistance={30}
          maxDistance={150}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.5}
          target={[0, 0, 0]}
        />
        <Lighting />
        
        {trackModel && (
          <primitive 
            object={trackModel}
            renderOrder={1}
          />
        )}

        <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <line>
            <primitive object={racingLines} />
            <lineBasicMaterial 
              color="#00ffff"
              linewidth={3}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthTest={false}
            />
          </line>
        </group>

        <Grid 
          size={1000}
          divisions={50}
          fadeDistance={200}
          fadeStrength={1}
          opacity={0.5}
          position={[0, -0.15, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
          depthWrite={false}
          depthTest={false}
        />
      </group>
    </>
  )
} 