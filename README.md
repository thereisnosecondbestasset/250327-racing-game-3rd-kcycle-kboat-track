# 레이싱 게임 3rd - 경륜/경정 트랙 구현

경륜과 경정 트랙을 Three.js를 사용하여 구현한 프로젝트입니다.

## 구현된 기능

### 경륜 트랙 (KCYCLE)
* 3D 벨로드롬 트랙 모델링
* 네온 효과가 적용된 "KCYCLE" 사인
* 트랙 주변을 움직이는 플로팅 큐브
* 네온 그리드 라인과 파티클 효과
* 보라색 트랙 표면과 네온 조명 효과
* 퇴피선, 내선, 외선 (TubeGeometry 사용)
* 출발선과 결승선 (PlaneGeometry 사용)

### 경정 트랙 (KBOAT)
* 물 효과가 적용된 보트 레이싱 트랙
* 네온 효과가 적용된 "KBOAT" 사인
* 물 위에 떠다니는 반짝이는 파티클
* 트랙 경계선 네온 효과 (TubeGeometry 사용)
* 물결 효과와 반사 효과
* 스타팅/피니쉬 라인 (PlaneGeometry 사용)
* 턴마크 1, 2와 라벨

### 공통 기능
* Bloom 포스트 프로세싱 효과
* 동적 조명 시스템
* 부드러운 카메라 컨트롤
* 반응형 트랙 크기 조정
* 점멸 효과가 적용된 라인들

## 사용된 기술
* React + TypeScript
* Three.js / React Three Fiber
* PostProcessing 효과
* Custom Shaders (물 효과)
* 3D 모델링 및 텍스처 매핑

## 설치 방법

```bash
# 저장소 클론
git clone https://github.com/thereisnosecondbestasset/250328-racing-game-3rd-kcycle-kboat-track.git

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 주요 컴포넌트

### RaceTrack.tsx
* 경륜/경정 트랙의 메인 렌더링 컴포넌트
* 트랙 타입에 따른 조건부 렌더링
* 3D 모델, 파티클, 네온 효과 관리
* 라인 렌더링 (TubeGeometry, PlaneGeometry)

### Grid.tsx
* 커스텀 그리드 컴포넌트
* 네온 효과가 적용된 그리드 라인
* 페이드 아웃 효과

## 최근 업데이트
* 경정 트랙 외곽선을 TubeGeometry로 변경하여 굵기 조절 가능
* 경정 트랙 스타팅/피니쉬 라인을 PlaneGeometry로 변경하여 선명한 표시
* 경륜 트랙의 퇴피선, 내선, 외선을 TubeGeometry로 구현하여 가시성 향상
* 모든 라인에 점멸 효과 적용

## 라이선스
MIT License 
