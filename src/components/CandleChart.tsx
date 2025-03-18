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
      .domain([new Date(Number(data[data.length - 1][0])), new Date(Number(data[0][0]))])
      .range([0, width]);
    const y = d3.scaleLinear().domain([localMin, localMax]).range([height, 0]);

    const xAxis = d3.axisBottom(x).ticks(10);
    const yAxis = d3.axisLeft(y).ticks(5);
    const xAxisGroup = svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis);
    const yAxisGroup = svg.append('g').attr('class', 'y-axis').call(yAxis);
    const candles = svg.append('g').attr('class', 'candles');

    // Then draw the candle bodies (rectangles)
    candles
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => x(new Date(Number(d[0]))))
      .attr('y', (d) => y(Math.max(Number(d[1]), Number(d[4])))) // y position should be the higher of open/close
      .attr('width', 4)
      .attr('height', (d) => {
        const openPrice = Number(d[1]);
        const closePrice = Number(d[4]);
        return Math.abs(y(openPrice) - y(closePrice));
      })
      .attr('fill', (d) => (Number(d[1]) > Number(d[4]) ? 'red' : 'green'));

    candles
      .selectAll('line')
      .data(data)
      .enter()
      .append('line')
      .attr('x1', (d) => x(new Date(Number(d[0]))) + 2)
      .attr('y1', (d) => y(Number(d[3]))) // low
      .attr('x2', (d) => x(new Date(Number(d[0]))) + 2)
      .attr('y2', (d) => y(Number(d[2]))) // high
      .attr('stroke', (d) => (Number(d[1]) > Number(d[4]) ? 'red' : 'green'))
      .attr('stroke-width', 1);

    const zoom = d3.zoom().on('zoom', ({ transform }) => {
      const rescaleX = transform.rescaleX(x);
      xAxisGroup.call(xAxis.scale(rescaleX));

      // Get visible domain
      const visibleDomain = rescaleX.domain();

      // Filter data points within visible domain
      const visibleData = data.filter((d) => {
        const date = new Date(Number(d[0]));
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
        .attr('x', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleX(new Date(Number(datum[0])));
        })
        .attr('y', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleY(Math.max(Number(datum[1]), Number(datum[4])));
        })
        .attr('height', function (d) {
          const datum = d as unknown as BybitKline;
          const openPrice = Number(datum[1]);
          const closePrice = Number(datum[4]);
          return Math.abs(rescaleY(openPrice) - rescaleY(closePrice));
        });

      // Update wick positions
      candles
        .selectAll('line')
        .attr('x1', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleX(new Date(Number(datum[0]))) + 2;
        })
        .attr('x2', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleX(new Date(Number(datum[0]))) + 2;
        })
        .attr('y1', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleY(Number(datum[3]));
        })
        .attr('y2', function (d) {
          const datum = d as unknown as BybitKline;
          return rescaleY(Number(datum[2]));
        });
    });

    svg.call(zoom as any);
    return function cleanup() {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
      }
    };
  }, [data, width, height]);

  return (
    <div className="w-full h-full bg-blue-200">
      <svg ref={svgRef} />
    </div>
  );
}
