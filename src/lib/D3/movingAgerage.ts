import { BybitKline } from '@/types/type';
import { colors } from './candlesChart';

type MovingAverageData = {
  timestamp: number;
  value: number;
};

export function drawMovingAverage(
  ctx: CanvasRenderingContext2D | null,
  maData: MovingAverageData[],
  x: any,
  y: any,
  color: string = colors.gray
) {
  if (!ctx || maData.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(x(new Date(maData[0].timestamp)), y(maData[0].value));

  for (let i = 1; i < maData.length; i++) {
    ctx.lineTo(x(new Date(maData[i].timestamp)), y(maData[i].value));
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function calculateMovingAverage(data: BybitKline[], period: number): MovingAverageData[] {
  if (period <= 0 || data.length === 0) return [];

  const maData: MovingAverageData[] = [];

  // 종가(close price)는 data[4]에 있습니다
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, curr) => acc + Number(curr[4]), 0);
    const average = sum / period;

    maData.push({
      timestamp: Number(data[i][0]),
      value: average,
    });
  }

  return maData;
}
