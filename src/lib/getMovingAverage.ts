import { BybitKline } from '@/types/type';

type MovingAverageData = {
  timestamp: number;
  value: number;
};

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
