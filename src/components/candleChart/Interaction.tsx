'use client';

import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  colors,
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
  height: number;
  candleChartHeightRatio?: number;
};

export default function Interaction({ svgRef, data, height, candleChartHeightRatio = 0.8 }: Props) {
  const [divWidth, setDivWidth] = React.useState(0);
  const divRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!svgRef.current) return;
    const { gray } = colors;

    // SVG 선택 및 초기화
    const svg = d3.select(svgRef.current);
    const width = (divWidth || 1000) - 70;

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

    const candleWidth = (x(new Date(Number(data[1][0]))) - x(new Date(Number(data[0][0])))) * 0.9;
    const { ctx } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, data, x, y, candleWidth);
    drawVolumeOnCanvas(ctx, data, x, yVolume, candleWidth, height);

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

    // --------------------------------------------- zoom 이벤트 처리
    const handleZoom = ({ transform }: any) => {
      // const { rescaleX, rescaleXIndex, rescaleY, rescaleYVolume } = scaleRef.current;
      const rescaleX = transform.rescaleX(x);
      const rescaleXIndex = transform.rescaleX(xIndex);
      const k = transform.k;
      // console.log(rescaleX, rescaleY);

      // Get visible domain
      const visibleDomain = rescaleX.domain();

      // Filter data points within visible domain
      const visibleData = data.filter((d) => {
        const date = new Date(d[0]);
        return date >= visibleDomain[0] && date <= visibleDomain[1];
      });

      // Recalculate y scale based on visible data
      const visibleMax = Number(d3.max(visibleData, (d) => d[2])) + 10;
      const visibleMin = Number(d3.min(visibleData, (d) => d[3])) - 10;
      const visibleVolumeMax = Number(d3.max(visibleData, (d) => d[5]));

      const rescaleY = d3
        .scaleLinear()
        .domain([visibleMin, visibleMax])
        .range([height * candleChartHeightRatio, 0]);

      const rescaleYVolume = d3
        .scaleLinear()
        .domain([0, visibleVolumeMax])
        .range([height, height * candleChartHeightRatio + 4]);

      // updateAxis({
      //   svg,
      //   x: rescaleX,
      //   y: rescaleY,
      //   yVolume: rescaleYVolume,
      //   width,
      //   height,
      //   xAxisGroup,
      //   yAxisGroup,
      //   yVolumeAxisGroup,
      // });

      // // Canvas에 캔들과 거래량 다시 그리기 - 고해상도 고려
      if (ctx) {
        ctx.clearRect(0, 0, width, height);

        // 줌 상태에 따라 캔들 너비 조정
        const zoomedCandleWidth = candleWidth * transform.k;

        // 선명한 렌더링을 위해 업데이트된 함수 사용
        drawCandlesOnCanvas(ctx, data, rescaleX, rescaleY, zoomedCandleWidth);
        drawVolumeOnCanvas(ctx, data, rescaleX, rescaleYVolume, zoomedCandleWidth, height);
      }

      // svg.selectAll('.tick line').style('stroke', gray).style('stroke-width', 0.2);

      listeningRect.on('mousemove', (event) =>
        handleMouseMove({
          event,
          data: visibleData,
          svg,
          width,
          height,
          candleChartHeightRatio,
          xIndex: rescaleXIndex,
          xRect: rescaleX,
          y: rescaleY,
          yVolume: rescaleYVolume,
        })
      );

      // listeningRect.on('mousemove', (e) => {
      //   // const { rescaleX, rescaleXIndex, rescaleY, rescaleYVolume } = scaleRef.current;
      //   const [xCoord, yCoord] = d3.pointer(e);
      //   const bisectDate = d3.bisector((d: any) => d.index).left;
      //   const x0 = rescaleXIndex.invert(xCoord);
      //   const i = bisectDate(data, x0);
      //   const d0 = data[i - 1];
      //   const d1 = data[i];
      //   if (!d0 || !d1) return;
      //   const d = x0 < (d0.index + d1.index) / 2 ? d0 : d1;
      //   const xPos = rescaleX(d[0]);
      //   const yPos = yCoord;

      // updateGuideLines({ svg, xPos, yPos, width, height });
      //   candleInfo.call((text) => writeCandleInfo(text, d));

      //   priceIndicator.attr('transform', `translate(${width}, ${yPos - 5})`);
      //   const indicatorText =
      //     yCoord < height * candleChartHeightRatio
      //       ? rescaleY.invert(yCoord).toFixed(2)
      //       : yVolume.invert(yCoord).toFixed(0);
      //   priceIndicator.select('text').text(indicatorText);
      //   const dateIndicatorXPos = Math.max(xPos - rectWidth / 2, 0);
      //   dateIndicator.attr('transform', `translate(${dateIndicatorXPos}, ${height})`);
      //   dateIndicator.select('text').text(
      //     new Date(d[0])
      //       .toLocaleString('en-US', {
      //         month: 'short',
      //         day: '2-digit',
      //         year: '2-digit',
      //         hour: '2-digit',
      //         minute: '2-digit',
      //         hour12: false,
      //       })
      //       .replace(',', '')
      //   );
      // });
    };

    svg.call(
      d3
        .zoom()
        .scaleExtent([1, 20]) // 최대 20배까지 확대 가능
        .translateExtent([
          [-100, 0],
          [1100, height],
        ])
        .on('zoom', handleZoom) as any
    );
    // 클린업 함수
    return () => {
      listeningRect.remove();
    };
  }, [svgRef, divWidth, candleChartHeightRatio]);

  React.useEffect(() => {
    const handleResize = () => {
      if (!divRef.current) return;
      const { width } = divRef.current.getBoundingClientRect();
      setDivWidth(width);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div className="absolute inset-0 pointer-events-none" ref={divRef}></div>;
}
