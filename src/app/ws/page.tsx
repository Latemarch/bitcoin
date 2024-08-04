import CandleChart from "@/components/CandleChart";
import WebsocketBybit from "@/components/Websocket_bybit";
import WebsocketServer from "@/components/WebsocketServer";

export default function page() {
  return (
    <div>
      <WebsocketBybit />
      <CandleChart />
    </div>
  );
}
