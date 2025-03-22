'use client';
import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  colors,
  createBaseLine,
  createCanvasInSVG,
  createGuideLines,
  createIndicators,
  drawCandlesOnCanvas,
  drawVolumeOnCanvas,
  updateAxis,
} from '@/lib/D3/candlesChart';
type Props = {
  initialWidth?: number;
  height?: number;
  data: BybitKline[];
};

export default function Container({ initialWidth = 1000, height = 500, data }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const divRef = React.useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = React.useState(1000);
  React.useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3
      .select(svgRef.current)
      .attr('style', 'border: 1px solid steelblue')
      .attr('class', 'bg-bgPrimary')
      .attr('width', svgWidth)
      .attr('height', height + 20)
      // .attr('viewBox', `0 -20 ${width + 70} ${height + 50}`)
      .attr('border', '1px solid steelblue');

    const width = svgWidth - 70;
    const { gray, red, green } = colors;
    let candleChartHeightRatio = 0.8;

    const xIndex = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

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

    const maxPrice = Number(d3.max(visibleData, (d) => d[2])) + 10; // high
    const minPrice = Number(d3.min(visibleData, (d) => d[3])) - 10; // low
    const volumeMax = Number(d3.max(visibleData, (d) => d[5]));
    const y = d3
      .scaleLinear()
      .domain([minPrice, maxPrice])
      .range([height * candleChartHeightRatio, 0]);

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

    createBaseLine(svg, width, height, candleChartHeightRatio);

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
    const { verticalLine, horizontalLine } = createGuideLines(svg);
    const { priceIndicator, dateIndicator } = createIndicators(svg, width, height, 1);
    const { foreignObject, canvas, ctx, pixelRatio } = createCanvasInSVG(svg, width, height);
    drawCandlesOnCanvas(ctx, data, x, y, 1);
    drawVolumeOnCanvas(ctx, data, x, yVolume, 1, height);
    return () => {
      svg.selectAll('*').remove();
    };
  }, [svgWidth]);

  React.useEffect(() => {
    const handleResize = () => {
      if (!divRef.current) return;
      const { width, height } = divRef.current.getBoundingClientRect();
      const svg = d3.select(svgRef.current);
      setSvgWidth(width);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="border-5 flex bg-red-300" ref={divRef}>
      <svg ref={svgRef} />
    </div>
  );
}
