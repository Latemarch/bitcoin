// src/App.js
'use client';
import * as React from 'react';
//@ts-ignore
import { WebsocketClient } from 'bybit-api';
import { BybitKline, BybitWSData } from '@/types/type';

type Props = {
  setData: (data: BybitKline[]) => void;
  data: BybitKline[];
};
export default function BybitWS({ setData, data }: Props) {
  const [messages, setMessages] = React.useState<any>([]);
  const [lastTrade, setLastTrade] = React.useState<BybitWSData | null>(null);

  React.useEffect(() => {
    if (!data.length) return;
    if (lastTrade?.ts && data[data.length - 1][0]) {
      const lastTradeDate = new Date(lastTrade.ts);
      const lastCandleDate = new Date(data[data.length - 1][0]);
      if (lastTradeDate.getMinutes() === lastCandleDate.getMinutes()) {
        // 분단위가 일치할 경우 최근 캔들 데이터에 최근 트레이드 데이터 추가
        const { v, p } = lastTrade.data[0];
        const newData = [...data];
        const lastCandle = newData[newData.length - 1];
        lastCandle[5] = lastCandle[5] + Number(v);
        lastCandle[2] = lastCandle[4] < Number(p) ? Number(p) : lastCandle[4];
        lastCandle[3] = lastCandle[4] > Number(p) ? Number(p) : lastCandle[4];
        lastCandle[4] = Number(p);
        newData[newData.length - 1] = lastCandle;
        setData(newData);

        console.log(
          '분단위가 일치합니다.',
          lastTradeDate.getMinutes(),
          lastCandleDate.getMinutes()
        );
      } else {
        const { v, p } = lastTrade.data[0];
        setData(
          //@ts-ignore
          (prev: BybitKline[]) =>
            [
              ...prev,
              { 0: lastTrade.ts, 1: p, 2: p, 3: p, 4: p, 5: v, 6: 0, index: prev.length },
            ] as BybitKline[]
        );

        console.log(
          '분단위가 일치하지 않습니다.',
          lastTradeDate.getMinutes(),
          lastCandleDate.getMinutes()
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTrade]);

  React.useEffect(() => {
    const ws = new WebsocketClient({
      // key: "key",
      // secret: "secret",
      market: 'v5', // For Linear contracts
      testnet: false, // Use testnet
    });
    ws.subscribeV5(['publicTrade.BTCUSDT'], 'linear');

    ws.on('open', () => {
      console.log('WebSocket Connection Opened');
    });

    ws.on('update', (res: BybitWSData) => {
      setLastTrade(res);
    });

    ws.on('error', (error: any) => {
      console.log('WebSocket Error:', error);
    });

    return () => {
      //@ts-ignore
      ws.close();
    };
  }, []);

  return (
    <div className="App">
      <h1>Bybit WebSocket Messages</h1>
      {/* <ul>
        {messages.map((message: any, index: number) => (
          <li key={index}>{JSON.stringify(message)}</li>
        ))}
      </ul> */}
    </div>
  );
}
