import { BybitKline } from '@/types/type';

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
  text.append('tspan').text('V: ').style('fill', colors.gray);
  text
    .append('tspan')
    .text(`${d[5].toFixed(1)}`)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
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

export function updateAxis({
  svg,
  xAxisGroup,
  yAxisGroup,
  yVolumeAxisGroup,
  xAxis,
  yAxis,
  yVolumeAxis,
}: any) {
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
