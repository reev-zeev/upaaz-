/**
 * وُصلة — Webhook Server
 * خادم استقبال Webhooks من تيليجرام
 */

import { RiderBot } from "../rider/bot.js";
import { DriverBot } from "../driver/bot.js";

interface BotConfig {
  riderToken: string;
  driverToken: string;
  apiUrl: string;
}

export function startWebhookServer(config: BotConfig) {
  const riderBot = new RiderBot(config.riderToken, config.apiUrl);
  const driverBot = new DriverBot(config.driverToken, config.apiUrl);

  // In production, this would be an HTTP server (e.g., Express or Hono)
  // handling POST /webhook/rider and POST /webhook/driver
  
  return {
    riderBot,
    driverBot,
    async handleRiderUpdate(update: any) {
      await riderBot.handleUpdate(update);
    },
    async handleDriverUpdate(update: any) {
      await driverBot.handleUpdate(update);
    },
  };
}