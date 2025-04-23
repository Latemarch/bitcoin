'use client';

import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  createCanvasInSVG,
  drawCandlesOnCanvas,
  drawVolumeOnCanvas,
  updateAxis,
} from '@/lib/D3/candlesChart';
import { handleMouseLeave, handleMouseMove } from '@/lib/D3/candleChartInteraction';

import { IndicatorData } from '@/types/type';
import { getScales } from '@/lib/D3/ftnsForZoom';
import { drawIndicators } from '@/lib/D3/drawIndicators';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  candleData: BybitKline[];
  height: number;
  candleChartHeightRatio?: number;
  volumeChartHeightRatio?: number;
  indicators: IndicatorData;
};

export default function Draw({
  svgRef,
  candleData,
  height,
  candleChartHeightRatio = 0.6,
  volumeChartHeightRatio = 0.8,
  indicators,
}: Props) {
  const [divWidth, setDivWidth] = React.useState(0);
  const divRef = React.useRef<HTMLDivElement>(null);
  const zoomRef = React.useRef<any>(d3.zoomIdentity);
  const candleWidthRef = React.useRef<number>(0); // 기본 캔들 너비 저장
  const zoomedCandleWidthRef = React.useRef<number>(0); // 줌 적용된 캔들 너비 저장

  const scaleRef = React.useRef({
    x: d3.scaleTime(),
    xIndex: d3.scaleLinear(),
    y: d3.scaleLinear(),
    yVolume: d3.scaleLinear(),
    xDomain: [
      new Date(Number(candleData[0][0])),
      new Date(Number(candleData[candleData.length - 1][0])),
    ],
  });

  React.useEffect(() => {
    if (!svgRef.current || !indicators.macd) return;

    // SVG 선택 및 초기화
    const svg = d3.select(svgRef.current);
    const width = (divWidth || 500) - 70;

    svg.attr('width', divWidth);

    const currentDomain = scaleRef.current.xDomain;
    const originalX = d3
      .scaleTime()
      .domain([
        new Date(Number(candleData[0][0])),
        new Date(Number(candleData[candleData.length - 1][0])),
      ])
      .range([Math.min(0, width - 1000), width]);

    const x = originalX.copy().domain(currentDomain);
    const firstDate = x.invert(0);
    const lastDate = x.invert(width);

    const { y, yVolume, yMACD } = getScales({
      height,
      candleChartHeightRatio,
      volumeChartHeightRatio,
      candleData,
      indicators,
      firstDate,
      lastDate,
    });

    const baseLineX = d3.select('.base-line-y').attr('x1', width).attr('x2', width);
    const yAxisGroup = d3.select('.y-axis').attr('transform', `translate(${width}, 0)`);
    const yVolumeAxisGroup = d3
      .select('.y-volume-axis')
      .attr('transform', `translate(${width}, 0)`);

    // 축 업데이트
    updateAxis({
      svg,
      x,
      y,
      yVolume,
      width,
      height,
      xAxisGroup: d3.select('.x-axis') as any,
      yAxisGroup: yAxisGroup as any,
      yVolumeAxisGroup: yVolumeAxisGroup as any,
    });

    // 캔들 너비 계산 (줌 상태에 따라 다르게 적용)
    let candleWidth: number;
    let activeWidth: number;

    // 새로운 기본 캔들 너비 계산
    const baseWidth =
      (x(new Date(Number(candleData[1][0]))) - x(new Date(Number(candleData[0][0])))) * 0.8;

    // 줌 상태인 경우
    if (zoomRef.current && zoomRef.current.k !== 1) {
      if (candleWidthRef.current === 0) {
        // 처음 줌이 설정된 경우
        candleWidthRef.current = baseWidth;
        candleWidth = baseWidth;
        activeWidth = candleWidth * zoomRef.current.k;
      } else {
        // 줌 상태에서 재렌더링된 경우 (indicators 변경 등)
        candleWidth = candleWidthRef.current;
        activeWidth = candleWidth * zoomRef.current.k;
      }
    } else {
      // 줌이 없는 상태
      candleWidthRef.current = baseWidth;
      candleWidth = baseWidth;
      activeWidth = candleWidth;
    }

    zoomedCandleWidthRef.current = activeWidth;

    // Canvas 생성 및 캔들/볼륨/MACD 그리기
    const { ctx } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, candleData, x, y, activeWidth);
    drawVolumeOnCanvas(ctx, candleData, x, yVolume, activeWidth, height);

    // 지표 그리기
    drawIndicators({ ctx, indicators, x, yMACD, y, activeWidth });

    const listeningRect = svg
      .append('rect')
      .attr('class', 'listening-rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0)
      .attr('cursor', 'crosshair');

    // 이벤트 리스너 등록
    listeningRect
      .on('mousemove', (event) =>
        handleMouseMove({
          event,
          data: candleData,
          svg,
          width,
          height,
          candleChartHeightRatio,
          volumeChartHeightRatio,
          y,
          yVolume,
          yMACD,
          x,
          indicators,
        })
      )
      .on('mouseleave', handleMouseLeave);

    // --------------------------------------------- zoom 이벤트 처리
    const handleZoom = ({ transform }: any) => {
      // 새 transform 상태 저장
      zoomRef.current = transform;

      const rescaleX = transform.rescaleX(originalX);
      const k = transform.k;

      // Get visible domain
      const visibleDomain = rescaleX.domain();
      scaleRef.current.xDomain = visibleDomain;

      const {
        y: rescaleY,
        yVolume: rescaleYVolume,
        yMACD: rescaleYMACD,
      } = getScales({
        height,
        candleChartHeightRatio,
        volumeChartHeightRatio,
        candleData,
        indicators,
        firstDate: visibleDomain[0],
        lastDate: visibleDomain[1],
      });

      updateAxis({
        svg,
        x: rescaleX,
        y: rescaleY,
        yVolume: rescaleYVolume,
        width,
        height,
        xAxisGroup: d3.select('.x-axis') as any,
        yAxisGroup: yAxisGroup as any,
        yVolumeAxisGroup: yVolumeAxisGroup as any,
      });

      // Canvas에 캔들과 거래량 다시 그리기
      if (ctx) {
        ctx.clearRect(0, 0, width, height);

        // 줌 상태에 따라 캔들 너비 조정
        const zoomedCandleWidth = candleWidthRef.current * transform.k;
        zoomedCandleWidthRef.current = zoomedCandleWidth;

        // 선명한 렌더링을 위해 업데이트된 함수 사용
        drawCandlesOnCanvas(ctx, candleData, rescaleX, rescaleY, zoomedCandleWidth);
        drawVolumeOnCanvas(ctx, candleData, rescaleX, rescaleYVolume, zoomedCandleWidth, height);
        drawIndicators({
          ctx,
          indicators,
          x: rescaleX,
          yMACD: rescaleYMACD,
          y: rescaleY,
          activeWidth: zoomedCandleWidth,
        });
      }

      listeningRect
        .on('mousemove', (event) =>
          handleMouseMove({
            event,
            data: candleData,
            indicators,
            svg,
            width,
            height,
            candleChartHeightRatio,
            volumeChartHeightRatio,
            x: rescaleX,
            y: rescaleY,
            yVolume: rescaleYVolume,
            yMACD: rescaleYMACD || yMACD,
          })
        )
        .on('mouseleave', handleMouseLeave);
    };

    // zoom 객체 새로 생성 - 매번 새로운 인스턴스를 만들어 이전 상태 제거
    const zoom = d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([
        [-10, 0],
        [divWidth + 10, height],
      ])
      .on('zoom', handleZoom);

    svg.call(zoom as any);

    // 클린업 함수
    return () => {
      listeningRect.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgRef, divWidth, candleChartHeightRatio, candleData, indicators]);

  React.useEffect(() => {
    const handleResize = () => {
      if (!divRef.current) return;
      const { width } = divRef.current.getBoundingClientRect();
      setDivWidth(width);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [candleData]);

  return <div className="absolute inset-0 pointer-events-none" ref={divRef}></div>;
}
