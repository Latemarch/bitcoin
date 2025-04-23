import { BybitKline } from '@/types/type';
import { colors } from '@/lib/constants';

type BollingerBandsData = {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
};

export function drawBollingerBands(
  ctx: CanvasRenderingContext2D | null,
  bbData: BollingerBandsData[],
  x: any,
  y: any,
  color: string = colors.gray
) {
  if (!ctx || bbData.length === 0) return;

  // 중간선 (이동평균선) 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(bbData[0].timestamp)), y(bbData[0].middle));
  for (let i = 1; i < bbData.length; i++) {
    ctx.lineTo(x(new Date(bbData[i].timestamp)), y(bbData[i].middle));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 상단 밴드 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(bbData[0].timestamp)), y(bbData[0].upper));
  for (let i = 1; i < bbData.length; i++) {
    ctx.lineTo(x(new Date(bbData[i].timestamp)), y(bbData[i].upper));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 하단 밴드 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(bbData[0].timestamp)), y(bbData[0].lower));
  for (let i = 1; i < bbData.length; i++) {
    ctx.lineTo(x(new Date(bbData[i].timestamp)), y(bbData[i].lower));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();

  // 밴드 사이 영역 채우기
  ctx.beginPath();
  ctx.moveTo(x(new Date(bbData[0].timestamp)), y(bbData[0].upper));
  for (let i = 1; i < bbData.length; i++) {
    ctx.lineTo(x(new Date(bbData[i].timestamp)), y(bbData[i].upper));
  }
  for (let i = bbData.length - 1; i >= 0; i--) {
    ctx.lineTo(x(new Date(bbData[i].timestamp)), y(bbData[i].lower));
  }
  ctx.closePath();
  ctx.fillStyle = `${color}20`; // 20% 투명도
  ctx.fill();
}

export function calculateBollingerBands(
  data: BybitKline[],
  period: number = 20,
  standardDeviation: number = 2
): BollingerBandsData[] {
  if (period <= 0 || data.length === 0) return [];

  const bbData: BollingerBandsData[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const closePrices = slice.map((d) => Number(d[4]));

    // 이동평균 계산
    const sum = closePrices.reduce((acc, curr) => acc + curr, 0);
    const middle = sum / period;

    // 표준편차 계산
    const squaredDifferences = closePrices.map((price) => Math.pow(price - middle, 2));
    const variance = squaredDifferences.reduce((acc, curr) => acc + curr, 0) / period;
    const stdDev = Math.sqrt(variance);

    // 상단/하단 밴드 계산
    const upper = middle + standardDeviation * stdDev;
    const lower = middle - standardDeviation * stdDev;

    bbData.push({
      timestamp: Number(data[i][0]),
      upper,
      middle,
      lower,
    });
  }

  return bbData;
}
