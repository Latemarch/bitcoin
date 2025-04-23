import { BybitKline } from '@/types/type';
import { colors } from '@/lib/constants';

type MACDData = {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
};

// 지수이동평균(EMA) 계산 함수
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  // 첫 번째 EMA는 단순이동평균으로 계산
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  // 나머지 EMA 계산
  for (let i = period; i < data.length; i++) {
    ema.push(data[i] * k + ema[ema.length - 1] * (1 - k));
  }

  return ema;
}

export function calculateMACD(
  data: BybitKline[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDData[] {
  if (data.length === 0) return [];

  // 종가 데이터 추출
  const closePrices = data.map((d) => Number(d[4]));

  // 빠른 EMA와 느린 EMA 계산
  const fastEMA = calculateEMA(closePrices, fastPeriod);
  const slowEMA = calculateEMA(closePrices, slowPeriod);

  // MACD 라인 계산 (빠른 EMA - 느린 EMA)
  const macdLine: number[] = [];
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + (slowPeriod - fastPeriod)] - slowEMA[i]);
  }

  // 시그널 라인 계산 (MACD의 EMA)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // 히스토그램 계산 (MACD - 시그널)
  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + (signalPeriod - 1)] - signalLine[i]);
  }

  // 결과 데이터 생성
  const macdData: MACDData[] = [];
  const startIndex = slowPeriod + signalPeriod - 2; // 모든 계산이 가능한 시작 인덱스

  for (let i = startIndex; i < data.length; i++) {
    const macdIndex = i - startIndex;
    macdData.push({
      timestamp: Number(data[i][0]),
      macd: macdLine[macdIndex + (signalPeriod - 1)],
      signal: signalLine[macdIndex],
      histogram: histogram[macdIndex],
    });
  }

  return macdData;
}

export function drawMACD(
  ctx: CanvasRenderingContext2D | null,
  macdData: MACDData[],
  x: any,
  y: any,
  zeroLineY: number,
  candleWidth: number = 4
) {
  if (!ctx || macdData.length === 0) return;

  // MACD 라인 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(macdData[0].timestamp)), y(macdData[0].macd));
  for (let i = 1; i < macdData.length; i++) {
    ctx.lineTo(x(new Date(macdData[i].timestamp)), y(macdData[i].macd));
  }
  ctx.strokeStyle = colors.blue;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 시그널 라인 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(macdData[0].timestamp)), y(macdData[0].signal));
  for (let i = 1; i < macdData.length; i++) {
    ctx.lineTo(x(new Date(macdData[i].timestamp)), y(macdData[i].signal));
  }
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 히스토그램 그리기
  const histogramWidth = candleWidth; // 캔들 너비의 80%로 설정하되 최소 1px
  for (let i = 0; i < macdData.length; i++) {
    const xPos = x(new Date(macdData[i].timestamp));
    const height = Math.abs(y(macdData[i].histogram) - y(0));
    const yPos = macdData[i].histogram > 0 ? y(macdData[i].histogram) : y(0);

    ctx.fillStyle = macdData[i].histogram > 0 ? colors.green : colors.red;
    ctx.fillRect(xPos - histogramWidth / 2, yPos, histogramWidth, height);
  }

  // 제로 라인 그리기
  ctx.beginPath();
  ctx.moveTo(x(new Date(macdData[0].timestamp)), zeroLineY);
  ctx.lineTo(x(new Date(macdData[macdData.length - 1].timestamp)), zeroLineY);
  ctx.strokeStyle = colors.gray;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}
