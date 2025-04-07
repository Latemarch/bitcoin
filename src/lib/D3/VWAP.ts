import { BybitKline } from '@/types/type';
import { colors } from './candlesChart';

type VWAPData = {
  timestamp: number;
  value: number;
};

export function drawVWAP(
  ctx: CanvasRenderingContext2D | null,
  vwapData: VWAPData[],
  x: any,
  y: any,
  color: string = colors.blue
) {
  if (!ctx || vwapData.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(x(new Date(vwapData[0].timestamp)), y(vwapData[0].value));

  for (let i = 1; i < vwapData.length; i++) {
    ctx.lineTo(x(new Date(vwapData[i].timestamp)), y(vwapData[i].value));
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function calculateVWAP(data: BybitKline[]): VWAPData[] {
  if (data.length === 0) return [];

  const vwapData: VWAPData[] = [];
  let cumulativeVolume = 0;
  let cumulativePriceVolume = 0;

  for (let i = 0; i < data.length; i++) {
    const currentData = data[i];
    const typicalPrice =
      (Number(currentData[2]) + Number(currentData[3]) + Number(currentData[4])) / 3; // (고가 + 저가 + 종가) / 3
    const volume = Number(currentData[5]);

    cumulativeVolume += volume;
    cumulativePriceVolume += typicalPrice * volume;

    const vwap = cumulativePriceVolume / cumulativeVolume;

    vwapData.push({
      timestamp: Number(currentData[0]),
      value: vwap,
    });
  }

  return vwapData;
}
