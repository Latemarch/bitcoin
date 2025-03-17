import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'spot';
    const symbol = searchParams.get('symbol') || 'BTCUSDT';
    const interval = searchParams.get('interval') || '1';
    const limit = searchParams.get('limit') || '200';

    // Calculate end time (current time)
    const end = Math.floor(Date.now() / 1000);
    // Calculate start time based on interval and limit
    const intervalMinutes = parseInt(interval);
    const start = end - (intervalMinutes * 60 * parseInt(limit));

    const baseUrl = 'https://api.bybit.com/v5/market/kline';
    const queryParams = new URLSearchParams({
      category,
      symbol,
      interval,
      limit,
      start: start.toString(),
      end: end.toString(),
    });

    const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.msg || 'Failed to fetch kline data' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching kline data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
