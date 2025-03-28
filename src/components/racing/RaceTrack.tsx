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
  const { scene, camera } = useThree()
  const [trackModel, setTrackModel] = useState<THREE.Group | null>(null)
  const [scaleFactor, setScaleFactor] = useState(1)
  
  const cubesRef = useRef<THREE.Mesh[]>([])
  const particlesRef = useRef<THREE.Mesh[]>([])
  const waterParticlesRef = useRef<THREE.Mesh[]>([])
  const textMeshRef = useRef<THREE.Mesh | null>(null)
  const marker1Ref = useRef<THREE.Mesh | null>(null);
  const marker2Ref = useRef<THREE.Mesh | null>(null);
  const startFinishLineRef = useRef<THREE.Mesh | null>(null);
  const newStartFinishLineRef = useRef<THREE.Mesh | null>(null);
  const marker1LabelRef = useRef<THREE.Mesh | null>(null);
  const marker2LabelRef = useRef<THREE.Mesh | null>(null);
  const startFinishParticlesRef = useRef<THREE.Mesh[]>([]);
  const newStartFinishParticlesRef = useRef<THREE.Mesh[]>([]);
  const startLineRef = useRef<THREE.Mesh | null>(null);
  const finishLineRef = useRef<THREE.Mesh | null>(null);
  const evacuationLineRef = useRef<THREE.Mesh | null>(null);
  const innerLineRef = useRef<THREE.Mesh | null>(null);
  const outerLineRef = useRef<THREE.Mesh | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);
  const glowingLightsRef = useRef<(THREE.PointLight | THREE.Mesh)[]>([]);

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

    if (isBoatRace) {
      // 마커 떠다니는 애니메이션
      if (marker1Ref.current) {
        marker1Ref.current.position.y = Math.sin(time) * 1;
      }
      if (marker2Ref.current) {
        marker2Ref.current.position.y = Math.sin(time + Math.PI) * 1;
      }
      if (marker1LabelRef.current) {
        marker1LabelRef.current.position.y = 18 + Math.sin(time) * 1; // 기준 높이를 10에서 18로 변경
      }
      if (marker2LabelRef.current) {
        marker2LabelRef.current.position.y = 18 + Math.sin(time + Math.PI) * 1; // 기준 높이를 10에서 18로 변경
      }

      // 외곽선 점멸 효과
      if (boatTrackBoundary) {
        const material = boatTrackBoundary.material as THREE.MeshBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }

      // 새로운 스타팅/피니쉬 라인 점멸 효과
      if (newStartFinishLineRef.current) {
        const material = newStartFinishLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }

      // 스타팅/피니쉬 라인 파티클 이동
      startFinishParticlesRef.current.forEach(particle => {
        particle.position.x += particle.userData.speed * (particle.userData.forward ? 1 : -1);
        if (particle.position.x >= 80) {
          particle.userData.forward = false;
        } else if (particle.position.x <= -80) {
          particle.userData.forward = true;
        }
      });

      // 새로운 스타팅/피니쉬 라인 파티클 이동
      newStartFinishParticlesRef.current.forEach(particle => {
        particle.position.z += particle.userData.speed * (particle.userData.forward ? -1 : 1);
        if (particle.position.z >= 40) { // z = 40까지
          particle.userData.forward = true;
        } else if (particle.position.z <= 0) { // z = 0까지
          particle.userData.forward = false;
        }
      });
    } else {
      // 경륜 트랙 점멸 효과
      if (startLineRef.current) {
        const material = startLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }
      if (finishLineRef.current) {
        const material = finishLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }
      if (evacuationLineRef.current) {
        const material = evacuationLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }
      if (innerLineRef.current) {
        const material = innerLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }
      if (outerLineRef.current) {
        const material = outerLineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.6 + Math.sin(time * 2) * 0.3;
      }
    }

    // 별 반짝임 효과
    if (starsRef.current) {
      const opacities = starsRef.current.geometry.attributes.opacity.array as Float32Array;
      for (let i = 0; i < opacities.length; i++) {
        opacities[i] = 0.5 + Math.sin(time * 2 + i) * 0.5;
      }
      starsRef.current.geometry.attributes.opacity.needsUpdate = true;
    }

    // 빛나는 광원 반짝임 효과
    glowingLightsRef.current.forEach((light, index) => {
      if (light instanceof THREE.PointLight) {
        light.intensity = 1 + Math.sin(time * 2 + index) * 0.5;
      } else {
        const material = light.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 + Math.sin(time * 2 + index) * 0.2;
      }
    });
  })

  // 배경 색상 설정 (Vaporwave 스타일의 어두운 보라색)
  useEffect(() => {
    scene.background = new THREE.Color('#0a0518')
  }, [scene])

  // 카메라 far 값 조정
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.far = 2000;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

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
      emissiveIntensity: 1.5,
      envMapIntensity: 2.0,
      transparent: true,
      opacity: 0.5,
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

    // CatmullRomCurve3로 부드러운 곡선 생성
    const curve = new THREE.CatmullRomCurve3(points, true);
    const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.5, 8, true);

    const material = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });

    const boundary = new THREE.Mesh(tubeGeometry, material);
    boundary.rotation.x = -Math.PI / 2;
    boundary.position.y = -0.1;
    boundary.renderOrder = 3;

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

  // 퇴피선, 내선, 외선 생성
  const trackLines = useMemo(() => {
    const trackWidth = 10;
    const straightLength = 50 * scaleFactor;
    const curveRadius = 25 * scaleFactor;
    const innerRadius = 5 * scaleFactor;

    const lines = {
      evacuation: { radius: innerRadius, color: '#ff00ff' },
      inner: { radius: innerRadius + 2 * scaleFactor, color: '#00ffff' },
      outer: { radius: innerRadius + 4 * scaleFactor, color: '#ffff00' },
    };

    const geometries: { [key: string]: THREE.TubeGeometry } = {};

    const positions = keirinTrack.attributes.position.array as Float32Array;
    let maxHeight = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 2];
      if (height > maxHeight) maxHeight = height;
    }

    Object.entries(lines).forEach(([key, { radius, color }]) => {
      const points: THREE.Vector3[] = [];

      points.push(new THREE.Vector3(-straightLength / 2, -radius, 0));
      points.push(new THREE.Vector3(straightLength / 2, -radius, 0));

      const curve1 = new THREE.EllipseCurve(
        straightLength / 2, 0,
        radius, radius,
        -Math.PI / 2, Math.PI / 2,
        false
      );
      points.push(...curve1.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0)));

      points.push(new THREE.Vector3(straightLength / 2, radius, 0));
      points.push(new THREE.Vector3(-straightLength / 2, radius, 0));

      const curve2 = new THREE.EllipseCurve(
        -straightLength / 2, 0,
        radius, radius,
        Math.PI / 2, -Math.PI / 2,
        false
      );
      points.push(...curve2.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0)));

      points.forEach(point => {
        const x = point.x;
        const y = point.y;
        let height = 0;
        let minDist = Infinity;
        for (let i = 0; i < positions.length; i += 3) {
          const px = positions[i];
          const py = positions[i + 1];
          const pz = positions[i + 2];
          const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
          if (dist < minDist) {
            minDist = dist;
            height = pz;
          }
        }
        point.x = x;
        point.y = height + 3;
        point.z = y;
      });

      const curve = new THREE.CatmullRomCurve3(points, true);
      geometries[key] = new THREE.TubeGeometry(curve, 64, 0.3, 8, true);
    });

    return geometries;
  }, [keirinTrack, scaleFactor]);

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

          object.position.set(centerX, maxHeight, centerZ);
          object.rotation.set(-Math.PI / 2, 0, 0);

          object.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              const material = materials.track.clone();
              material.wireframe = false;
              material.transparent = true;
              material.opacity = 0.1;
              material.side = THREE.DoubleSide;
              material.emissive = new THREE.Color('#8000ff');
              material.emissiveIntensity = 1.0;
              material.depthWrite = false;
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
      color: '#00ffff',
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

  // 마커와 스타팅/피니쉬 라인 추가
  useEffect(() => {
    if (!isBoatRace) return;

    // 마커1, 마커2 생성 (원뿔 형태)
    const markerGeometry = new THREE.ConeGeometry(6, 15, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    // 마커1 (x = 80, z = 0)
    const marker1 = new THREE.Mesh(markerGeometry, markerMaterial);
    marker1.position.set(80, 0, 0);
    marker1.rotation.set(0, 0, 0);
    marker1.renderOrder = 3;
    scene.add(marker1);
    marker1Ref.current = marker1;

    // 마커2 (x = -80, z = 0)
    const marker2 = new THREE.Mesh(markerGeometry, markerMaterial);
    marker2.position.set(-80, 0, 0);
    marker2.rotation.set(0, 0, 0);
    marker2.renderOrder = 3;
    scene.add(marker2);
    marker2Ref.current = marker2;

    // 기존 스타팅/피니쉬 라인 생성 (마커1과 마커2를 연결)
    const startFinishPoints = [
      new THREE.Vector3(-80, -0.1, 0),
      new THREE.Vector3(80, -0.1, 0),
    ];
    const startFinishCurve = new THREE.CatmullRomCurve3(startFinishPoints);
    const startFinishGeometry = new THREE.TubeGeometry(startFinishCurve, 20, 0.5, 8, false);
    const startFinishMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const startFinishLine = new THREE.Mesh(startFinishGeometry, startFinishMaterial);
    startFinishLine.renderOrder = 3;
    scene.add(startFinishLine);
    startFinishLineRef.current = startFinishLine;

    // 새로운 스타팅/피니쉬 라인 생성 (z = 40에서 z = 0까지, PlaneGeometry 사용)
    const width = 5; // 라인 두께 (5m로 설정)
    const length = 40; // 라인 길이 (z = 40에서 z = 0까지)
    const newStartFinishGeometry = new THREE.PlaneGeometry(width, length);
    const newStartFinishMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const newStartFinishLine = new THREE.Mesh(newStartFinishGeometry, newStartFinishMaterial);
    newStartFinishLine.position.set(0, -0.1, 20); // 중앙 위치: z = (40 + 0) / 2 = 20
    newStartFinishLine.rotation.x = Math.PI / 2; // 수직으로 세우기
    newStartFinishLine.renderOrder = 3;
    scene.add(newStartFinishLine);
    newStartFinishLineRef.current = newStartFinishLine;

    // 새로운 스타팅/피니쉬 라인 파티클 추가
    const newParticleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const newParticleMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const z = 40 - t * 40; // z = 40에서 z = 0까지 선형 보간
      const particle = new THREE.Mesh(newParticleGeometry, newParticleMaterial);
      particle.position.set(0, -0.1, z);
      particle.userData = {
        speed: 0.5 + Math.random() * 0.5,
        forward: Math.random() > 0.5,
      };
      particle.renderOrder = 3;
      scene.add(particle);
      newStartFinishParticlesRef.current.push(particle);
    }

    // 마커 라벨 추가
    const fontLoader = new FontLoader();
    fontLoader.load(
      '/fonts/Orbitron_Regular.json',
      (font) => {
        // 마커1 라벨
        const marker1LabelGeometry = new TextGeometry('TURNMARK 1', {
          font: font,
          size: 3,
          height: 0.5,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelSegments: 5,
        });
        const labelMaterial = new THREE.MeshBasicMaterial({
          color: '#ff00ff',
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        const marker1Label = new THREE.Mesh(marker1LabelGeometry, labelMaterial);
        marker1LabelGeometry.computeBoundingBox();
        const label1Width = marker1LabelGeometry.boundingBox!.max.x - marker1LabelGeometry.boundingBox!.min.x;
        marker1Label.position.set(80 - label1Width / 2, 18, 0);
        marker1Label.renderOrder = 3;
        scene.add(marker1Label);
        marker1LabelRef.current = marker1Label;

        // 마커2 라벨
        const marker2LabelGeometry = new TextGeometry('TURNMARK 2', {
          font: font,
          size: 3,
          height: 0.5,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelSegments: 5,
        });
        const marker2Label = new THREE.Mesh(marker2LabelGeometry, labelMaterial);
        marker2LabelGeometry.computeBoundingBox();
        const label2Width = marker2LabelGeometry.boundingBox!.max.x - marker2LabelGeometry.boundingBox!.min.x;
        marker2Label.position.set(-80 - label2Width / 2, 18, 0);
        marker2Label.renderOrder = 3;
        scene.add(marker2Label);
        marker2LabelRef.current = marker2Label;
      },
      undefined,
      (error) => {
        console.error('Error loading font for marker labels:', error);
      }
    );

    // 스타팅/피니쉬 라인 파티클 추가
    const particleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < 5; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        -80 + (i * 160) / 4,
        -0.1,
        0
      );
      particle.userData = {
        speed: 0.5 + Math.random() * 0.5,
        forward: Math.random() > 0.5,
      };
      particle.renderOrder = 3;
      scene.add(particle);
      startFinishParticlesRef.current.push(particle);
    }

    return () => {
      // 정리
      if (marker1Ref.current) {
        scene.remove(marker1Ref.current);
        marker1Ref.current.geometry.dispose();
        if (marker1Ref.current.material instanceof THREE.Material) {
          marker1Ref.current.material.dispose();
        }
        marker1Ref.current = null;
      }
      if (marker2Ref.current) {
        scene.remove(marker2Ref.current);
        marker2Ref.current.geometry.dispose();
        if (marker2Ref.current.material instanceof THREE.Material) {
          marker2Ref.current.material.dispose();
        }
        marker2Ref.current = null;
      }
      if (startFinishLineRef.current) {
        scene.remove(startFinishLineRef.current);
        startFinishLineRef.current.geometry.dispose();
        if (startFinishLineRef.current.material instanceof THREE.Material) {
          startFinishLineRef.current.material.dispose();
        }
        startFinishLineRef.current = null;
      }

      // 마커 라벨 정리
      if (marker1LabelRef.current) {
        scene.remove(marker1LabelRef.current);
        marker1LabelRef.current.geometry.dispose();
        if (marker1LabelRef.current.material instanceof THREE.Material) {
          marker1LabelRef.current.material.dispose();
        }
        marker1LabelRef.current = null;
      }
      if (marker2LabelRef.current) {
        scene.remove(marker2LabelRef.current);
        marker2LabelRef.current.geometry.dispose();
        if (marker2LabelRef.current.material instanceof THREE.Material) {
          marker2LabelRef.current.material.dispose();
        }
        marker2LabelRef.current = null;
      }

      // 스타팅/피니쉬 라인 파티클 정리
      startFinishParticlesRef.current.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose();
        }
      });
      startFinishParticlesRef.current = [];

      // 새로운 스타팅/피니쉬 라인 정리 (Mesh 타입)
      if (newStartFinishLineRef.current) {
        scene.remove(newStartFinishLineRef.current);
        newStartFinishLineRef.current.geometry.dispose();
        if (newStartFinishLineRef.current.material instanceof THREE.Material) {
          newStartFinishLineRef.current.material.dispose();
        }
        newStartFinishLineRef.current = null;
      }

      // 새로운 스타팅/피니쉬 라인 파티클 정리
      newStartFinishParticlesRef.current.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose();
        }
      });
      newStartFinishParticlesRef.current = [];
    };
  }, [isBoatRace, scene]);

  // 경륜 트랙에 출발선과 결승선 추가
  useEffect(() => {
    if (isBoatRace) return;

    const positions = keirinTrack.attributes.position.array as Float32Array;
    let maxHeight = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const height = positions[i + 2];
      if (height > maxHeight) maxHeight = height;
    }

    // 스타트 라인 (PlaneGeometry 사용)
    const startLineWidth = 5; // 선의 굵기
    const startLineLength = 15 * scaleFactor; // 선의 길이
    const startLineGeometry = new THREE.PlaneGeometry(startLineWidth, startLineLength);
    const startLineMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const startLine = new THREE.Mesh(startLineGeometry, startLineMaterial);
    startLine.position.set(0 * scaleFactor, maxHeight + 5, 12.5 * scaleFactor);
    startLine.rotation.x = Math.PI / 2;
    startLine.renderOrder = 4;
    scene.add(startLine);
    startLineRef.current = startLine;

    // 피니쉬 라인 (PlaneGeometry 사용)
    const finishLineWidth = 5;
    const finishLineLength = 15 * scaleFactor;
    const finishLineGeometry = new THREE.PlaneGeometry(finishLineWidth, finishLineLength);
    const finishLineMaterial = new THREE.MeshBasicMaterial({
      color: '#ffff00',
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const finishLine = new THREE.Mesh(finishLineGeometry, finishLineMaterial);
    finishLine.position.set(20 * scaleFactor, maxHeight + 5, 12.5 * scaleFactor);
    finishLine.rotation.x = Math.PI / 2;
    finishLine.renderOrder = 4;
    scene.add(finishLine);
    finishLineRef.current = finishLine;

    return () => {
      if (startLineRef.current) {
        scene.remove(startLineRef.current);
        startLineRef.current.geometry.dispose();
        if (startLineRef.current.material instanceof THREE.Material) {
          startLineRef.current.material.dispose();
        }
        startLineRef.current = null;
      }
      if (finishLineRef.current) {
        scene.remove(finishLineRef.current);
        finishLineRef.current.geometry.dispose();
        if (finishLineRef.current.material instanceof THREE.Material) {
          finishLineRef.current.material.dispose();
        }
        finishLineRef.current = null;
      }
    };
  }, [isBoatRace, scene, scaleFactor, keirinTrack]);

  // 경륜 트랙에 퇴피선, 내선, 외선 추가
  useEffect(() => {
    if (isBoatRace) return;

    const evacuationLineMaterial = new THREE.MeshBasicMaterial({
      color: '#ff00ff',
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const evacuationLine = new THREE.Mesh(trackLines.evacuation, evacuationLineMaterial);
    evacuationLine.renderOrder = 3;
    scene.add(evacuationLine);
    evacuationLineRef.current = evacuationLine;

    const innerLineMaterial = new THREE.MeshBasicMaterial({
      color: '#00ffff',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const innerLine = new THREE.Mesh(trackLines.inner, innerLineMaterial);
    innerLine.renderOrder = 3;
    scene.add(innerLine);
    innerLineRef.current = innerLine;

    const outerLineMaterial = new THREE.MeshBasicMaterial({
      color: '#ffff00',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthTest: false,
    });
    const outerLine = new THREE.Mesh(trackLines.outer, outerLineMaterial);
    outerLine.renderOrder = 3;
    scene.add(outerLine);
    outerLineRef.current = outerLine;

    return () => {
      if (evacuationLineRef.current) {
        scene.remove(evacuationLineRef.current);
        evacuationLineRef.current.geometry.dispose();
        if (evacuationLineRef.current.material instanceof THREE.Material) {
          evacuationLineRef.current.material.dispose();
        }
        evacuationLineRef.current = null;
      }
      if (innerLineRef.current) {
        scene.remove(innerLineRef.current);
        innerLineRef.current.geometry.dispose();
        if (innerLineRef.current.material instanceof THREE.Material) {
          innerLineRef.current.material.dispose();
        }
        innerLineRef.current = null;
      }
      if (outerLineRef.current) {
        scene.remove(outerLineRef.current);
        outerLineRef.current.geometry.dispose();
        if (outerLineRef.current.material instanceof THREE.Material) {
          outerLineRef.current.material.dispose();
        }
        outerLineRef.current = null;
      }
    };
  }, [isBoatRace, scene, trackLines]);

  // 별과 광원 생성
  useEffect(() => {
    // 별 생성
    const starCount = 200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starOpacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 500; // x: -250 ~ 250
      starPositions[i * 3 + 1] = Math.random() * 80 + 20; // y: 20 ~ 100
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500; // z: -250 ~ 250
      starOpacities[i] = Math.random();
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));

    const colors = [
      new THREE.Color('#ff00ff'),
      new THREE.Color('#00ffff'),
      new THREE.Color('#8000ff'),
    ];

    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
      fog: false, // 안개 영향 비활성화
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.renderOrder = 4;
    scene.add(stars);
    starsRef.current = stars;

    // 빛나는 광원 생성
    const lightCount = 5;
    const lightColors = ['#ff00ff', '#00ffff', '#8000ff'];

    for (let i = 0; i < lightCount; i++) {
      const light = new THREE.PointLight(
        lightColors[i % lightColors.length],
        1,
        200,
        2
      );
      light.position.set(
        (Math.random() - 0.5) * 400, // x: -200 ~ 200
        Math.random() * 100 + 50, // y: 50 ~ 150
        (Math.random() - 0.5) * 400 // z: -200 ~ 200
      );
      light.renderOrder = 4;
      scene.add(light);
      glowingLightsRef.current.push(light);

      const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: lightColors[i % lightColors.length],
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        fog: false, // 안개 영향 비활성화
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.copy(light.position);
      glow.renderOrder = 4;
      scene.add(glow);
      glowingLightsRef.current.push(glow);
    }

    return () => {
      if (starsRef.current) {
        scene.remove(starsRef.current);
        starsRef.current.geometry.dispose();
        if (starsRef.current.material instanceof THREE.Material) {
          starsRef.current.material.dispose();
        }
        starsRef.current = null;
      }

      glowingLightsRef.current.forEach(light => {
        scene.remove(light);
        if (light instanceof THREE.PointLight) {
          light.dispose();
        } else {
          light.geometry.dispose();
          if (light.material instanceof THREE.Material) {
            light.material.dispose();
          }
        }
      });
      glowingLightsRef.current = [];
    };
  }, [scene]);

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
            maxDistance={300}
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
            opacity={0}
            position={[0, -0.15, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={0}
            depthWrite={false}
            depthTest={false}
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
          maxDistance={250}
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
          opacity={1}
          position={[0, -0.15, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={0}
          depthWrite={false}
          depthTest={false}
        />
      </group>
    </>
  )
} 