import * as d3 from 'd3';
import { writeCandleInfo } from './candlesChart';
import { updateGuideLines } from './candlesChart';
import { BybitKline, IndicatorData } from '@/types/type';

export function handleMouseMove({
  event,
  y,
  yVolume,
  yMACD,
  width,
  height,
  candleChartHeightRatio,
  volumeChartHeightRatio,
  svg,
  data,
  x,
  indicators,
}: {
  event: any;
  y: d3.ScaleLinear<number, number>;
  x: d3.ScaleTime<number, number>;
  yVolume: d3.ScaleLinear<number, number>;
  yMACD: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  candleChartHeightRatio: number;
  volumeChartHeightRatio: number;
  svg: any; //d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  data: BybitKline[];
  indicators: IndicatorData;
}) {
  const [xCoord, yCoord] = d3.pointer(event);
  const bisectDate = d3.bisector((d: any) => d[0]).left;
  const x0 = x.invert(xCoord)?.getTime();
  const i = bisectDate(data, x0);
  const d0 = data[i - 1];
  const d1 = data[i];

  if (!d0 || !d1) return;
  const d = x0 < (d0[0] + d1[0]) / 2 ? d0 : d1;
  const xPos = x(d[0]);
  const yPos = yCoord;

  d3.select('.candle-info').call((text) => writeCandleInfo(text, d0));

  let indicatorText = '';
  if (yCoord < height * candleChartHeightRatio) {
    indicatorText = y.invert(yCoord).toFixed(2);
  } else if (
    yCoord >= height * candleChartHeightRatio &&
    yCoord < height * volumeChartHeightRatio
  ) {
    indicatorText = yMACD.invert(yCoord).toFixed(2);
  } else {
    indicatorText = yVolume.invert(yCoord).toFixed(0);
  }

  // const indicatorText =
  //   yCoord < height * candleChartHeightRatio
  //     ? y.invert(yCoord).toFixed(2)
  //     : yVolume.invert(yCoord).toFixed(0);

  d3.select('.price-indicator')
    .attr('transform', `translate(${width}, ${yPos - 10})`)
    .select('text')
    .text(indicatorText)
    .attr('opacity', 1);

  updateGuideLines({ svg, xPos, yPos, width, height });
}

export function handleMouseLeave() {
  d3.select('.guide-vertical-line').attr('opacity', 0);
  d3.select('.guide-horizontal-line').attr('opacity', 0);
  d3.select('.candle-info').selectAll('tspan').remove();
  // d3.select('.price-indicator').attr('opacity', 0);
  // d3.select('.date-indicator').attr('opacity', 0);
}
