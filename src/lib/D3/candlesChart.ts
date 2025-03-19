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
    .attr('x', (d: BybitKline) => x(new Date(d[0])) - candleWidth / 2)
    .attr('y', (d: BybitKline) => y(Math.max(d[1], d[4]))) // y position should be the higher of open/close
    .attr('width', candleWidth)
    .attr('height', (d: BybitKline) => {
      const openPrice = d[1];
      const closePrice = d[4];
      return Math.abs(y(openPrice) - y(closePrice));
    })
    .attr('fill', (d: BybitKline) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'));

  candles
    .selectAll('line')
    .data(data)
    .enter()
    .append('line')
    .attr('x1', (d: BybitKline) => x(new Date(d[0])))
    .attr('y1', (d: BybitKline) => y(d[3])) // low
    .attr('x2', (d: BybitKline) => x(new Date(d[0])))
    .attr('y2', (d: BybitKline) => y(d[2])) // high
    .attr('stroke', (d: BybitKline) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'))
    .attr('stroke-width', 1.5);
  return { candles, candleWidth };
}

export function createGuideLines(svg: any) {
  const verticalLine = svg
    .append('line')
    .attr('class', 'guide-line')
    .attr('stroke', '#71757A')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0);

  const horizontalLine = svg
    .append('line')
    .attr('class', 'guide-line')
    .attr('stroke', '#71757A')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0);

  return { verticalLine, horizontalLine };
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
    .text(`${d[4].toFixed(1)}`)
    .style('fill', d[1] > d[4] ? colors.red : colors.green);
}

export function createIndicators(svg: any, width: number, height: number, rectWidth: number) {
  const priceIndicator = svg
    .append('g')
    .attr('class', 'price-indicator')
    .attr('transform', `translate(${width * 2}, 0)`);
  priceIndicator
    .append('rect')
    .attr('width', 100)
    .attr('height', 14)
    .attr('fill', 'red')
    .attr('opacity', 0.5);
  priceIndicator
    .append('text')
    .attr('x', 2)
    .attr('y', 10)
    .text('100')
    .style('font-size', '14px')
    .style('fill', 'white')
    .style('text-anchor', 'start');

  const dateIndicator = svg
    .append('g')
    .attr('class', 'date-indicator')
    .attr('transform', `translate(0, ${height * 2})`);
  dateIndicator
    .append('rect')
    .attr('width', rectWidth)
    .attr('height', 18)
    .attr('fill', 'red')
    .attr('opacity', 0.5);
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
