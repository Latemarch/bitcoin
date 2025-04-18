'use client';
import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  colors,
  createBaseLine,
  createGuideLines,
  createIndicators,
  updateAxis,
} from '@/lib/D3/candlesChart';
import Update from './Update';
import Draw from './Draw';
type Props = {
  initialWidth?: number;
  height?: number;
  data: BybitKline[];
};

export default function ChartLayout({ initialWidth = 1000, height = 500, data }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [renderComplete, setRenderComplete] = React.useState(false);
  let candleChartHeightRatio = 0.6;
  let volumeChartHeightRatio = 0.8;
  let macdChartHeightRatio = 0.2;
  React.useEffect(() => {
    if (!svgRef.current) return;

    setRenderComplete(false);

    const svg = d3
      .select(svgRef.current)
      .attr('class', 'bg-bgPrimary')
      .attr('width', initialWidth)
      .attr('height', height + 20);
    // .attr('border', '1px solid steelblue');

    const width = initialWidth - 100;
    const { gray } = colors;

    createBaseLine(svg, width, height, candleChartHeightRatio, volumeChartHeightRatio);

    const x = d3
      .scaleTime()
      .domain([new Date(Number(data[0][0])), new Date(Number(data[data.length - 1][0]))])
      .range([Math.min(0, width - initialWidth), width]);

    const firstDate = x.invert(0);
    const lastDate = x.invert(width);
    const visibleData = data.filter((d) => {
      const date = new Date(d[0]);
      return date >= firstDate && date <= lastDate;
    });

    // const maxPrice = Number(d3.max(visibleData, (d) => d[2])) + 10; // high
    // const minPrice = Number(d3.min(visibleData, (d) => d[3])) - 10; // low
    // const volumeMax = Number(d3.max(visibleData, (d) => d[5]));
    // const y = d3
    //   .scaleLinear()
    //   .domain([minPrice, maxPrice])
    //   .range([height * candleChartHeightRatio, 0]);

    // const yVolume = d3
    //   .scaleLinear()
    //   .domain([0, volumeMax])
    //   .range([height * volumeChartHeightRatio, height * candleChartHeightRatio + 4]);

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

    // text on left-top
    const candleInfo = svg
      .append('text')
      .attr('class', 'candle-info')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '16px')
      .style('fill', gray)
      .style('text-anchor', 'start');
    //

    createGuideLines(svg);
    createIndicators(svg, width, height, 1);

    setTimeout(() => setRenderComplete(true), 0);

    return () => {
      svg.selectAll('*').remove();
      setRenderComplete(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="">
      <svg ref={svgRef} />
      {renderComplete && (
        <Draw
          svgRef={svgRef}
          data={data}
          height={height}
          candleChartHeightRatio={candleChartHeightRatio}
          volumeChartHeightRatio={volumeChartHeightRatio}
        />
      )}
      {renderComplete && (
        <Update svgRef={svgRef} data={data} height={height} width={initialWidth} />
      )}
    </div>
  );
}
