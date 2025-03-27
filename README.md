# 레이싱 게임 3rd - 경륜/경정 트랙 구현

경륜과 경정 트랙을 Three.js를 사용하여 구현한 프로젝트입니다.

## 구현된 기능

### 경륜 트랙
- 3D 벨로드롬 트랙 모델링
- 네온 효과가 적용된 "KCYCLE" 사인
- 트랙 주변을 움직이는 플로팅 큐브
- 네온 그리드 라인과 파티클 효과
- 보라색 트랙 표면과 네온 조명 효과

### 경정 트랙
- 물 효과가 적용된 보트 레이싱 트랙
- 네온 효과가 적용된 "KBOAT" 사인
- 물 위에 떠다니는 반짝이는 파티클
- 트랙 경계선 네온 효과
- 물결 효과와 반사 효과

### 공통 기능
- Bloom 포스트 프로세싱 효과
- 동적 조명 시스템
- 부드러운 카메라 컨트롤
- 반응형 트랙 크기 조정

## 사용된 기술

- React + TypeScript
- Three.js / React Three Fiber
- PostProcessing 효과
- Custom Shaders (물 효과)
- 3D 모델링 및 텍스처 매핑

## 설치 방법

```bash
# 저장소 클론
git clone https://github.com/thereisnosecondbestasset/250327-racing-game-3rd-kcycle-kboat-track.git

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 주요 컴포넌트

### RaceTrack.tsx
- 경륜/경정 트랙의 메인 렌더링 컴포넌트
- 트랙 타입에 따른 조건부 렌더링
- 3D 모델, 파티클, 네온 효과 관리

### Grid.tsx
- 커스텀 그리드 컴포넌트
- 네온 효과가 적용된 그리드 라인
- 페이드 아웃 효과

## 향후 개선사항

- [ ] 성능 최적화
- [ ] 더 다양한 시각 효과
- [ ] 모바일 대응
- [ ] 사용자 상호작용 추가

## 라이선스

MIT License 
