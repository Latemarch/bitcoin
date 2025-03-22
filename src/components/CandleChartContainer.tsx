'use client';
import * as React from 'react';
import { getRecentCandles } from '@/lib/getCandles';
import { BybitKline } from '@/types/type';
import CandleChartCanvas from './CandleChartCanvas';
import BybitWS from './BybitWS';

export default function CandleChartContainer() {
  const [data, setData] = React.useState<BybitKline[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const res = await getRecentCandles({});
      if (res.ok) setData(res.data);
    };
    fetchData();
  }, []);

  return (
    <div className="w-11/12">
      <BybitWS setData={setData} data={data} />
      {data.length > 0 && <CandleChartCanvas data={data} width={1000} height={500} />}
    </div>
  );
}
