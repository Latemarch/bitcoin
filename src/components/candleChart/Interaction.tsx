'use client';

import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  createBaseLine,
  createCanvasInSVG,
  drawCandlesOnCanvas,
  drawVolumeOnCanvas,
  updateAxis,
  updateGuideLines,
  writeCandleInfo,
} from '@/lib/D3/candlesChart';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  divRef: React.RefObject<HTMLDivElement>;
  data: BybitKline[];
  width: number;
  height: number;
  candleChartHeightRatio?: number;
};

export default function Interaction({
  svgRef,
  data,
  width,
  height,
  divRef,
  candleChartHeightRatio = 0.8,
}: Props) {
  const [divWidth, setDivWidth] = React.useState(1000);
  const prevWidthRef = React.useRef(width);

  React.useEffect(() => {
    if (!svgRef.current) return;

    // SVG 선택 및 초기화
    const svg = d3.select(svgRef.current);

    svg.attr('width', divWidth);

    // 스케일 설정
    const xIndex = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const xRect = d3
      .scaleTime()
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([0, width]);

    const x = d3
      .scaleTime()
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([Math.min(0, width - 1000), width]);

    // 보이는 데이터 계산
    const firstDate = x.invert(0);
    const lastDate = x.invert(width);
    const visibleData = data.filter((d) => {
      const date = new Date(d[0]);
      return date >= firstDate && date <= lastDate;
    });

    // 가격/볼륨 스케일 설정
    const maxPrice = Number(d3.max(visibleData, (d) => d[2])) + 10;
    const minPrice = Number(d3.min(visibleData, (d) => d[3])) - 10;
    const volumeMax = Number(d3.max(visibleData, (d) => d[5]));

    const y = d3
      .scaleLinear()
      .domain([minPrice, maxPrice])
      .range([height * candleChartHeightRatio, 0]);

    const yVolume = d3
      .scaleLinear()
      .domain([0, volumeMax])
      .range([height, height * candleChartHeightRatio + 4]);

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

    // Canvas 생성 및 캔들/볼륨 그리기
    // createCanvasInSVG 내부에서 기존 foreignObject 요소를 제거함
    const { ctx } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, data, x, y, 1);
    drawVolumeOnCanvas(ctx, data, x, yVolume, 1, height);

    // listening-rect가 없으면 새로 생성
    // Interaction을 위한 투명 rect 추가
    const listeningRect = svg
      .append('rect')
      .attr('class', 'listening-rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0)
      .style('pointer-events', 'all');
    // 있으면 크기만 업데이트
    //   svg.select('.listening-rect').attr('width', width).attr('height', height);

    // 이벤트 핸들러를 함수로 분리
    function handleMouseMove(event: any) {
      try {
        const [xCoord, yCoord] = d3.pointer(event, event.currentTarget);
        const x0 = xIndex.invert(xCoord);
        const i = Math.floor(x0);

        if (i < 0 || i >= data.length - 1) return;

        const d0 = data[i];
        const d1 = data[i + 1];
        if (!d0 || !d1) return;

        const d = x0 - i > 0.5 ? d1 : d0;
        const xPos = xRect(d[0]);
        const yPos = yCoord;

        d3.select('.candle-info').call((text) => writeCandleInfo(text, d));
        d3.select('.price-indicator').attr('transform', `translate(${width}, ${yPos - 5})`);

        const indicatorText =
          yCoord < height * candleChartHeightRatio
            ? y.invert(yCoord).toFixed(2)
            : yVolume.invert(yCoord).toFixed(0);

        d3.select('.price-indicator text').text(indicatorText);
        updateGuideLines({ svg, xPos, yPos, width, height });
      } catch (error) {
        console.error('Mouse move error:', error);
      }
    }

    function handleMouseLeave() {
      d3.select('.guide-vertical-line').attr('opacity', 0);
      d3.select('.guide-horizontal-line').attr('opacity', 0);
      d3.select('.candle-info').selectAll('tspan').remove();
      d3.select('.price-indicator').attr('transform', `translate(${width * 2}, 0)`);
      d3.select('.date-indicator').attr('transform', `translate(0, ${height * 2})`);
    }

    // 이벤트 리스너 등록
    listeningRect.on('mousemove', handleMouseMove).on('mouseleave', handleMouseLeave);

    // 클린업 함수
    return () => {
      listeningRect.remove();
    };
  }, [svgRef, divWidth, candleChartHeightRatio]);

  // 창 크기 변경 감지
  React.useEffect(() => {
    const handleResize = () => {
      if (!divRef.current) return;
      const { width } = divRef.current.getBoundingClientRect();
      setDivWidth(width);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [divRef]);

  return null;
}
