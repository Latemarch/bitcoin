import { create } from 'zustand';
import { IndicatorData, ChartOptions } from '@/types/type';

interface ChartState {
  // 옵션
  chartOptions: ChartOptions;
  candleChartHeightRatio: number;
  volumeChartHeightRatio: number;

  // 액션
  toggleIndicator: (indicator: keyof ChartOptions) => void;
  setChartHeightRatio: (candleRatio: number, volumeRatio: number) => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  // 초기 상태
  chartOptions: {
    macd: true,
    ma5: false,
    ma10: false,
    ma20: false,
    bollingerBands: false,
    vwap: false,
  },
  candleChartHeightRatio: 0.6,
  volumeChartHeightRatio: 0.8,

  // 액션
  toggleIndicator: (indicator) => {
    set((state) => ({
      chartOptions: {
        ...state.chartOptions,
        [indicator]: !state.chartOptions[indicator],
      },
    }));
  },

  setChartHeightRatio: (candleRatio, volumeRatio) => {
    set({
      candleChartHeightRatio: candleRatio,
      volumeChartHeightRatio: volumeRatio,
    });
  },
}));
