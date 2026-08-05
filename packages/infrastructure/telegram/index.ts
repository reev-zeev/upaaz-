/**
 * وُصلة — Telegram Integration
 * تكامل مع Telegram Bot API
 */

export interface TelegramMessage {
  chatId: number | string;
  text: string;
  parseMode?: "HTML" | "Markdown";
  replyMarkup?: object;
  disableNotification?: boolean;
}

export interface TelegramButton {
  text: string;
  callbackData?: string;
  url?: string;
  requestLocation?: boolean;
  requestContact?: boolean;
}

export function inlineKeyboard(buttons: TelegramButton[][]): object {
  return {
    inline_keyboard: buttons.map(row =>
      row.map(btn => ({
        text: btn.text,
        ...(btn.callbackData ? { callback_data: btn.callbackData } : {}),
        ...(btn.url ? { url: btn.url } : {}),
      }))
    ),
  };
}

export function replyKeyboard(buttons: string[][], resize = true, oneTime = false): object {
  return {
    keyboard: buttons.map(row => row.map(text => ({ text }))),
    resize_keyboard: resize,
    one_time_keyboard: oneTime,
  };
}

export function removeKeyboard(): object {
  return { remove_keyboard: true };
}

export class TelegramBot {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(msg: TelegramMessage): Promise<boolean> {
    try {
      const body: Record<string, unknown> = {
        chat_id: msg.chatId,
        text: msg.text,
        parse_mode: msg.parseMode ?? "HTML",
      };
      if (msg.replyMarkup) body.reply_markup = msg.replyMarkup;
      if (msg.disableNotification) body.disable_notification = true;

      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch (e) {
      console.error("[Telegram] sendMessage error:", e);
      return false;
    }
  }

  async sendLocation(chatId: number | string, lat: number, lng: number): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/sendLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, latitude: lat, longitude: lng }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string, showAlert = false): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async setWebhook(url: string, secretToken?: string): Promise<boolean> {
    try {
      const body: Record<string, unknown> = { url };
      if (secretToken) body.secret_token = secretToken;
      const res = await fetch(`${this.baseUrl}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteWebhook(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/deleteWebhook`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  }
}