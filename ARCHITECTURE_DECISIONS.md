# Architecture Decisions — وُصلة

## ADR-001: Telegram as Primary Interface

**القرار:** استخدام تيليجرام كواجهة أساسية للعميل والسائق والتاجر والمؤسسة.

**السبب:** انتشار واسع في السوق السعودي والخليجي، لا حاجة لتثبيت تطبيق إضافي، إشعارات فورية مدمجة، تكلفة تطوير أقل.

**البدائل:** تطبيق جوال (React Native)، PWA.

**سبب عدم الاختيار:** تكلفة تطوير أعلى، حاجة للتوزيع عبر المتاجر، وقت أطول للوصول للسوق.

---

## ADR-002: Hybrid Architecture (Modular Monolith + Microservices)

**القرار:** اعتماد نموذج هجين — Modular Monolith للخدمات الأساسية، Microservices للخدمات الحرجة.

**السبب:** تقليل التعقيد التشغيلي المبكر مع الاحتفاظ بقابلية التوسع. كل موديول داخل الـ Monolith له حدود واضحة (Bounded Context) تسمح باستخراجه كخدمة مستقلة لاحقاً.

**البدائل:** Microservices كاملة من اليوم الأول، Monolith كامل.

**سبب عدم الاختيار:** Microservices كاملة تزيد التعقيد التشغيلي بدون دليل حاجة. Monolith كامل يحد من قابلية التوسع للخدمات الحرجة.

---

## ADR-003: Supabase PostgreSQL as Database

**القرار:** PostgreSQL (Supabase) كمخزن بيانات رئيسي مع Drizzle ORM للـ migrations.

**السبب:** Row-Level Security، Atomic Transactions (ضرورية لـ double-accept prevention)، Auth + Realtime مدمجة، PostgreSQL Row Locking.

**البدائل:** MongoDB، PlanetScale MySQL، SQLite.

**سبب عدم الاختيار:** PostgreSQL أفضل للـ transactions الذرية المطلوبة لمنع double-accept.

---

## ADR-004: Atomic SQL RPCs for Critical Operations

**القرار:** استخدام Stored Procedures/RPCs في PostgreSQL مع row-level locking للعمليات الحرجة.

**العمليات:** `claim_ride()`، `transition_ride()`، `expire_stale_rides()`.

**السبب:** منع race conditions في قبول الطلبات (double-accept). التطبيق متعدد الـ instances، والـ locking على مستوى DB هو الضمان الوحيد.

---

## ADR-005: Subscription Model (Zero Commission)

**القرار:** نموذج اشتراك ثابت كمصدر دخل رئيسي — 0% عمولة على الطلبات.

**الأسعار:**
- مشاوير فقط: 250 ريال/شهر
- توصيل فقط: 250 ريال/شهر
- الخدمتان: 400 ريال/شهر
- أول شهر مجاني

**السبب:** زيادة رضا السائقين، تقليل معدل الدوران، تمييز تنافسي عن Careem/Jahez.

---

## ADR-006: Dual Service Type (Ride + Delivery)

**القرار:** نوعان أساسيان للخدمة: `ride` (مشوار) و `delivery` (توصيل) — كلاهما في نفس جدول الطلبات.

**السبب:** نفس دورة الحياة، نفس محرك التوزيع، نفس قفل الإسناد. `service_type` كـ enum في جميع الجداول.

---

## ADR-007: Event-Driven Architecture

**القرار:** نشر كل تغيير جوهري كحدث (Domain Event) عبر ناقل أحداث.

**الأحداث:** `RideRequested`, `RideMatched`, `RideCompleted`, `DriverSubscribed`, `EmergencyRaised`.

**السبب:** فصل الخدمات، معالجة غير متزامنة، قابلية التوسع، سجل تدقيق.

---

## ADR-008: Clean Architecture (DDD)

**القرار:** فصل الكود إلى 3 طبقات: Domain (نطاق الأعمال)، Application (حالات الاستخدام)، Infrastructure (التكاملات).

**السبب:** قابلية الصيانة، قابلية الاختبار، فصل المسؤوليات، استقلالية نطاق الأعمال.

**الهيكل:**
```
packages/
  domain/      — Entities, Value Objects, FSM, Ports
  application/ — Use Cases, Input/Output, Errors
  infrastructure/ — Supabase, Telegram, Redis, Payment
  shared/      — Kernel, Result, Primitives, Events
```

---

## ADR-009: Active Request Lock (One Active Ride Per Driver)

**القرار:** `active_ride_id` كـ unique index على جدول drivers.

**السبب:** منع سائق من استقبال طلبين في نفس الوقت. القفل يُضبط ذرياً عند القبول ويُفرغ عند الإكمال أو الإلغاء.

---

## ADR-010: Unified Job Model

**القرار:** نموذج كتابة واحد (`rides`) لجميع أنواع الخدمات مع VIEWs للقراءة.

**السبب:** نفس دورة الحياة، نفس منطق التوزيع، نفس آلة الحالة. تجنب تكرار المنطق.

---

## ADR-011: Idempotency First

**القرار:** جميع الـ webhooks والعمليات الحرجة تمر عبر idempotency keys.

**السبب:** منع العمليات المكررة بسبب إعادة إرسال تيليجرام أو فشل الشبكة.

---

## ADR-012: Security Hardening

**القرار:** HMAC على الـ webhooks، التحقق من IP تيليجرام، Rate Limiting، تشفير الحقول الحساسة.

**السبب:** حماية البوتات من الهجمات، منع إساءة الاستخدام، الامتثال لـ PDPL.

---

## ADR-013: 14-Bot Ecosystem

**القرار:** 14 بوتاً متخصصاً لكل طرف وفئة.

**السبب:** فصل المسؤوليات، تجربة مستخدم مخصصة لكل طرف، قابلية التوسع.

**قابلة للإضافة:** بوتات إضافية حسب الحاجة دون تغيير النواة.

---

## ADR-014: Polyglot Persistence

**القرار:** استخدام قواعد بيانات متعددة حسب طبيعة كل خدمة.

- PostgreSQL (Supabase): البيانات العلائقية
- Redis Cluster: كاش، مواقع لحظية، جلسات
- Elasticsearch: بحث المنتجات والمتاجر
- TimescaleDB: سجل المواقع التاريخي (مستقبلاً)

---

## ADR-015: No Secrets in Repository

**القرار:** كل بيانات الاعتماد من متغيرات بيئة. `.env.example` كمرجع أسماء فقط.

**السبب:** الأمان. فحص أسرار آلي في CI يمنع أي commit يحمل توكن.