'use client';

import { BybitKline } from '@/types/type';
import * as React from 'react';
import * as d3 from 'd3';
type Props = {
  data: BybitKline[];
  width: number;
  height: number;
};

export default function CandleChart({ data, width = 1000, height = 500 }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  console.log(data);

  React.useEffect(() => {
    if (!svgRef.current || !data) return;
    const svg = d3
      .select(svgRef.current)
      .style('border', '3px solid steelblue')
      .attr('viewBox', `-40 -20 ${width + 40} ${height + 50}`);

    const localMax = Number(d3.max(data, (d) => d[2])) + 10; // high
    const localMin = Number(d3.min(data, (d) => d[3])) - 10; // low

    const x = d3
      .scaleTime()
      // .domain([new Date(Number(data[data.length - 1][0])), new Date(Number(data[0][0]))])
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([0, width]);
    const xIndex = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);
    const y = d3.scaleLinear().domain([localMin, localMax]).range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(10).tickSizeInner(-height);
    const yAxis = d3.axisLeft(y).ticks(10).tickSizeInner(-width);

    const xAxisGroup = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .style('color', '#71757A');
    const yAxisGroup = svg
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .style('color', '#71757A');

    svg.selectAll('.tick line').style('stroke', '#71757A').style('stroke-width', 0.2);

    // Create clip path
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'chart-area')
      .append('rect')
      .attr('width', width)
      .attr('height', height);

    const candles = svg.append('g').attr('class', 'candles').attr('clip-path', 'url(#chart-area)');

    // Then draw the candle bodies (rectangles)
    const candleWidth = (x(new Date(Number(data[1][0]))) - x(new Date(Number(data[0][0])))) * 0.9;

    candles
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(new Date(d[0])) - candleWidth / 2)
      .attr('y', (d) => y(Math.max(d[1], d[4]))) // y position should be the higher of open/close
      .attr('width', candleWidth)
      .attr('height', (d) => {
        const openPrice = d[1];
        const closePrice = d[4];
        return Math.abs(y(openPrice) - y(closePrice));
      })
      .attr('fill', (d) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'));

    candles
      .selectAll('line')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', (d) => x(new Date(d[0])))
      .attr('y1', (d) => y(d[3])) // low
      .attr('x2', (d) => x(new Date(d[0])))
      .attr('y2', (d) => y(d[2])) // high
      .attr('stroke', (d) => (d[1] > d[4] ? '#EF454A' : '#1EB26B'))
      .attr('stroke-width', 1.5);

    const circle = svg.append('circle').attr('r', 0).attr('fill', 'red');
    const listeningRect = svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'white')
      .attr('opacity', 0);
    listeningRect.on('mousemove', (e) => {
      const [xCoord] = d3.pointer(e);
      const bisectDate = d3.bisector((d: any) => d.index).left; // right 대신 left 사용
      const x0 = xIndex.invert(xCoord);
      const i = bisectDate(data, x0);
      const d0 = data[i];
      const d1 = data[i + 1];
      const d = x0 < (d0.index + d1.index) / 2 ? d0 : d1;
      const xPos = x(d[0]);
      const yPos = y(d[1]);
      console.log(i, xPos, yPos);
      // const tooltip = d3.select(".tooltip");
      // tooltip.style("left", `${xPos}px`).style("top", `${yPos}px`);
      circle.attr('cx', xPos).attr('cy', yPos).attr('r', 10);
      // setCurrentIndex(d.index);
    });

    const handleZoom = ({ transform }: any) => {
      const rescaleX = transform.rescaleX(x);
      const rescaleXIndex = transform.rescaleX(xIndex);
      xAxisGroup.call(xAxis.scale(rescaleX));

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
      const rescaleY = d3.scaleLinear().domain([visibleMin, visibleMax]).range([height, 0]);

      // Update y axis
      yAxisGroup.call(yAxis.scale(rescaleY));

      // Update candle positions and heights
      candles
        .selectAll('rect')
        .attr('x', (d: any) => rescaleX(new Date(d[0])) - (candleWidth * transform.k) / 2)
        .attr('y', (d: any) => rescaleY(Math.max(d[1], d[4])))
        .attr('height', (d: any) => Math.abs(rescaleY(d[1]) - rescaleY(d[4])))
        .attr('width', candleWidth * transform.k);

      // Update wick positions
      candles
        .selectAll('line')
        .attr('x1', (d: any) => rescaleX(new Date(d[0])))
        .attr('x2', (d: any) => rescaleX(new Date(d[0])))
        .attr('y1', (d: any) => rescaleY(d[3]))
        .attr('y2', (d: any) => rescaleY(d[2]));

      listeningRect.on('mousemove', (e) => {
        const [xCoord] = d3.pointer(e);
        const bisectDate = d3.bisector((d: any) => d.index).left; // right 대신 left 사용
        const x0 = rescaleXIndex.invert(xCoord);
        const i = bisectDate(data, x0);
        const d0 = data[i];
        const d1 = data[i + 1];
        const d = x0 < (d0.index + d1.index) / 2 ? d0 : d1;
        const xPos = rescaleX(d[0]);
        const yPos = rescaleY(d[4]);
        // const tooltip = d3.select(".tooltip");
        // tooltip.style("left", `${xPos}px`).style("top", `${yPos}px`);
        circle.attr('cx', xPos).attr('cy', yPos).attr('r', 10);
        // setCurrentIndex(d.index);
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
