export type BybitKline = {
  0: number; // startTime - Start time of the candle (ms)
  1: number; // openPrice - Open price
  2: number; // highPrice - Highest price
  3: number; // lowPrice - Lowest price
  4: number; // closePrice - Close price (last traded price when candle is not closed)
  5: number; // volume - Trade volume (base coin for USDT/USDC, quote coin for inverse)
  6: number; // turnover - Turnover
  index: number;
};

export type BybitWSData = {
  topic: string;
  type: string;
  ts: number;
  data: {
    T: number; // Timestamp
    s: string; // Symbol
    S: string; // Side
    v: string; // Volume
    p: string; // Price
    L: string; // Tick direction
    i: string; // Trade ID
    BT: boolean; // Is block trade
    RPI: boolean; // Is retail price improvement
  }[];
  wsKey: string;
};

// 지표 데이터를 위한 인터페이스 정의
export interface IndicatorData {
  macd?: ReturnType<typeof calculateMACD>;
  ma5?: ReturnType<typeof calculateMovingAverage>;
  ma10?: ReturnType<typeof calculateMovingAverage>;
  ma20?: ReturnType<typeof calculateMovingAverage>;
  bollingerBands?: ReturnType<typeof calculateBollingerBands>;
  vwap?: ReturnType<typeof calculateVWAP>;
}

export interface ChartOptions {
  macd: boolean;
  ma5: boolean;
  ma10: boolean;
  ma20: boolean;
  bollingerBands: boolean;
  vwap: boolean;
}

export type BollingerBands = {
  timestamp: number;
  upper: number;
  middle: number;
  lower: number;
};

export type VWAP = {
  timestamp: number;
  vwap: number;
};

export type MovingAverage = {
  timestamp: number;
  movingAverage: number;
};

export type MACD = {
  timestamp: number;
  macd: number;
  signal: number;
  histogram: number;
};

export type VWAP = {
  timestamp: number;
  vwap: number;
};

export interface IndicatorData {
  macd?: MACD[];
  ma5?: MovingAverage[];
  ma10?: MovingAverage[];
  ma20?: MovingAverage[];
  bollingerBands?: BollingerBands[];
  vwap?: VWAP[];
}
