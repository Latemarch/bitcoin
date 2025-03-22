'use client';

import { BybitKline } from '@/types/type';
import * as React from 'react';
import * as d3 from 'd3';
import {
  colors,
  createBaseLine,
  createCandles,
  createCanvasInSVG,
  createGuideLines,
  createIndicators,
  drawCandlesOnCanvas,
  drawVolumeOnCanvas,
  updateAxis,
  updateCandles,
  updateGuideLines,
  writeCandleInfo,
} from '@/lib/D3/candlesChart';

type Props = {
  data: BybitKline[];
  width: number;
  height: number;
};

export default function CandleChart({ data, width = 1000, height = 500 }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const { gray, red, green } = colors;

  React.useEffect(() => {
    if (!svgRef.current || !data) return;
    let candleChartHeightRatio = 0.8;
    const svg = d3
      .select(svgRef.current)
      .style('border', '3px solid steelblue')
      .attr('viewBox', `0 -20 ${width + 70} ${height + 50}`);

    const localMax = Number(d3.max(data, (d) => d[2])) + 10; // high
    const localMin = Number(d3.min(data, (d) => d[3])) - 10; // low

    const xIndex = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const x = d3
      .scaleTime()
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([localMin, localMax])
      .range([height * candleChartHeightRatio, 0]);

    const volumeMax = Number(d3.max(data, (d) => d[5]));
    const yVolume = d3
      .scaleLinear()
      .domain([0, volumeMax])
      .range([height, height * candleChartHeightRatio + 4]);

    const yVolumeAxisGroup = svg
      .append('g')
      .attr('class', 'y-volume-axis')
      .attr('transform', `translate(${width}, 0)`)
      .style('color', gray);

    const xAxisGroup = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .style('color', gray);

    const yAxisGroup = svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${width}, 0)`)
      .style('color', gray);

    updateAxis({
      svg,
      x,
      y,
      yVolume,
      width,
      height,
      xAxisGroup,
      yAxisGroup,
      yVolumeAxisGroup,
    });

    const { splitLineX } = createBaseLine(svg, width, height, candleChartHeightRatio);

    // Create clip path
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'chart-area')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    // SVG 내부에 Canvas 생성
    const { ctx: canvasCtx } = createCanvasInSVG(svg, width, height);

    // 캔들 너비 계산
    const candleWidth = (x(new Date(Number(data[1][0]))) - x(new Date(Number(data[0][0])))) * 0.9;

    // Canvas에 캔들과 거래량 그리기
    if (canvasCtx) {
      drawCandlesOnCanvas(canvasCtx, data, x, y, candleWidth);
      drawVolumeOnCanvas(canvasCtx, data, x, yVolume, candleWidth, height);
    }

    const { verticalLine, horizontalLine } = createGuideLines(svg);

    const rectWidth = 132;
    const { priceIndicator, dateIndicator } = createIndicators(svg, width, height, rectWidth);

    // text on left-top
    const candleInfo = svg
      .append('text')
      .attr('class', 'candle-info')
      .attr('x', 10)
      .attr('y', 5)
      .style('font-size', '16px')
      .style('fill', gray)
      .style('text-anchor', 'start');

    const listeningRect = svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0);

    listeningRect.on('mousemove', (e) => {
      const [xCoord, yCoord] = d3.pointer(e);
      const bisectDate = d3.bisector((d: any) => d.index).left;
      const x0 = xIndex.invert(xCoord);
      const i = bisectDate(data, x0);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 < (d0.index + d1.index) / 2 ? d0 : d1;
      const xPos = x(d[0]);
      const yPos = yCoord;

      candleInfo.call((text) => writeCandleInfo(text, d));
      priceIndicator.attr('transform', `translate(${width}, ${yPos - 5})`);
      const indicatorText =
        yCoord < height * candleChartHeightRatio
          ? y.invert(yCoord).toFixed(2)
          : yVolume.invert(yCoord).toFixed(0);
      priceIndicator.select('text').text(indicatorText);
      const dateIndicatorXPos = Math.max(xPos - rectWidth / 2, 0);
      dateIndicator.attr('transform', `translate(${dateIndicatorXPos}, ${height})`);
      dateIndicator.select('text').text(
        new Date(d[0])
          .toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
          .replace(',', '')
      );

      updateGuideLines({ svg, xPos, yPos, width, height });
    });

    listeningRect.on('mouseleave', () => {
      verticalLine.attr('opacity', 0);
      horizontalLine.attr('opacity', 0);
      candleInfo.selectAll('tspan').remove();
      priceIndicator.attr('transform', `translate(${width * 2}, 0)`);
      dateIndicator.attr('transform', `translate(0, ${height * 2})`);
    });

    const handleZoom = ({ transform }: any) => {
      const rescaleX = transform.rescaleX(x);
      const rescaleXIndex = transform.rescaleX(xIndex);

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

      updateAxis({
        svg,
        x: rescaleX,
        y: rescaleY,
        yVolume: rescaleYVolume,
        width,
        height,
        xAxisGroup,
        yAxisGroup,
        yVolumeAxisGroup,
      });

      // Canvas에 캔들과 거래량 다시 그리기
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, width, height);
        drawCandlesOnCanvas(canvasCtx, data, rescaleX, rescaleY, candleWidth * transform.k);
        drawVolumeOnCanvas(
          canvasCtx,
          data,
          rescaleX,
          rescaleYVolume,
          candleWidth * transform.k,
          height
        );
      }

      svg.selectAll('.tick line').style('stroke', gray).style('stroke-width', 0.2);

      listeningRect.on('mousemove', (e) => {
        const [xCoord, yCoord] = d3.pointer(e);
        const bisectDate = d3.bisector((d: any) => d.index).left;
        const x0 = rescaleXIndex.invert(xCoord);
        const i = bisectDate(data, x0);
        const d0 = data[i - 1];
        const d1 = data[i];
        const d = x0 < (d0.index + d1.index) / 2 ? d0 : d1;
        const xPos = rescaleX(d[0]);
        const yPos = yCoord;

        updateGuideLines({ svg, xPos, yPos, width, height });
        candleInfo.call((text) => writeCandleInfo(text, d));

        priceIndicator.attr('transform', `translate(${width}, ${yPos - 5})`);
        const indicatorText =
          yCoord < height * candleChartHeightRatio
            ? rescaleY.invert(yCoord).toFixed(2)
            : yVolume.invert(yCoord).toFixed(0);
        priceIndicator.select('text').text(indicatorText);
        const dateIndicatorXPos = Math.max(xPos - rectWidth / 2, 0);
        dateIndicator.attr('transform', `translate(${dateIndicatorXPos}, ${height})`);
        dateIndicator.select('text').text(
          new Date(d[0])
            .toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            .replace(',', '')
        );
      });
    };

    const zoom = d3
      .zoom()
      .scaleExtent([1, 10]) // 최대 10배까지 확대 가능
      .translateExtent([
        [-100, 0],
        [1100, height],
      ])
      .on('zoom', handleZoom);

    svg.call(zoom as any);

    return function cleanup() {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
      }
    };
  }, [data, width, height]);

  return (
    <div className="w-full h-full bg-bgPrimary">
      <svg ref={svgRef} />
    </div>
  );
}
