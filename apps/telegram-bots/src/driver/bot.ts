/**
 * وُصلة — Driver Bot
 * بوت السائق لإدارة الرحلات والاشتراك
 */

import { TelegramBot, inlineKeyboard, replyKeyboard } from "@waslah/infrastructure/telegram";

export class DriverBot {
  private bot: TelegramBot;
  private apiUrl: string;

  constructor(token: string, apiUrl: string) {
    this.bot = new TelegramBot(token);
    this.apiUrl = apiUrl;
  }

  async handleUpdate(update: any): Promise<void> {
    const msg = update.message;
    const cb = update.callback_query;
    const chatId = msg?.chat?.id ?? cb?.message?.chat?.id;
    const telegramId = msg?.from?.id ?? cb?.from?.id;
    if (!chatId || !telegramId) return;

    if (cb) {
      const data = cb.data ?? "";
      await this.bot.answerCallbackQuery(cb.id);

      if (data.startsWith("accept:")) {
        const rideId = data.slice(7);
        await this.acceptRide(chatId, telegramId, rideId);
      } else if (data.startsWith("decline:")) {
        const rideId = data.slice(8);
        await this.declineRide(chatId, rideId);
      } else if (data === "toggle_availability") {
        await this.toggleAvailability(chatId, telegramId);
      } else if (data.startsWith("arrived:")) {
        await this.arrivedAtPickup(chatId, data.slice(8));
      } else if (data.startsWith("start:")) {
        await this.startRide(chatId, data.slice(6));
      } else if (data.startsWith("finish:")) {
        await this.finishRide(chatId, data.slice(7));
      }
      return;
    }

    const text = msg.text ?? "";

    if (text === "/start") {
      await this.showWelcome(chatId, telegramId);
    } else if (text === "🚗 تسجيل/تحديث بياناتي") {
      await this.startRegistration(chatId);
    } else if (text === "💳 الاشتراك") {
      await this.showSubscription(chatId);
    } else if (text === "📊 أرباحي") {
      await this.showEarnings(chatId, telegramId);
    } else if (text === "📍 تحديث موقعي") {
      await this.requestLocation(chatId);
    }
  }

  private async showWelcome(chatId: number, telegramId: number): Promise<void> {
    const kb = replyKeyboard([
      ["🚗 تسجيل/تحديث بياناتي"],
      ["💳 الاشتراك", "📊 أرباحي"],
      ["📍 تحديث موقعي"],
    ]);

    await this.bot.sendMessage({
      chatId,
      text: `🚗 <b>أهلاً بك في بوت سائق وُصلة</b>\n\n✅ اشتراك شهري ثابت — 0% عمولة\n🚀 استقبل المشاوير والتوصيل\n💰 احتفظ بـ 100% من أرباحك`,
      replyMarkup: kb,
    });
  }

  private async startRegistration(chatId: number): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: `📝 <b>تسجيل سائق جديد</b>\n\nيرجى إرسال البيانات التالية:\n\n1️⃣ الاسم الكامل\n2️⃣ رقم الجوال\n3️⃣ المدينة\n4️⃣ موديل السيارة ورقم اللوحة`,
    });
  }

  private async showSubscription(chatId: number): Promise<void> {
    const kb = inlineKeyboard([
      [{ text: "💳 مشاوير فقط — 250 ريال/شهر", callbackData: "sub:rides" }],
      [{ text: "📦 توصيل فقط — 250 ريال/شهر", callbackData: "sub:delivery" }],
      [{ text: "🔄 مزدوج — 400 ريال/شهر", callbackData: "sub:combined" }],
    ]);

    await this.bot.sendMessage({
      chatId,
      text: `💰 <b>باقات الاشتراك</b>\n\n🚗 <b>مشاوير فقط:</b> 250 ريال/شهر\n📦 <b>توصيل فقط:</b> 250 ريال/شهر\n🔄 <b>مزدوج:</b> 400 ريال/شهر\n🎁 <b>أول شهر مجاني!</b>\n\n<i>اشتراك ثابت — لا عمولات على الطلبات</i>`,
      replyMarkup: kb,
    });
  }

  private async showEarnings(chatId: number, telegramId: number): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: `📊 <b>أرباحك</b>\n\n💰 إجمالي الأرباح: — ريال\n📦 عدد الرحلات: —\n⭐ التقييم: —\n📅 الاشتراك: —`,
    });
  }

  private async requestLocation(chatId: number): Promise<void> {
    const kb = replyKeyboard([
      ["📍 إرسال الموقع الحالي"],
    ], true, true);

    await this.bot.sendMessage({
      chatId,
      text: "📍 أرسل موقعك الحالي ليتمكن النظام من العثور عليك للطلبات القريبة.",
      replyMarkup: kb,
    });
  }

  private async acceptRide(chatId: number, telegramId: number, rideId: string): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: `✅ <b>تم قبول الرحلة!</b>\n\n📍 توجه إلى موقع الانطلاق.\n🆔 الرحلة: #${rideId.slice(0, 8)}`,
    });
  }

  private async declineRide(chatId: number, rideId: string): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: "❌ تم تخطي الطلب.",
    });
  }

  private async toggleAvailability(chatId: number, telegramId: number): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: "🔄 تم تبديل حالة التوفر.",
    });
  }

  private async arrivedAtPickup(chatId: number, rideId: string): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: "📍 تم تسجيل وصولك. أخبر العميل بوصولك.",
    });
  }

  private async startRide(chatId: number, rideId: string): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: "▶️ تم بدء الرحلة. وجهتك: ...",
    });
  }

  private async finishRide(chatId: number, rideId: string): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: "🏁 <b>تم إنهاء الرحلة!</b>\n\nشكراً لك! في انتظار التقييم.",
    });
  }
}