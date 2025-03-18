import { NextResponse } from 'next/server';
import { KlineIntervalV3 } from "bybit-api";
import { bybitClient } from '@/lib/bybit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'inverse') as 'inverse' | 'spot' | 'linear';
    const symbol = searchParams.get('symbol') || 'BTCUSD';
    const interval = (searchParams.get('interval') || '60') as KlineIntervalV3;
    const limit = searchParams.get('limit') || '200';

    // Calculate end time (current time)
    const end = Date.now();
    // Calculate start time based on interval and limit
    const intervalMinutes = parseInt(interval);
    const start = end - (intervalMinutes * 60 * 1000 * parseInt(limit));

    const response = await bybitClient.getKline({
      category,
      symbol,
      interval,
      start,
      end,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching kline data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}