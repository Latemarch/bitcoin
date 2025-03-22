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
