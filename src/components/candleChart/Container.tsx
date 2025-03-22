'use client';
import * as React from 'react';
import { getRecentCandles } from '@/lib/getCandles';
import { BybitKline } from '@/types/type';
import ChartLayout from './ChartLayout';

export default function Container() {
  const [data, setData] = React.useState<BybitKline[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await getRecentCandles({});
      if (res.ok) setData(res.data);
    };
    fetchData();
  }, []);

  return <div>{data.length && <ChartLayout data={data} />}</div>;
}
