import Container from '@/components/candleChart/Container';
import { getData } from '@/lib/getPublicData';
import { BybitKline } from '@/types/type';

export default function page() {
  const data = getData('data1000.json');
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
      <Container data={numData} />
    </div>
  );
}
