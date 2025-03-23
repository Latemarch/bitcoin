import * as d3 from 'd3';
import { writeCandleInfo } from './candlesChart';
import { updateGuideLines } from './candlesChart';
import { BybitKline } from '@/types/type';

// 마우스 위치 추적을 위한 변수
let prevXCoord = -1;
let prevYCoord = -1;

export function handleMouseMove({
  event,
  xIndex,
  xRect,
  y,
  yVolume,
  width,
  height,
  candleChartHeightRatio,
  svg,
  data,
}: {
  event: any;
  xIndex: d3.ScaleLinear<number, number>;
  xRect: d3.ScaleTime<number, number>;
  y: d3.ScaleLinear<number, number>;
  yVolume: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  candleChartHeightRatio: number;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  data: BybitKline[];
}) {
  try {
    // 마우스 좌표 가져오기
    const [xCoord, yCoord] = d3.pointer(event);

    // 미세한 움직임은 무시 (성능 최적화)
    const moveThreshold = 2;
    if (
      Math.abs(xCoord - prevXCoord) < moveThreshold &&
      Math.abs(yCoord - prevYCoord) < moveThreshold &&
      prevXCoord !== -1
    ) {
      return;
    }

    // 현재 위치 저장
    prevXCoord = xCoord;
    prevYCoord = yCoord;

    // 데이터 인덱스 계산
    const x0 = xIndex.invert(xCoord);
    const i = Math.floor(x0);

    // 범위 검증
    if (i < 0 || i >= data.length - 1) return;

    // 데이터 포인트 가져오기
    const d0 = data[i];
    const d1 = data[i + 1];

    if (!d0 || !d1) return;

    // 가까운 캔들 선택
    const d = x0 - i > 0.5 ? d1 : d0;
    const xPos = xRect(new Date(Number(d[0])));
    const yPos = yCoord;

    // 요소 참조 캐싱
    const candleInfo = svg.select('.candle-info');
    const priceIndicator = svg.select('.price-indicator');
    const dateIndicator = svg.select('.date-indicator');
    const verticalLine = svg.select('.guide-vertical-line');
    const horizontalLine = svg.select('.guide-horizontal-line');

    // 가이드라인 표시
    verticalLine.attr('opacity', 1);
    horizontalLine.attr('opacity', 1);

    // 캔들 정보 업데이트
    // candleInfo.call((text: d3.Selection<SVGTextElement, unknown, null, undefined>) =>
    //   writeCandleInfo(text, d)
    // );

    // 가격 인디케이터 업데이트
    priceIndicator.attr('transform', `translate(${width}, ${yPos - 5})`).attr('opacity', 1);

    // 인디케이터 텍스트 계산
    const indicatorText =
      yCoord < height * candleChartHeightRatio
        ? y.invert(yCoord).toFixed(2)
        : yVolume.invert(yCoord).toFixed(0);

    // 텍스트 업데이트
    priceIndicator.select('text').text(indicatorText);

    // 날짜 인디케이터 업데이트
    const dateIndicatorXPos = Math.max(xPos - 66, 0);
    dateIndicator
      .attr('transform', `translate(${dateIndicatorXPos}, ${height})`)
      .attr('opacity', 1)
      .select('text')
      .text(
        new Date(Number(d[0]))
          .toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(',', '')
      );

    // 가이드라인 업데이트
    updateGuideLines({ svg, xPos, yPos, width, height });
  } catch (error) {
    console.error('마우스 이벤트 처리 오류:', error);
  }
}

// 디바운스 함수 (빠른 연속 호출 방지)
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (...args: any[]) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

// 디바운스된 mouseleave 핸들러
export const handleMouseLeave = debounce(() => {
  // 현재 마우스 위치 초기화
  prevXCoord = -1;
  prevYCoord = -1;

  // 가이드라인 숨기기
  d3.select('.guide-vertical-line').attr('opacity', 0);
  d3.select('.guide-horizontal-line').attr('opacity', 0);

  // 캔들 정보 지우기
  d3.select('.candle-info').selectAll('tspan').remove();

  // 인디케이터 숨기기
  d3.select('.price-indicator').attr('opacity', 0);
  d3.select('.date-indicator').attr('opacity', 0);
}, 100); // 100ms 디바운스
