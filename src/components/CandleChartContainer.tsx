import { getData, saveJson } from '@/lib/getPublicData';
import CandleChart from './CandleChart';
import { BybitKline } from '@/types/type';
export default async function CandleChartContainer() {
  // const data = await fetch('http://localhost:3000/api/candle?interval=1').then((res) => res.json());
  // saveJson(data, 'data.json');
  const data = getData('data.json');
  const numData = data.result.list.reverse().map((d: BybitKline, index: number) => ({
    0: Number(d[0]),
    1: Number(d[1]),
    2: Number(d[2]),
    3: Number(d[3]),
    4: Number(d[4]),
    5: Number(d[5]),
    6: Number(d[6]),
    index,
  }));
  return (
    <div>
      <CandleChart data={numData} width={1000} height={500} />
    </div>
  );
}
