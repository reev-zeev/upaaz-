# تقرير استخلاص المشاريع السابقة — وُصلة

> هذا التقرير يوثّق تحليل 7 مشاريع سابقة واستخلاص أفضل ما فيها لبناء منصة "وُصلة".

---

## المشاريع المُحلّلة

### 1. ODD_a-trip (حجازي) — Python
- **النضج:** Prototype
- **الإسهام:** 💡 **النموذج التجاري الأساسي** — اشتراك شهري، 0% عمولة، خصوصية التواصل
- **ما أُخذ:** نموذج العمل، زر SOS، المفضلة، خيار الخصوصية
- **ما تُرك:** Python (استُبدل بـ TypeScript)، الهيكل الإجرائي

### 2. tooru — TypeScript Monorepo
- **النضج:** MVP
- **الإسهام:** 💡 **Atomic SQL RPCs + OpenAPI Codegen**
- **ما أُخذ:** `claim_ride` RPC، ADRs، Drizzle ORM schema، OpenAPI spec
- **ما تُرك:** Express 5 (استُبدل بـ TanStack Start)

### 3. Nona-main — TypeScript TanStack Start ⭐
- **النضج:** **MVP+ (الأكثر نضجاً)**
- **الإسهام:** 💡 **Clean Architecture كامل + State Machine + Admin Dashboard**
- **ما أُخذ:** 90% من هيكل Clean Architecture، FSM، Dispatcher، Pricing، Geo، Audit، Security
- **ما تُرك:** الـ monorepo الزائد (12 app)، الملفات اليتيمة

### 4. product-genesis — TypeScript TanStack Start
- **النضج:** Architecture Blueprint
- **الإسهام:** 💡 **FSM نظيف + Result Pattern + Audit System**
- **ما أُخذ:** FSM design، Result type، dispatch sweep
- **ما تُرك:** الكود غير المكتمل

### 5. vees-main-1 — TypeScript Bun (Vees)
- **النضج:** **Production-ready Design ⭐**
- **الإسهام:** 💡 **15 ADR + Bounded Context Map + Delivery Design**
- **ما أُخذ:** ADRs، Bounded Contexts، delivery module، subscription pricing
- **ما تُرك:** الـ apps غير المكتملة (سكيلتونات)

### 6. vees-main-2 — PHP 8.3 Laravel
- **النضج:** Library kernel
- **الإسهام:** 💡 **CQRS + Command Bus + Domain Events**
- **ما أُخذ:** المفاهيم المعمارية (DDD, CQRS)
- **ما تُرك:** PHP بالكامل (لغة مختلفة)

### 7. swift-telegram-ride — TypeScript TanStack Start
- **النضج:** Early MVP
- **الإسهام:** 💡 **Security Primitives** (HMAC, OTP, Rate Limiting, Field Encryption)
- **ما أُخذ:** HMAC، OTP policy، rate limiter، IP allowlist
- **ما تُرك:** البنية غير المكتملة

---

## ما تم دمجه في وُصلة

| من المشروع | المكونات المأخوذة |
|-----------|------------------|
| ODD_a-trip | نموذج الاشتراك، 0% عمولة، خيار الخصوصية، SOS، المفضلة |
| tooru | Atomic `claim_ride` RPC، نظام الاشتراكات (250/250/400) |
| **Nona-main** | **Clean Architecture، FSM، Dispatcher، Admin Dashboard، Pricing، Audit** |
| product-genesis | FSM نظيف، Result Pattern |
| **vees-main-1** | **ADRs، Bounded Contexts، Delivery Design، 3-tier Multi-Tenancy** |
| vees-main-2 | مفاهيم DDD/CQRS |
| swift-telegram-ride | HMAC، OTP Policy، Rate Limiting |

---

## ما أُعيد بناؤه بالكامل

1. **نظام الـ 14 بوتاً** — من 2-3 بوتات في المشاريع السابقة إلى 14 بوتاً متكاملاً
2. **نظام الاشتراكات الموسّع** — من خطط السائقين فقط إلى 6 باقات (سائقين + متاجر + مؤسسات)
3. **قاعدة البيانات الموحّدة** — 20+ جدول مع RLS من أول يوم
4. **نظام الدفع المتعدد** — دعم 7 بوابات دفع محلية ودولية
5. **نظام Multi-Tenancy** — 3 نماذج عزل (Pool/Bridge/Silo)

---

## ما لم يُنقل من أي مشروع

1. **Python bots** (ODD) — أُعيد بناؤها بـ TypeScript
2. **PHP kernel** (Vees-2) — لغة مختلفة
3. **Over-engineered engines** (Manus concepts) — مؤجلة لمراحل لاحقة
4. **الفوضى والديون التقنية** — لا كود نُقل دون مراجعة
5. **الأسرار** — محفوظة في متغيرات البيئة فقط

---

## مقارنة وُصلة بالمشاريع السابقة

| المعيار | أفضل مشروع سابق | وُصلة |
|---------|----------------|-------|
| نطاق البوتات | 3 بوتات | **14 بوتاً** |
| أنواع الخدمة | 2 (ride + delivery) | **6 أنواع** (+ courier, shuttle, corporate, government) |
| نماذج الاشتراك | 4 خطط سائقين | **6 باقات** (سائقين + متاجر + مؤسسات) |
| ADRs موثقة | 15 (vees) | **15 ADR** |
| جداول SQL | 27 (Nona) | **20+ جدول** مع RLS |
| Atomic RPCs | 1 (tooru) | **4 دوال** (claim, nearby, expire, transition) |
| بوابات الدفع | 0 | **7 بوابات** |
| Multi-Tenancy | لا يوجد | **3 نماذج** |
| Clean Architecture | جزئي (Nona) | **كامل** (Domain → App → Infra) |
| Event Bus | InMemory (Nona) | **قابل للتبديل** (InMemory → Kafka/NATS) |

---

> **الخلاصة:** وُصلة تمثل التطور الطبيعي لسنوات من التجارب الهندسية. كل مشروع سابق ساهم بجزء في تكوين الرؤية النهائية.