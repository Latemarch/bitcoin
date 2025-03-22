'use client';
import * as React from 'react';
import { getData, saveJson } from '@/lib/getPublicData';
import { BybitKline } from '@/types/type';
import CandleChartCanvas from './CandleChartCanvas';
import { getRecentCandles } from '@/lib/getCandles';
export default function CandleChartContainer() {
  const [data, setData] = React.useState<BybitKline[]>([]);
  React.useEffect(() => {
    const fetchData = async () => {
      const data = await getRecentCandles({});
      if (data.ok) {
        setData(data.res);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="w-11/12">
      {/* <CandleChart data={numData} width={1000} height={500} /> */}
      <CandleChartCanvas data={data} width={1000} height={500} />
    </div>
  );
}
