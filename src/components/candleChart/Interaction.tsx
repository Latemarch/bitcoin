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
import { handleMouseLeave, handleMouseMove } from '@/lib/D3/candleChartInteraction';

type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  data: BybitKline[];
  divWidth: number;
  height: number;
  candleChartHeightRatio?: number;
};

export default function Interaction({
  svgRef,
  data,
  divWidth,
  height,
  candleChartHeightRatio = 0.8,
}: Props) {
  React.useEffect(() => {
    if (!svgRef.current) return;

    // SVG 선택 및 초기화
    const svg = d3.select(svgRef.current);
    const width = divWidth - 70;

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

    // const baseLineX = d3.select('.base-line-y').attr('x1', width).attr('x2', width);
    // const yAxisGroup = d3.select('.y-axis').attr('transform', `translate(${width}, 0)`);
    // const yVolumeAxisGroup = d3
    //   .select('.y-volume-axis')
    //   .attr('transform', `translate(${width}, 0)`);
    // // 축 업데이트
    // updateAxis({
    //   svg,
    //   x,
    //   y,
    //   yVolume,
    //   width,
    //   height,
    //   xAxisGroup: d3.select('.x-axis') as any,
    //   yAxisGroup: yAxisGroup as any,
    //   yVolumeAxisGroup: yVolumeAxisGroup as any,
    // });

    // Canvas 생성 및 캔들/볼륨 그리기
    // createCanvasInSVG 내부에서 기존 foreignObject 요소를 제거함
    const { ctx } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, data, x, y, 1);
    drawVolumeOnCanvas(ctx, data, x, yVolume, 1, height);

    const listeningRect = svg
      .append('rect')
      .attr('class', 'listening-rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0)
      .attr('cursor', 'crosshair');
    //   .style('pointer-events', 'all');

    // 이벤트 리스너 등록
    listeningRect
      .on('mousemove', (event) =>
        handleMouseMove({
          event,
          data,
          svg,
          width,
          height,
          candleChartHeightRatio,
          xIndex,
          xRect,
          y,
          yVolume,
        })
      )
      .on('mouseleave', handleMouseLeave);

    // 클린업 함수
    return () => {
      listeningRect.remove();
    };
  }, [svgRef, divWidth, candleChartHeightRatio]);

  return null;
}
