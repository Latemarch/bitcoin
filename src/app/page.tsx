import CandleChartContainer from '@/components/CandleChartContainer';
import BybitWS from '@/components/BybitWS';

export default function Home() {
  return (
    <div>
      <BybitWS />
      <CandleChartContainer />
    </div>
  );
}
