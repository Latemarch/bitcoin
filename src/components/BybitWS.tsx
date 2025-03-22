// src/App.js
'use client';
import React, { useEffect, useState } from 'react';
//@ts-ignore
import { WebsocketClient } from 'bybit-api';

export default function BybitWS() {
  const [messages, setMessages] = useState<any>([]);

  useEffect(() => {
    const ws = new WebsocketClient({
      // key: "key",
      // secret: "secret",
      market: 'v5', // For Linear contracts
      testnet: true, // Use testnet
    });
    ws.subscribeV5(['publicTrade.BTCUSDT'], 'linear');

    ws.on('open', () => {
      console.log('WebSocket Connection Opened');
    });

    ws.on('update', (data: any) => {
      console.log('Received:', data);
      setMessages((prevMessages: any) => [...prevMessages, data]);
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
