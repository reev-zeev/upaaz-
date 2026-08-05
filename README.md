# وُصلة — Waslah Platform

> **المنصة اللوجستية الذكية** — منصة تشغيل لوجستي عالمي عبر تيليجرام، تربط الأفراد والسائقين والمتاجر والمؤسسات في منظومة واحدة.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)
[![Telegram](https://img.shields.io/badge/Interface-Telegram-blue)](https://telegram.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌟 الرؤية

منصة لوجستية عالمية تعمل كوسيط ذكي وشامل، تُغني جميع الأطراف (أفراد، سائقين، متاجر، مطاعم، موردين، مخازن، مؤسسات، سلاسل تجارية، شركات كبرى، جهات حكومية) عن الاعتماد على الشركات اللوجستية التقليدية المنعزلة.

**الهدف:** تمكين أي جهة من إدارة كامل عملياتها اللوجستية — توصيل، مشاوير، حجوزات، شحن، إدارة أسطول — من خلال منصة واحدة، بتجربة مستخدم عربية سلسة، وبنية قادرة على خدمة أكثر من **مليار مستخدم**.

---

## ✨ الميزات الرئيسية

### للمستخدمين (الركاب)
- 🚖 **طلب مشوار** — من نقطة إلى نقطة مع تحديد السعر
- 📦 **طلب توصيل** — توصيل طرود، أغراض، طلبات
- 🏪 **السوق المفتوح** — شراء منتجات من المتاجر والأفراد
- 📍 **تتبع مباشر** — تتبع السائق على الخريطة لحظياً
- 💳 **دفع مرن** — كاش، تحويل، محفظة، STC Pay، مدى
- ⭐ **تقييم** — تقييم السائقين والمتاجر
- 🚨 **طوارئ SOS** — زر طوارئ مباشر

### للسائقين
- 💰 **0% عمولة** — احتفظ بـ 100% من أرباحك
- 📅 **اشتراك شهري** — باقات مرنة (250-400 ريال)
- 🎁 **شهر مجاني** — أول شهر مجاني بالكامل
- 🗺️ **ملاحة ذكية** — توجيه إلى موقع العميل
- 📊 **إحصائيات** — متابعة أرباحك وأدائك
- 🔒 **خصوصية** — تواصل عبر البوت بدون كشف الرقم

### للمتاجر والمؤسسات
- 🏬 **كتالوج منتجات** — إدارة المنتجات والطلبات
- 👥 **صلاحيات متعددة** — إدارة فريق العمل
- 🚛 **أسطول خاص** — إدارة سائقيك الخاصين
- 📈 **تقارير** — تحليلات مبيعات وأداء
- 🔗 **API** — تكامل مع أنظمة POS/ERP

---

## 🧩 البنية المعمارية

```
وُصلة Platform
├── 📱 Telegram Bots (14 bots)
│   ├── 🤖 Rider Bot       — بوت العميل
│   ├── 🤖 Driver Bot      — بوت السائق
│   ├── 🤖 Merchant Bot    — بوت التاجر
│   ├── 🤖 Enterprise Bot  — بوت المؤسسة
│   ├── 🤖 Fleet Bot       — بوت الأسطول
│   ├── 🤖 Admin Bot       — بوت الإدارة العليا
│   ├── 🤖 Support Bot     — بوت الدعم
│   ├── 🤖 Dispatcher Bot  — بوت المرسل
│   ├── 🤖 Supervisor Bot  — بوت المشرف
│   ├── 🤖 Operations Bot  — بوت العمليات
│   ├── 🤖 Analytics Bot   — بوت التحليلات
│   ├── 🤖 Shipping Bot    — بوت الشحن
│   ├── 🤖 Marketplace Bot — بوت السوق المفتوح
│   └── 🤖 Delegate Bot    — بوت المندوبين
│
├── 🖥️ Admin Dashboard     — لوحة تحكم إدارية
├── 🔧 API Server          — خادم API
├── 🗄️ Database            — PostgreSQL (Supabase)
├�── 📦 Core Packages
│   ├── domain/            — نطاق الأعمال (DDD)
│   ├── application/       — حالات الاستخدام
│   └── infrastructure/    — تكاملات البنية التحتية
└── 📚 Documentation
    ├── docs/architecture/ — وثائق معمارية
    ├── docs/api/          — توثيق API
    └── docs/operations/   — توثيق تشغيلي
```

### النمط المعماري: **هجين (Hybrid)**
- **Modular Monolith** للخدمات الأساسية (المستخدمين، الكتالوج)
- **Microservices** للخدمات الحرجة (التوزيع، الدفع، الإشعارات)
- **Event-Driven** عبر ناقل أحداث (Kafka/NATS)
- **Polyglot Persistence** — PostgreSQL, Redis, Elasticsearch

---

## 🛠️ التقنيات

| الطبقة | التقنية |
|--------|---------|
| **الواجهة الأساسية** | Telegram Bot API |
| **لغة البرمجة** | TypeScript 5.8 |
| **وقت التشغيل** | Bun |
| **قاعدة البيانات** | Supabase PostgreSQL + Row-Level Security |
| **التخزين المؤقت** | Redis Cluster |
| **البحث** | Elasticsearch |
| **الخرائط** | Mapbox / Google Maps / OSRM |
| **الذكاء الاصطناعي** | Lovable AI Gateway (OpenAI-compatible) |
| **بوابات الدفع** | سداد، مدى، STC Pay، Stripe، Apple Pay |
| **CI/CD** | GitHub Actions |
| **المراقبة** | Prometheus + Grafana |

---

## 🚀 البدء السريع

### المتطلبات
- Bun 1.2+
- Supabase project
- Telegram bots from @BotFather

### التثبيت

```bash
# Clone the repository
git clone https://github.com/reev-zeev/waslah-platform.git
cd waslah-platform

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Install dependencies
bun install

# Push database schema
cd supabase
supabase db push
cd ..

# Run the API server
bun run dev:api

# Run the admin dashboard
bun run dev:admin

# Run telegram bots
bun run dev:bots
```

### إعداد بوتات تيليجرام
1. افتح @BotFather في تيليجرام
2. أنشئ البوتات المطلوبة (عميل، سائق، تاجر، ...)
3. أضف التوكنات إلى ملف `.env`
4. سجل الـ Webhooks عبر لوحة الإدارة

---

## 📊 هيكل قاعدة البيانات

- **17 جدولاً** رئيسياً: users, drivers, riders, rides, ride_offers, subscriptions, ratings, emergency_alerts, support_tickets, audit_log, merchants, products, notifications, driver_location_history, idempotency_keys, telegram_processed_updates
- **Row-Level Security** على جميع الجداول
- **Atomic RPCs** لعمليات القبول والتعيين
- **Full-Text Search** على المنتجات والمتاجر

---

## 📚 التوثيق

- [`ARCHITECTURE_DECISIONS.md`](./docs/architecture/ARCHITECTURE_DECISIONS.md) — القرارات المعمارية
- [`docs/architecture/`](./docs/architecture/) — وثائق معمارية مفصلة
- [`docs/api/`](./docs/api/) — توثيق API
- [`docs/operations/`](./docs/operations/) — توثيق تشغيلي

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى قراءة إرشادات المساهمة قبل تقديم Pull Request.

---

## 📄 الترخيص

MIT License — راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 🏗️ حالة المشروع

```
🚧 Phase 1 — Core Operational Base (قيد التطوير)
🚧 Phase 2 — Functional Expansion (قادم)
🚧 Phase 3 — AI & Maturity (قادم)
🚧 Phase 4 — Global Leadership (قادم)
```

---

<div align="center">
  <sub>بنيت بـ ❤️ في المملكة العربية السعودية</sub>
</div>