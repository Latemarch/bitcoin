import CandleChartContainer from '@/components/CandleChartContainer';
import WebsocketBybit from '@/components/Websocket_bybit';
import WebsocketServer from '@/components/WebsocketServer';

export default function page() {
  return (
    <div>
      {/* <WebsocketBybit /> */}
      <CandleChartContainer />
    </div>
  );
}
