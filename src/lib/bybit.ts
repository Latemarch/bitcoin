import { RestClientV5 } from "bybit-api";

export const bybitClient = new RestClientV5({
    testnet: false,
}); 