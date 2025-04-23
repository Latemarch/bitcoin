import React from "react";
//@ts-ignore
import { WebsocketClient } from "bybit-api";

function WebsocketServer() {
  const ws = new WebsocketClient({
    // key: "key",
    // secret: "secret",
    market: "v5", // For Linear contracts
    testnet: true, // Use testnet
  });
  ws.subscribeV5(["publicTrade.BTCUSDT"], "linear");

  ws.on("open", () => {
    console.log("WebSocket Connection Opened");
  });

  ws.on("update", (data: any) => {
    console.log("Received:", data);
    // setMessages((prevMessages: any) => [...prevMessages, data]);
  });

  ws.on("error", (error: any) => {
    console.log("WebSocket Error:", error);
  });

  return (
    <div className="App">
      <h1>Bybit WebSocket Messages</h1>
      <ul></ul>
    </div>
  );
}

export default WebsocketServer;
