import * as d3 from 'd3';
import { BybitKline, IndicatorData } from '@/types/type';

export const getLocalLimitCandleArea = ({
  candleData,
  indicators,
  firstDate,
  lastDate,
}: {
  candleData: BybitKline[];
  indicators: any;
  firstDate: Date;
  lastDate: Date;
}) => {
  const visiblecandleData = candleData.filter((d) => {
    const date = new Date(d[0]);
    return date >= firstDate && date <= lastDate;
  });

  // 가격/볼륨 스케일 설정
  let maxPrice = Number(d3.max(visiblecandleData, (d) => d[2])) + 100;
  let minPrice = Number(d3.min(visiblecandleData, (d) => d[3])) - 100;
  const volumeMax = Number(d3.max(visiblecandleData, (d) => d[5]));
  if (indicators.bollingerBands) {
    const visibleBollingerBands = indicators.bollingerBands.filter((d: any) => {
      const date = new Date(d.timestamp);
      return date >= firstDate && date <= lastDate;
    });
    maxPrice = Math.max(maxPrice, Number(d3.max(visibleBollingerBands, (d: any) => d.upper)) + 50);
    minPrice = Math.min(minPrice, Number(d3.min(visibleBollingerBands, (d: any) => d.lower)) - 50);
  }
  // MACD를 위한 y축 스케일 설정
  const visibleMACDcandleData = indicators.macd.filter((d: any) => {
    const date = new Date(d.timestamp);
    return date >= firstDate && date <= lastDate;
  });
  const macdMax = Math.max(...visibleMACDcandleData.map((d: any) => Math.max(d.macd, d.signal)));
  const macdMin = Math.min(...visibleMACDcandleData.map((d: any) => Math.min(d.macd, d.signal)));
  const macdFluctuation = Math.max(macdMax, -macdMin) * 1.2;
  return { maxPrice, minPrice, volumeMax, macdFluctuation };
};

export const getScales = ({
  height,
  candleChartHeightRatio,
  volumeChartHeightRatio,
  candleData,
  indicators,
  firstDate,
  lastDate,
}: {
  candleData: BybitKline[];
  indicators: IndicatorData;
  firstDate: Date;
  lastDate: Date;
  height: number;
  candleChartHeightRatio: number;
  volumeChartHeightRatio: number;
}) => {
  const { maxPrice, minPrice, volumeMax, macdFluctuation } = getLocalLimitCandleArea({
    candleData,
    indicators,
    firstDate,
    lastDate,
  });
  const y = d3
    .scaleLinear()
    .domain([minPrice, maxPrice])
    .range([height * candleChartHeightRatio, 0]);
  const yVolume = d3
    .scaleLinear()
    .domain([0, volumeMax])
    .range([height, height * volumeChartHeightRatio + 4]);
  const yMACD = d3
    .scaleLinear()
    .domain([-macdFluctuation, macdFluctuation])
    .range([height * volumeChartHeightRatio, height * candleChartHeightRatio]);
  return { y, yVolume, yMACD };
};
