# D3.js를 활용한 캔들 차트 구현 방식

## 개요

이 문서는 D3.js를 사용한 캔들 차트의 구현 방식을 설명합니다. 구현은 React 컴포넌트 기반으로 되어 있으며, 주요 컴포넌트는 다음과 같습니다:

- `Container.tsx`: 데이터 페칭 및 전체 컨테이너
- `ChartLayout.tsx`: 차트의 레이아웃 및 기본 구조 설정
- `Interaction.tsx`: 차트의 상호작용(마우스 이벤트) 처리

## 기본 구조

### 1. 데이터 흐름

```
Container (데이터 페칭)
   ↓
ChartLayout (레이아웃 설정)
   ↓
Interaction (사용자 상호작용)
```

### 2. 컴포넌트 역할

#### Container.tsx

- API를 통해 캔들 데이터 페칭 (`getRecentCandles` 함수 사용)
- `ChartLayout` 컴포넌트에 데이터 전달
- 데이터 상태 관리

```typescript
// 주요 기능
const [data, setData] = React.useState<BybitKline[]>([]);

React.useEffect(() => {
  const fetchData = async () => {
    const res = await getRecentCandles({});
    if (res.ok) setData(res.data);
  };
  fetchData();
}, []);
```

#### ChartLayout.tsx

- SVG 기본 설정 (크기, 스타일)
- 차트의 축(axis)과 기본 레이아웃 생성
- 데이터 필터링 및 스케일 설정
- 창 크기 변경 감지 및 대응
- `Interaction` 컴포넌트에 필요한 데이터 및 참조 전달

```typescript
// 주요 기능
const svgRef = React.useRef<SVGSVGElement>(null);
const divRef = React.useRef<HTMLDivElement>(null);
const [divWidth, setDivWidth] = React.useState(initialWidth);

// SVG 초기 설정
const svg = d3.select(svgRef.current)
  .attr('class', 'bg-bgPrimary')
  .attr('width', divWidth)
  .attr('height', height + 20);

// 스케일 및 축 설정
const x = d3.scaleTime()...
const y = d3.scaleLinear()...
const yVolume = d3.scaleLinear()...

// 기본 레이아웃 생성
createBaseLine(svg, width, height, candleChartHeightRatio);
createGuideLines(svg);
createIndicators(svg, width, height, 1);
```

#### Interaction.tsx

- 캔들차트 데이터 렌더링 (Canvas 사용)
- 마우스 이벤트 처리 (mousemove, mouseleave)
- 가이드라인 및 정보 표시 업데이트
- 사용자 인터랙션 요소 관리

```typescript
// 주요 기능
// Canvas 생성 및 캔들/볼륨 그리기
const { ctx } = createCanvasInSVG(svg, width, height);
drawCandlesOnCanvas(ctx, data, x, y, 1);
drawVolumeOnCanvas(ctx, data, x, yVolume, 1, height);

// 마우스 이벤트 처리용 투명 영역
const listeningRect = svg
  .append('rect')
  .attr('class', 'listening-rect')
  .attr('width', width)
  .attr('height', height)
  .attr('fill', 'white')
  .attr('opacity', 0)
  .style('pointer-events', 'all');

// 이벤트 핸들러 등록
listeningRect
  .on('mousemove', (event) => handleMouseMove({...}))
  .on('mouseleave', handleMouseLeave);
```

## 주요 기술적 특징

### 1. 렌더링 최적화

- SVG와 Canvas의 하이브리드 접근 방식 사용
- 축과 기본 레이아웃은 SVG 요소로 구현
- 캔들과 볼륨 데이터는 Canvas로 렌더링하여 성능 최적화
- `createCanvasInSVG` 함수로 SVG 내부에 Canvas 삽입

### 2. 인터랙션 처리

- 투명한 rect 요소(`listeningRect`)를 생성하여 마우스 이벤트 캡처
- 마우스 위치에 따른, 캔들 정보 표시
- 가이드라인을 통한 시각적 피드백 제공
- 날짜와 가격 인디케이터 업데이트

### 3. 반응형 설계

- 창 크기 변경 감지 및 차트 크기 조정
- 디바이스 픽셀 비율 고려
- `ResizeObserver` 또는 윈도우 resize 이벤트 리스너 사용

## 기술 스택

- **React**: 컴포넌트 기반 구조
- **D3.js**: 데이터 시각화 및 조작
- **TypeScript**: 타입 안정성 확보
- **Canvas API**: 대량의 데이터 효율적 렌더링
- **SVG**: 기본 레이아웃 및 인터랙션 요소

## 최적화 고려사항

1. **성능**:

   - Canvas를 사용하여 많은 양의 캔들 데이터 렌더링 성능 향상
   - 불필요한 리렌더링 방지를 위한 useRef 활용

2. **메모리 관리**:

   - 컴포넌트 언마운트 시 이벤트 리스너 및 D3 요소 정리
   - 중복 요소 생성 방지

3. **사용자 경험**:
   - 시각적 피드백 제공 (가이드라인, 인디케이터)
   - 부드러운 인터랙션 구현

## 확장 가능성

- 다양한 기술적 지표 추가
- 다크/라이트 모드 지원
- 더 많은 시간 프레임 지원
- 줌 및 팬 기능 개선
- 커스텀 주석 추가 기능

이 구조는 D3.js와 React를 효과적으로 결합하여 성능이 좋고 인터랙티브한 캔들 차트를 구현합니다. 데이터 관리, 레이아웃 설정, 사용자 상호작용을 분리하여 코드 유지보수성과 확장성을 높였습니다.
