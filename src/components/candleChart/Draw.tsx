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
import { drawMovingAverage } from '@/lib/D3/movingAgerage';
import { calculateMovingAverage } from '@/lib/getMovingAverage';
import { calculateBollingerBands, drawBollingerBands } from '@/lib/D3/bollingerBands';
import { calculateVWAP, drawVWAP } from '@/lib/D3/VWAP';
import { calculateMACD, drawMACD } from '@/lib/D3/macd';
type Props = {
  svgRef: React.RefObject<SVGSVGElement>;
  data: BybitKline[];
  height: number;
  candleChartHeightRatio?: number;
  volumeChartHeightRatio?: number;
};

export default function Draw({
  svgRef,
  data,
  height,
  candleChartHeightRatio = 0.6,
  volumeChartHeightRatio = 0.8,
}: Props) {
  const [divWidth, setDivWidth] = React.useState(0);
  const divRef = React.useRef<HTMLDivElement>(null);
  const zoomRef = React.useRef<any>(d3.zoomIdentity);
  const scaleRef = React.useRef({
    x: d3.scaleTime(),
    xIndex: d3.scaleLinear(),
    y: d3.scaleLinear(),
    yVolume: d3.scaleLinear(),
    xDomain: [new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))],
  });
  React.useEffect(() => {
    if (!svgRef.current) return;

    // SVG 선택 및 초기화
    const svg = d3.select(svgRef.current);
    const width = (divWidth || 1000) - 100;

    svg.attr('width', divWidth);

    const currentDomain = scaleRef.current.xDomain;
    const originalX = d3
      .scaleTime()
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([Math.min(0, width - 1000), width]);

    const x = originalX.copy().domain(currentDomain);
    const firstDate = x.invert(0);
    const lastDate = x.invert(width);
    const visibleData = data.filter((d) => {
      const date = new Date(d[0]);
      return date >= firstDate && date <= lastDate;
    });

    // 가격/볼륨 스케일 설정
    const maxPrice = Number(d3.max(visibleData, (d) => d[2])) + 100;
    const minPrice = Number(d3.min(visibleData, (d) => d[3])) - 100;
    const volumeMax = Number(d3.max(visibleData, (d) => d[5]));

    const y = d3
      .scaleLinear()
      .domain([minPrice, maxPrice])
      .range([height * candleChartHeightRatio, 0]);

    // const y = zoomRef.current.rescaleY(tempY);
    const yVolume = d3
      .scaleLinear()
      .domain([0, volumeMax])
      .range([height, height * volumeChartHeightRatio + 4]);

    const baseLineX = d3.select('.base-line-y').attr('x1', width).attr('x2', width);
    const yAxisGroup = d3.select('.y-axis').attr('transform', `translate(${width}, 0)`);
    const yVolumeAxisGroup = d3
      .select('.y-volume-axis')
      .attr('transform', `translate(${width}, 0)`);

    // scaleRef.current.x = x;
    // scaleRef.current.y = y;
    // scaleRef.current.yVolume = yVolume;
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

    // MACD 데이터 계산
    const macdData = calculateMACD(data);

    // MACD를 위한 y축 스케일 설정
    const macdMax = Math.max(...macdData.map((d) => Math.max(d.macd, d.signal)));
    const macdMin = Math.min(...macdData.map((d) => Math.min(d.macd, d.signal)));
    const macdFluctuation = Math.max(macdMax, -macdMin) * 1.2;

    const yMACD = d3
      .scaleLinear()
      .domain([-macdFluctuation, macdFluctuation])
      .range([height * volumeChartHeightRatio, height * candleChartHeightRatio]);

    // 캔들 너비 계산
    const candleWidth = (x(new Date(Number(data[1][0]))) - x(new Date(Number(data[0][0])))) * 0.8;

    // Canvas 생성 및 캔들/볼륨/MACD 그리기
    const { ctx } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, data, x, y, candleWidth);
    drawVolumeOnCanvas(ctx, data, x, yVolume, candleWidth, height);
    drawMACD(ctx, macdData, x, yMACD, yMACD(0), candleWidth);

    const movingAverageData = calculateMovingAverage(data, 5);
    const ma10Data = calculateMovingAverage(data, 10);
    const ma20Data = calculateMovingAverage(data, 20);

    drawMovingAverage(ctx, movingAverageData, x, y, colors.gray);
    drawMovingAverage(ctx, ma10Data, x, y, colors.blue);
    drawMovingAverage(ctx, ma20Data, x, y, colors.red);

    const bollingerBandData = calculateBollingerBands(data, 20);
    drawBollingerBands(ctx, bollingerBandData, x, y, colors.green);

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
          y,
          yVolume,
          x,
        })
      )
      .on('mouseleave', handleMouseLeave);

    // --------------------------------------------- zoom 이벤트 처리
    const handleZoom = ({ transform }: any) => {
      // 새 transform 상태 저장
      zoomRef.current = transform;

      const rescaleX = transform.rescaleX(originalX);
      //   const rescaleXIndex = transform.rescaleX(xIndex);
      const k = transform.k;
      //   console.log(k);

      // Get visible domain
      //   const newX = transform.rescaleX(x);
      const visibleDomain = rescaleX.domain();
      scaleRef.current.xDomain = visibleDomain;

      // Filter data points within visible domain
      const visibleData = data.filter((d) => {
        const date = new Date(d[0]);
        return date >= visibleDomain[0] && date <= visibleDomain[1];
      });

      // Recalculate y scale based on visible data
      const visibleMax = Number(d3.max(visibleData, (d) => d[2])) + 150;
      const visibleMin = Number(d3.min(visibleData, (d) => d[3])) - 150;
      const visibleVolumeMax = Number(d3.max(visibleData, (d) => d[5]));
      //   console.log(visibleDomain, visibleMax, visibleMin);

      const rescaleY = d3
        .scaleLinear()
        .domain([visibleMin, visibleMax])
        .range([height * candleChartHeightRatio, 0]);

      const rescaleYVolume = d3
        .scaleLinear()
        .domain([0, visibleVolumeMax])
        .range([height, height * volumeChartHeightRatio + 4]);

      //   scaleRef.current.x = rescaleX;
      //   scaleRef.current.y = rescaleY;
      //   scaleRef.current.yVolume = rescaleYVolume;

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

      // // Canvas에 캔들과 거래량 다시 그리기 - 고해상도 고려
      if (ctx) {
        ctx.clearRect(0, 0, width, height);

        // 줌 상태에 따라 캔들 너비 조정
        const zoomedCandleWidth = candleWidth * transform.k;

        // 선명한 렌더링을 위해 업데이트된 함수 사용
        drawCandlesOnCanvas(ctx, data, rescaleX, rescaleY, zoomedCandleWidth);
        drawVolumeOnCanvas(ctx, data, rescaleX, rescaleYVolume, zoomedCandleWidth, height);
        drawMovingAverage(ctx, movingAverageData, rescaleX, rescaleY, colors.gray);
        drawMovingAverage(ctx, ma10Data, rescaleX, rescaleY, colors.blue);
        drawMovingAverage(ctx, ma20Data, rescaleX, rescaleY, colors.red);
        drawBollingerBands(ctx, bollingerBandData, rescaleX, rescaleY, colors.green);

        // MACD 다시 계산 및 그리기
        const visibleMACDData = macdData.filter((d) => {
          const date = new Date(d.timestamp);
          return date >= visibleDomain[0] && date <= visibleDomain[1];
        });

        const visibleMACDMax = Math.max(...visibleMACDData.map((d) => Math.max(d.macd, d.signal)));
        const visibleMACDMin = Math.min(...visibleMACDData.map((d) => Math.min(d.macd, d.signal)));
        const visibleMACDFluctuation = Math.max(visibleMACDMax, -visibleMACDMin) * 1.2;

        const rescaleYMACD = d3
          .scaleLinear()
          .domain([-visibleMACDFluctuation, visibleMACDFluctuation])
          .range([height * volumeChartHeightRatio, height * candleChartHeightRatio]);

        drawMACD(ctx, visibleMACDData, rescaleX, rescaleYMACD, rescaleYMACD(0), zoomedCandleWidth);
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
          x: rescaleX,
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

    // 현재 보이는 도메인의 중심점 계산
    // const currentDomain = scaleRef.current.xDomain;
    // const domainCenter = new Date((currentDomain[0].getTime() + currentDomain[1].getTime()) / 2);

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

    // 기존 zoom 이벤트 핸들러 제거 후 새 zoom 객체 적용
    // svg.call(zoom as any);

    // 클린업 함수
    return () => {
      listeningRect.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [data]);

  return <div className="absolute inset-0 pointer-events-none" ref={divRef}></div>;
}
