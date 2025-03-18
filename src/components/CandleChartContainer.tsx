import CandleChart from './CandleChart';

export default async function CandleChartContainer() {
  const data = await fetch('http://localhost:3000/api/candle?interval=1').then((res) => res.json());
  return (
    <div>
      <CandleChart data={data.result.list} width={1000} height={500} />
    </div>
  );
}
