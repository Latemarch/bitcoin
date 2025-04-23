'use client';
import * as React from 'react';
import * as d3 from 'd3';
import { BybitKline } from '@/types/type';
import {
  createBaseLine,
  createGuideLines,
  createIndicators,
  updateAxis,
} from '@/lib/D3/candlesChart';
import Update from './Update';
import Draw from './Draw';
import { calculateMovingAverage } from '@/lib/getMovingAverage';
import { calculateBollingerBands } from '@/lib/D3/bollingerBands';
import { calculateMACD } from '@/lib/D3/macd';
import { IndicatorData, ChartOptions } from '@/types/type';
import { useChartStore } from '@/store/chartStore';
import { colors } from '@/lib/constants';
import BackTest from './BackTest';
type Props = {
  initialWidth?: number;
  height?: number;
  candleData: BybitKline[];
};

export default function ChartLayout({ initialWidth = 500, height = 500, candleData }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [renderComplete, setRenderComplete] = React.useState(false);
  const [indicators, setIndicators] = React.useState<IndicatorData>({});
  const chartOptions = useChartStore((state) => state.chartOptions);
  // const [chartOptions, setChartOptions] = React.useState<ChartOptions>({
  //   macd: false,
  //   ma5: false,
  //   ma10: false,
  //   ma20: false,
  //   bollingerBands: false,
  //   vwap: false,
  // });
  let candleChartHeightRatio = 0.6;
  let volumeChartHeightRatio = 0.8;

  // 지표 데이터 계산 - candleData가 변경될 때마다 실행
  React.useEffect(() => {
    if (!candleData.length) return;

    setIndicators({
      macd: chartOptions.macd ? calculateMACD(candleData) : null,
      ma5: chartOptions.ma5 ? calculateMovingAverage(candleData, 5) : null,
      ma10: chartOptions.ma10 ? calculateMovingAverage(candleData, 10) : null,
      ma20: chartOptions.ma20 ? calculateMovingAverage(candleData, 20) : null,
      bollingerBands: chartOptions.bollingerBands ? calculateBollingerBands(candleData, 20) : null,
      // vwap: calculateVWAP(candleData),
    });
  }, [candleData, chartOptions]);

  React.useEffect(() => {
    if (!svgRef.current) return;

    setRenderComplete(false);

    const svg = d3
      .select(svgRef.current)
      .attr('class', 'bg-bgPrimary')
      .attr('width', initialWidth)
      .attr('height', height + 20)
      .attr('border', '1px solid steelblue');

    const width = initialWidth - 20;
    const { gray } = colors;

    createBaseLine(svg, width, height, candleChartHeightRatio, volumeChartHeightRatio);

    const x = d3
      .scaleTime()
      .domain([
        new Date(Number(candleData[0][0])),
        new Date(Number(candleData[candleData.length - 1][0])),
      ])
      .range([Math.min(0, width - initialWidth), width]);

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
          candleData={candleData}
          height={height}
          candleChartHeightRatio={candleChartHeightRatio}
          volumeChartHeightRatio={volumeChartHeightRatio}
          indicators={indicators}
        />
      )}
      {renderComplete && (
        <Update svgRef={svgRef} candleData={candleData} height={height} width={initialWidth} />
      )}
      {renderComplete && (
        <BackTest svgRef={svgRef} candleData={candleData} height={height} width={initialWidth} />
      )}
    </div>
  );
}
