/**
 * وُصلة — Rider Bot Handler
 * معالج بوت الراكب (بوت العميل)
 */

import { TelegramBot, inlineKeyboard, replyKeyboard, removeKeyboard } from "@waslah/infrastructure/telegram";
import type { ServiceType } from "@waslah/domain/ride";

export class RiderBot {
  private bot: TelegramBot;
  
  constructor(token: string) {
    this.bot = new TelegramBot(token);
  }

  getMainKeyboard() {
    return replyKeyboard([
      ["🚖 طلب مشوار", "📦 طلب توصيل"],
      ["📍 مشاركة موقعي", "⭐ مفضلتي"],
      ["🚨 طوارئ", "ℹ️ المساعدة"],
    ]);
  }

  async handleStart(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: `👋 أهلاً بك في <b>وُصلة</b>!\nمنصة النقل والتوصيل الذكية.\n\nاختر من القائمة أدناه:`,
      replyMarkup: this.getMainKeyboard(),
    });
  }

  async handleRequestRide(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "📍 أين موقع الانطلاق؟\nأرسل موقعك الحالي أو اكتب اسم الحي:",
      replyMarkup: replyKeyboard([
        [{ text: "📍 إرسال موقعي", requestLocation: true }],
        ["إلغاء"],
      ]),
    });
  }

  async handleRequestDelivery(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "📦 أين موقع الاستلام؟\nأرسل الموقع أو اكتب العنوان:",
      replyMarkup: replyKeyboard([
        [{ text: "📍 إرسال موقع الاستلام", requestLocation: true }],
        ["إلغاء"],
      ]),
    });
  }

  async handlePickupReceived(chatId: number, lat: number, lng: number, label?: string) {
    await this.bot.sendMessage({
      chatId,
      text: "🎯 أين الوجهة؟\nأرسل الموقع أو اكتب اسم المكان:",
      replyMarkup: replyKeyboard([
        [{ text: "📍 إرسال موقع الوجهة", requestLocation: true }],
        ["إلغاء"],
      ]),
    });
  }

  async handlePriceInput(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "💰 كم السعر المقترح؟\n(مثلاً: 50 ريال، أو \"حسب الاتفاق\")",
      replyMarkup: replyKeyboard([
        ["حسب الاتفاق"],
        ["إلغاء"],
      ]),
    });
  }

  async handlePaymentMethod(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "💳 اختر طريقة الدفع:",
      replyMarkup: replyKeyboard([
        ["💵 كاش", "🏦 تحويل بنكي"],
        ["📱 STC Pay", "💳 مدى"],
        ["إلغاء"],
      ]),
    });
  }

  async handleRideCreated(chatId: number, rideId: string) {
    await this.bot.sendMessage({
      chatId,
      text: `✅ <b>تم إرسال طلبك #${rideId.slice(0, 8)}</b>\nجارٍ البحث عن أفضل سائق... 🚗`,
      replyMarkup: this.getMainKeyboard(),
    });
  }

  async handleDriverAssigned(
    chatId: number,
    driver: { name: string; carModel: string; carPlate: string; rating: number },
    rideId: string
  ) {
    await this.bot.sendMessage({
      chatId,
      text: [
        "🎉 <b>تم العثور على سائق!</b>",
        `👤 الاسم: ${driver.name}`,
        `🚗 السيارة: ${driver.carModel}`,
        `🔢 اللوحة: ${driver.carPlate}`,
        `⭐ التقييم: ${driver.rating.toFixed(1)}`,
        "",
        "يمكنك التواصل مع السائق مباشرة.",
      ].join("\n"),
      replyMarkup: inlineKeyboard([
        [{ text: "💬 مراسلة السائق", callbackData: `chat:${rideId}` }],
        [{ text: "🚨 طوارئ", callbackData: `sos:${rideId}` }],
        [{ text: "❌ إلغاء", callbackData: `cancel:${rideId}` }],
      ]),
    });
  }

  async handleRideComplete(chatId: number, rideId: string, driverId: string) {
    await this.bot.sendMessage({
      chatId,
      text: "🌟 <b>تم إنهاء المشوار.</b>\nكيف تقيم السائق؟",
      replyMarkup: inlineKeyboard([
        [
          { text: "⭐", callbackData: `rate:${rideId}:${driverId}:1` },
          { text: "⭐⭐", callbackData: `rate:${rideId}:${driverId}:2` },
          { text: "⭐⭐⭐", callbackData: `rate:${rideId}:${driverId}:3` },
          { text: "⭐⭐⭐⭐", callbackData: `rate:${rideId}:${driverId}:4` },
          { text: "⭐⭐⭐⭐⭐", callbackData: `rate:${rideId}:${driverId}:5` },
        ],
      ]),
    });
  }

  async handleSOS(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "🚨 <b>طوارئ</b>\nأرسل تفاصيل الحالة الطارئة:\n(سيتم إشعار فريق الدعم فوراً)",
      replyMarkup: replyKeyboard([["إلغاء"]]),
    });
  }
}