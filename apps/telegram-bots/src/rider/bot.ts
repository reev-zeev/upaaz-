/**
 * وُصلة — Rider Bot
 * بوت العميل لطلب المشاوير والتوصيل
 */

import { TelegramBot, inlineKeyboard, replyKeyboard, removeKeyboard } from "@waslah/infrastructure/telegram";
import { success, failure, type Result } from "@waslah/shared/result";

export class RiderBot {
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

    // Handle callback queries
    if (cb) {
      const data = cb.data ?? "";
      await this.bot.answerCallbackQuery(cb.id);

      if (data === "new_ride") {
        await this.showRequestMenu(chatId);
      } else if (data.startsWith("cancel:")) {
        const rideId = data.slice(7);
        await this.cancelRide(chatId, telegramId, rideId);
      } else if (data.startsWith("sos:")) {
        const rideId = data.slice(4);
        await this.triggerSOS(chatId, rideId);
      }
      return;
    }

    // Handle text commands
    const text = msg.text ?? "";

    if (text === "/start") {
      await this.showWelcome(chatId, telegramId);
    } else if (text === "🚖 طلب مشوار") {
      await this.showRequestMenu(chatId);
    } else if (text === "📜 رحلاتي") {
      await this.showMyRides(chatId, telegramId);
    } else if (text === "🛟 الدعم الفني") {
      await this.showSupport(chatId);
    } else if (text === "📍 مشاركة موقعي") {
      await this.requestLocation(chatId);
    } else if (text === "ℹ️ المساعدة") {
      await this.showHelp(chatId);
    }
  }

  private async showWelcome(chatId: number, telegramId: number): Promise<void> {
    const kb = replyKeyboard([
      ["🚖 طلب مشوار"],
      ["📜 رحلاتي", "🛟 الدعم الفني"],
    ]);

    await this.bot.sendMessage({
      chatId,
      text: `👋 أهلاً بك في <b>وُصلة</b> 🚀\n\nمنصة التنقل الذكية الأولى في الخليج.\n\n✅ مشاوير · توصيل · شحن\n✅ 0% عمولة للسائقين\n✅ اشتراك شهري ثابت\n✅ دفع آمن عبر سداد/مدى/STC Pay`,
      replyMarkup: kb,
    });
  }

  private async showRequestMenu(chatId: number): Promise<void> {
    const kb = inlineKeyboard([
      [{ text: "🚗 مشوار", callbackData: "service:ride" }],
      [{ text: "📦 توصيل", callbackData: "service:delivery" }],
      [{ text: "🔙 رجوع", callbackData: "back_main" }],
    ]);

    await this.bot.sendMessage({
      chatId,
      text: "🚀 <b>ما نوع الخدمة؟</b>",
      replyMarkup: kb,
    });
  }

  private async showMyRides(chatId: number, telegramId: number): Promise<void> {
    // In production, fetch from API
    await this.bot.sendMessage({
      chatId,
      text: "📜 <b>رحلاتك السابقة</b>\n\n(سيتم عرض آخر 10 رحلات)",
    });
  }

  private async showSupport(chatId: number): Promise<void> {
    const kb = inlineKeyboard([
      [{ text: "💬 مراسلة الدعم", url: "https://t.me/waslah_support" }],
    ]);

    await this.bot.sendMessage({
      chatId,
      text: "🛟 <b>الدعم الفني</b>\n\nللتواصل مع فريق الدعم:\n• أرسل استفسارك هنا\n• أو تواصل عبر البوت المخصص",
      replyMarkup: kb,
    });
  }

  private async requestLocation(chatId: number): Promise<void> {
    const kb = replyKeyboard([
      ["📍 إرسال الموقع الحالي"],
    ], true, true);

    await this.bot.sendMessage({
      chatId,
      text: "📍 أرسل موقعك الحالي للعثور على السائقين القريبين منك.",
      replyMarkup: kb,
    });
  }

  private async showHelp(chatId: number): Promise<void> {
    await this.bot.sendMessage({
      chatId,
      text: `ℹ️ <b>مساعدة وُصلة</b>\n\n🚖 <b>طلب مشوار:</b>\nاختر الخدمة، حدد الموقع والوجهة، وانتظر السائق.\n\n💰 <b>الدفع:</b>\nنقداً، بطاقة، محفظة، STC Pay، Apple Pay.\n\n⭐ <b>التقييم:</b>\nبعد كل رحلة، قيّم السائق.\n\n🆘 <b>طوارئ:</b>\nاضغط زر SOS أثناء الرحلة.\n\n📞 <b>الدعم:</b>\nراسل @waslah_support`,
    });
  }

  private async cancelRide(chatId: number, telegramId: number, rideId: string): Promise<void> {
    // In production, call API to cancel
    await this.bot.sendMessage({
      chatId,
      text: "❌ تم إلغاء الرحلة.",
    });
  }

  private async triggerSOS(chatId: number, rideId: string): Promise<void> {
    // In production, trigger emergency protocol
    await this.bot.sendMessage({
      chatId,
      text: `🚨 <b>تم إرسال تنبيه الطوارئ!</b>\nفريق الدعم في طريقه إليك.\n\nالرحلة: #${rideId.slice(0, 8)}`,
    });
  }
}