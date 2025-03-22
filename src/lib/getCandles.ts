import { KlineIntervalV3 } from 'bybit-api';
import { bybitClient } from './bybit';
import { BybitKline } from '@/types/type';

export async function getRecentCandles({
  category = 'inverse',
  symbol = 'BTCUSD',
  interval = '1',
  limit = '1000',
}: {
  category?: 'inverse' | 'spot' | 'linear';
  symbol?: string;
  interval?: KlineIntervalV3;
  limit?: string;
}) {
  try {
    const res = (await bybitClient.getKline({
      category,
      symbol,
      interval,
      limit: parseInt(limit),
    })) as any;

    const numData = res?.result.list.reverse().map((d: BybitKline, index: number) => ({
      0: Number(d[0]),
      1: Number(d[1]),
      2: Number(d[2]),
      3: Number(d[3]),
      4: Number(d[4]),
      5: Number(d[5]),
      6: Number(d[6]),
      index,
    }));
    return { ok: true, res: numData };
  } catch (error) {
    return { ok: false, error: 'Internal server error' };
  }
}
