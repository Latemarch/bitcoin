import * as d3 from 'd3';
import { writeCandleInfo } from './candlesChart';
import { updateGuideLines } from './candlesChart';
import { BybitKline } from '@/types/type';

export function handleMouseMove({
  event,
  y,
  yVolume,
  width,
  height,
  candleChartHeightRatio,
  svg,
  data,
  x,
}: {
  event: any;
  y: d3.ScaleLinear<number, number>;
  x: d3.ScaleTime<number, number>;
  yVolume: d3.ScaleLinear<number, number>;
  width: number;
  height: number;
  candleChartHeightRatio: number;
  svg: any; //d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  data: BybitKline[];
}) {
  const [xCoord, yCoord] = d3.pointer(event);
  const bisectDate = d3.bisector((d: any) => d[0]).left;
  const x0 = x.invert(xCoord);
  const i = bisectDate(data, x0);
  console.log(i);

  const d0 = data[i - 1];
  const d1 = data[i];
  //   if (!d0 || !d1) {
  //     console.log('no data');
  //     return;
  //   }
  //   const d = x0 < (d0[0] + d1[0]) / 2 ? d0 : d1;
  const xPos = x(d0[0]);
  const yPos = yCoord;

  //   d3.select('.candle-info').call((text) => writeCandleInfo(text, d));
  //   d3.select('.price-indicator').attr('transform', `translate(${width}, ${yPos - 5})`);

  //   const indicatorText =
  //     yCoord < height * candleChartHeightRatio
  //       ? y.invert(yCoord).toFixed(2)
  //       : yVolume.invert(yCoord).toFixed(0);
  //   d3.select('.price-indicator text').text(indicatorText);

  updateGuideLines({ svg, xPos, yPos, width, height });
}

export function handleMouseLeave() {
  d3.select('.guide-vertical-line').attr('opacity', 0);
  d3.select('.guide-horizontal-line').attr('opacity', 0);
  d3.select('.candle-info').selectAll('tspan').remove();
  d3.select('.price-indicator').attr('opacity', 0);
  d3.select('.date-indicator').attr('opacity', 0);
}
