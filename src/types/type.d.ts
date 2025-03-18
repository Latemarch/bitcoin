export type BybitKline = {
  0: string; // startTime - Start time of the candle (ms)
  1: string; // openPrice - Open price
  2: string; // highPrice - Highest price
  3: string; // lowPrice - Lowest price
  4: string; // closePrice - Close price (last traded price when candle is not closed)
  5: string; // volume - Trade volume (base coin for USDT/USDC, quote coin for inverse)
  6: string; // turnover - Turnover
};
