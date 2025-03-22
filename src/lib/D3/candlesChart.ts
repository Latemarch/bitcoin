import { BybitKline } from '@/types/type';
import * as d3 from 'd3';

// 서버 환경인지 확인하는 유틸리티 함수
const isServer = () => typeof window === 'undefined';

export function createCanvasInSVG(svg: any, width: number, height: number) {
  // 서버 환경에서는 더미 객체 반환
  if (isServer()) {
    console.log('Server environment detected, returning mock canvas');
    return {
      foreignObject: svg.append('g'),
      canvas: null,
      ctx: null,
      pixelRatio: 1,
    };
  }

  const foreignObject = svg
    .append('foreignObject')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('clip-path', 'url(#chart-area)');

  const pixelRatio = window.devicePixelRatio || 1;

  const canvasNode = document.createElement('canvas');
  canvasNode.width = width * pixelRatio;
  canvasNode.height = height * pixelRatio;
  canvasNode.style.width = `${width}px`;
  canvasNode.style.height = `${height}px`;

  foreignObject.node().appendChild(canvasNode);

  const ctx = canvasNode.getContext('2d', { alpha: true });

  if (ctx) {
    ctx.scale(pixelRatio, pixelRatio);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  return { foreignObject, canvas: canvasNode, ctx, pixelRatio };
}

export function drawCandlesOnCanvas(
  ctx: CanvasRenderingContext2D | null,
  data: BybitKline[],
  x: any,
  y: any,
  candleWidth: number
) {
  // 서버 환경이거나 ctx가 null이면 아무것도 하지 않음
  // if (isServer() || !ctx) return;
  if (!ctx) return;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  data.forEach((d) => {
    const xPos = Math.round(x(new Date(d[0]))) - 0.25;
    const open = Math.round(y(d[1])) + 0.5;
    const close = Math.round(y(d[4])) + 0.5;
    const high = Math.round(y(d[2])) + 0.5;
    const low = Math.round(y(d[3])) + 0.5;

    ctx.beginPath();
    ctx.moveTo(xPos, high);
    ctx.lineTo(xPos, low);
    ctx.strokeStyle = d[1] > d[4] ? colors.red : colors.green;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = d[1] > d[4] ? colors.red : colors.green;

    const adjustedWidth = Math.max(Math.round(candleWidth), 1);
    const xStart = Math.round(xPos - adjustedWidth / 2) - 0.5;
    const bodyHeight = Math.max(Math.abs(close - open), 1);

    ctx.fillRect(xStart, Math.min(open, close), adjustedWidth, bodyHeight);

    ctx.strokeStyle =
      d[1] > d[4]
        ? d3.color(colors.red)?.darker(0.5).toString() || colors.red
        : d3.color(colors.green)?.darker(0.5).toString() || colors.green;
    ctx.lineWidth = 1;
    ctx.strokeRect(xStart, Math.min(open, close), adjustedWidth, bodyHeight);
  });
}

export function drawVolumeOnCanvas(
  ctx: CanvasRenderingContext2D | null,
  data: BybitKline[],
  x: any,
  yVolume: any,
  candleWidth: number,
  height: number
) {
  // 서버 환경이거나 ctx가 null이면 아무것도 하지 않음
  if (isServer() || !ctx) return;

  data.forEach((d) => {
    const xPos = Math.round(x(new Date(d[0]))) + 0.5;
    const volumeY = Math.round(yVolume(d[5])) + 0.5;
    const volumeHeight = Math.round(height - volumeY);

    const adjustedWidth = Math.max(Math.round(candleWidth), 1);
    const xStart = Math.round(xPos - adjustedWidth / 2) + 0.5;

    const fillColor = d[1] > d[4] ? colors.red : colors.green;
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.6;

    ctx.fillRect(xStart, volumeY, adjustedWidth, volumeHeight);

    ctx.strokeStyle =
      d[1] > d[4]
        ? d3.color(colors.red)?.darker(0.5).toString() || colors.red
        : d3.color(colors.green)?.darker(0.5).toString() || colors.green;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(xStart, volumeY, adjustedWidth, volumeHeight);

    ctx.globalAlpha = 1.0;
  });
}

export function createCandles(svg: any, data: BybitKline[], x: any, y: any) {
  const candles = svg.append('g').attr('class', 'candles').attr('clip-path', 'url(#chart-area)');

  // Then draw the candle bodies (rectangles)
  const candleWidth = (x(new Date(Number(data[1][0]))) - x(new Date(Number(data[0][0])))) * 0.9;

  candles
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('fill', (d: BybitKline) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'));

  candles
    .selectAll('line')
    .data(data)
    .enter()
    .append('line')
    .attr('stroke', (d: BybitKline) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'))
    .attr('stroke-width', 1.5);

  updateCandles({ candles, x, y, candleWidth });
  return { candles, candleWidth };
}

export function updateCandles({ candles, x, y, candleWidth }: any) {
  candles
    .selectAll('rect')
    .attr('x', (d: any) => x(new Date(d[0])) - candleWidth / 2)
    .attr('y', (d: any) => y(Math.max(d[1], d[4])))
    .attr('height', (d: any) => Math.max(Math.abs(y(d[1]) - y(d[4])), 1))
    .attr('width', candleWidth);

  // Update wick positions
  candles
    .selectAll('line')
    .attr('x1', (d: any) => x(new Date(d[0])))
    .attr('x2', (d: any) => x(new Date(d[0])))
    .attr('y1', (d: any) => y(d[3]))
    .attr('y2', (d: any) => y(d[2]));
}

export function createGuideLines(svg: any) {
  const verticalLine = svg
    .append('line')
    .attr('class', 'guide-vertical-line')
    .attr('stroke', colors.gray)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0);

  const horizontalLine = svg
    .append('line')
    .attr('class', 'guide-horizontal-line')
    .attr('stroke', colors.gray)
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0);

  return { verticalLine, horizontalLine };
}

export function updateGuideLines({ svg, xPos, yPos, width, height }: any) {
  svg
    .select('.guide-vertical-line')
    .attr('x1', xPos)
    .attr('y1', 0)
    .attr('x2', xPos)
    .attr('y2', height)
    .attr('opacity', 1);

  svg
    .select('.guide-horizontal-line')
    .attr('x1', 0)
    .attr('y1', yPos)
    .attr('x2', width)
    .attr('y2', yPos)
    .attr('opacity', 1);
}

export function writeCandleInfo(text: any, d: BybitKline) {
  text.selectAll('tspan').remove();
  text.append('tspan').text('O: ').style('fill', colors.gray);
  text
    .append('tspan')
    .text(`${d[1].toFixed(1)} `)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
  text.append('tspan').text('H: ').style('fill', colors.gray);
  text
    .append('tspan')
    .text(`${d[2].toFixed(1)} `)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
  text.append('tspan').text('L: ').style('fill', colors.gray);
  text
    .append('tspan')
    .text(`${d[3].toFixed(1)} `)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
  text.append('tspan').text('C: ').style('fill', colors.gray);
  text
    .append('tspan')
    .text(`${d[4].toFixed(1)} `)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
  // text.append('tspan').text('V: ').style('fill', colors.gray);
  // text
  //   .append('tspan')
  //   .text(`${d[5].toFixed(1)}`)
  //   .style('fill', d[1] > d[4] ? colors.red : colors.green);
}

export function createIndicators(svg: any, width: number, height: number, rectWidth: number) {
  const priceIndicator = svg
    .append('g')
    .attr('class', 'price-indicator')
    .attr('transform', `translate(${width * 2}, 0)`);
  priceIndicator.append('rect').attr('width', 100).attr('height', 14).attr('fill', '#282828');
  // .attr('opacity', 0.5);
  priceIndicator
    .append('text')
    .attr('x', 3)
    .attr('y', 12)
    .text('100')
    .style('font-size', '14px')
    .style('fill', 'white')
    .style('text-anchor', 'start');

  const dateIndicator = svg
    .append('g')
    .attr('class', 'date-indicator')
    .attr('transform', `translate(0, ${height * 2})`);
  dateIndicator.append('rect').attr('width', rectWidth).attr('height', 18).attr('fill', '#282828');
  // .attr('opacity', 0.5);
  dateIndicator
    .append('text')
    .attr('x', 10)
    .attr('y', 14)
    .text('100')
    .style('font-size', '14px')
    .style('fill', 'white')
    .style('text-anchor', 'start');
  return { priceIndicator, dateIndicator };
}

export const colors = {
  red: '#EF454A',
  green: '#1EB26B',
  gray: '#71757A',
};

type Props = {
  svg: any; //d3.Selection<SVGSVGElement, unknown, null, undefined>;
  x: d3.ScaleTime<number, number, never>;
  y: d3.ScaleLinear<number, number, never>;
  yVolume: d3.ScaleLinear<number, number, never>;
  width: number;
  height: number;
  xAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  yAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  yVolumeAxisGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
};

export function updateAxis({
  svg,
  x,
  y,
  yVolume,
  width,
  height,
  xAxisGroup,
  yAxisGroup,
  yVolumeAxisGroup,
}: Props) {
  const xAxis = d3.axisBottom(x).ticks(10).tickSizeInner(-height).tickPadding(4);
  const yAxis = d3.axisRight(y).ticks(10).tickSizeInner(-width).tickPadding(4);
  const yVolumeAxis = d3
    .axisRight(yVolume)
    .ticks(4)
    .tickFormat((d) => (d === 0 ? '' : d.toString()))
    .tickSizeInner(-width);
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
  yVolumeAxisGroup.call(yVolumeAxis);
  xAxisGroup.selectAll('path').remove();
  yAxisGroup.selectAll('path').remove();
  yVolumeAxisGroup.selectAll('path').remove();
  svg.selectAll('.tick line').style('stroke', colors.gray).style('stroke-width', 0.2);
  svg.selectAll('.tick text').style('font-size', '14px');
}

export function createBaseLine(
  svg: any,
  width: number,
  height: number,
  candleChartHeightRatio: number
) {
  const baseLineX = svg
    .append('line')
    .attr('x1', 0)
    .attr('y1', height)
    .attr('x2', width * 2)
    .attr('y2', height)
    .style('stroke', 'white')
    .style('stroke-width', 1);
  const splitLineX = svg
    .append('line')
    .attr('x1', 0)
    .attr('y1', height * candleChartHeightRatio)
    .attr('x2', width * 2)
    .attr('y2', height * candleChartHeightRatio)
    .style('stroke', 'white')
    .style('stroke-width', 1);

  const baseLineY = svg
    .append('line')
    .attr('x1', width)
    .attr('y1', 0)
    .attr('x2', width)
    .attr('y2', height)
    .style('stroke', 'white')
    .style('stroke-width', 1);

  return { baseLineX, splitLineX, baseLineY };
}

/**
 * 서버 사이드에서 캔들 차트 SVG를 생성하는 함수
 */

// SVG 차트를 반응형으로 만들기 위한 유틸리티 함수
export function setResponsiveSVGDimensions(
  svg: d3.Selection<any, unknown, null, undefined>,
  width: number,
  height: number
) {
  svg
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  return svg;
}
