/**
 * وُصلة — Driver Bot Handler
 * معالج بوت السائق
 */

import { TelegramBot, inlineKeyboard, replyKeyboard } from "@waslah/infrastructure/telegram";

export class DriverBot {
  private bot: TelegramBot;

  constructor(token: string) {
    this.bot = new TelegramBot(token);
  }

  getMainMenu(isSubscribed: boolean, isAvailable: boolean) {
    const rows: string[][] = [["🚗 تسجيل بياناتي"]];
    
    if (isSubscribed) {
      const availBtn = isAvailable ? "🔴 غير متاح" : "🟢 متاح";
      rows.push([availBtn]);
    }
    
    rows.push(["💳 اشتراك", "📍 تحديث موقعي"]);
    rows.push(["📊 أرباحي", "ℹ️ المساعدة"]);
    
    return replyKeyboard(rows);
  }

  async handleStart(chatId: number, isSubscribed: boolean, isAvailable: boolean) {
    const subStatus = isSubscribed ? "✅ مشترك" : "❌ غير مشترك";
    await this.bot.sendMessage({
      chatId,
      text: `🚗 <b>أهلاً بك في وُصلة للسائقين!</b>\n\nحالة اشتراكك: ${subStatus}\n\nاختر من القائمة:`,
      replyMarkup: this.getMainMenu(isSubscribed, isAvailable),
    });
  }

  async handleNewOffer(
    chatId: number,
    offer: {
      rideId: string;
      pickupLabel: string;
      dropoffLabel: string;
      distanceKm?: number;
      suggestedFare?: number;
    }
  ) {
    const lines = [
      "🚖 <b>طلب جديد!</b>",
      `📍 من: ${offer.pickupLabel}`,
      `🎯 إلى: ${offer.dropoffLabel}`,
    ];
    if (offer.distanceKm) lines.push(`📏 المسافة: ${offer.distanceKm.toFixed(1)} كم`);
    if (offer.suggestedFare) lines.push(`💰 السعر: ${offer.suggestedFare} ريال`);

    await this.bot.sendMessage({
      chatId,
      text: lines.join("\n"),
      replyMarkup: inlineKeyboard([
        [
          { text: "✅ قبول", callbackData: `accept:${offer.rideId}` },
          { text: "❌ رفض", callbackData: `reject:${offer.rideId}` },
        ],
      ]),
    });
  }

  async handleRideAccepted(chatId: number, rideId: string, pickup: { lat: number; lng: number; label?: string }) {
    await this.bot.sendMessage({
      chatId,
      text: "✅ <b>تم قبول المشوار!</b>\nتوجه إلى موقع الانطلاق:",
      replyMarkup: inlineKeyboard([
        [{ text: "📍 وصلت", callbackData: `arrived:${rideId}` }],
        [{ text: "▶️ بدء المشوار", callbackData: `start:${rideId}` }],
        [{ text: "🏁 إنهاء", callbackData: `finish:${rideId}` }],
      ]),
    });
  }

  async handleSubscriptionInfo(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: [
        "💰 <b>باقات الاشتراك</b>",
        "",
        "🚕 <b>مشاوير فقط</b> — 250 ريال/شهر",
        "📦 <b>توصيل فقط</b> — 250 ريال/شهر",
        "🔄 <b>الخدمتان</b> — 400 ريال/شهر",
        "",
        "🎁 أول شهر مجاني!",
        "",
        "المميزات:",
        "✅ استقبال طلبات غير محدود",
        "✅ 0% عمولة — 100% من أرباحك",
        "✅ أولوية في التوزيع",
        "✅ إحصائيات متقدمة",
      ].join("\n"),
      replyMarkup: inlineKeyboard([
        [{ text: "📩 طلب اشتراك", callbackData: "request_subscription" }],
      ]),
    });
  }

  async handleToggleAvailability(chatId: number, newStatus: boolean) {
    const msg = newStatus
      ? "🟢 أنت الآن <b>متاح</b> لاستقبال الطلبات."
      : "🔴 أنت الآن <b>غير متاح</b>. لن تصلك طلبات جديدة.";
    await this.bot.sendMessage({ chatId, text: msg });
  }

  async handleLocationRequest(chatId: number) {
    await this.bot.sendMessage({
      chatId,
      text: "📍 أرسل موقعك الحالي:",
      replyMarkup: replyKeyboard([
        [{ text: "📍 إرسال الموقع", requestLocation: true }],
      ]),
    });
  }
}