/**
 * وُصلة — Bot Webhook Server
 * خادم ويبهوك موحد لجميع بوتات تيليجرام
 */

import { TelegramBot, verifyHmacSignature } from "@waslah/infrastructure/security";

interface BotConfig {
  token: string;
  handler: (update: any) => Promise<void>;
}

export class BotWebhookServer {
  private bots: Map<string, BotConfig> = new Map();
  private hmacSecret: string;

  constructor(hmacSecret: string) {
    this.hmacSecret = hmacSecret;
  }

  registerBot(name: string, token: string, handler: (update: any) => Promise<void>) {
    this.bots.set(name, { token, handler });
    console.log(`🤖 Bot registered: ${name}`);
  }

  async handleWebhook(botName: string, update: any, signature?: string): Promise<boolean> {
    const config = this.bots.get(botName);
    if (!config) {
      console.error(`❌ Unknown bot: ${botName}`);
      return false;
    }

    // Verify HMAC signature if provided
    if (signature) {
      const payload = JSON.stringify(update);
      if (!verifyHmacSignature(this.hmacSecret, payload, signature)) {
        console.error(`❌ Invalid signature for bot: ${botName}`);
        return false;
      }
    }

    try {
      await config.handler(update);
      return true;
    } catch (error) {
      console.error(`❌ Error handling update for ${botName}:`, error);
      return false;
    }
  }

  async setAllWebhooks(baseUrl: string, secretToken?: string) {
    for (const [name, config] of this.bots) {
      const bot = new TelegramBot(config.token);
      const webhookUrl = `${baseUrl}/webhook/${name}`;
      const success = await bot.setWebhook(webhookUrl, secretToken);
      console.log(`${success ? "✅" : "❌"} Webhook set for ${name}: ${webhookUrl}`);
    }
  }

  getBotNames(): string[] {
    return Array.from(this.bots.keys());
  }
}

// Middleware to verify Telegram IP
export function isTelegramIp(ip: string): boolean {
  const TELEGRAM_RANGES = [
    "149.154.160.0/20",
    "91.108.4.0/22",
    "91.108.56.0/22",
    "91.108.8.0/22",
  ];
  
  const ipNum = ipToNumber(ip);
  
  for (const range of TELEGRAM_RANGES) {
    const [base, mask] = range.split("/");
    const baseNum = ipToNumber(base);
    const maskBits = ~(2 ** (32 - parseInt(mask)) - 1);
    if ((ipNum & maskBits) === (baseNum & maskBits)) return true;
  }
  return false;
}

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}