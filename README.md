<div align="center">

# 🏦 Jib-be-Jib API

### Collaborative Trip Expense Tracker — Backend

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![Hono](https://img.shields.io/badge/Hono-v4.2.7-black?logo=hono)
![D1](https://img.shields.io/badge/D1-SQLite-blue?logo=sqlite)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)

</div>

---

<div align="center">

| [English](#english) | [فارسی](#persian) |
|:---:|:---:|

</div>

---

<div id="english">

## 🚀 Quick Start

```bash
npm install
npx wrangler d1 execute jib-be-jib-db --local --file=src/db/schema.sql
npx wrangler d1 execute jib-be-jib-db --local --file=src/db/seed.sql
npx wrangler dev
```

API runs at `http://localhost:8787/api`

---

## 📁 Project Structure

```
src/
├── index.ts                  # Hono app, mounts all routes under /api
├── types/env.ts              # Env & AuthenticatedUser interfaces
├── config/
│   └── permissions.ts        # Permission registry (29 permissions, 9 groups)
├── middleware/
│   ├── auth.ts               # JWT auth, trip validation
│   ├── permission.ts         # Fine-grained RBAC middleware
│   └── errorHandler.ts       # Global error handler
├── routes/                   # One file per feature
├── services/                 # Business logic layer
├── repositories/             # D1 query layer
├── utils/
│   ├── response.ts           # successResponse / errorResponse
│   ├── password.ts           # PBKDF2 via WebCrypto
│   └── settlement.ts         # Debt simplification algorithm
└── db/
    ├── schema.sql            # Full DDL
    ├── seed.sql              # Seed data
    └── migrations/           # 12 migrations
```

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `Trips` | Trip definitions (name, currency) |
| `Members` | User accounts (name, password_hash, role, display_name) |
| `MemberTrips` | Many-to-many membership with per-trip role |
| `Deposits` | Money deposits per member |
| `Withdrawals` | Expenses (amount, category, description) |
| `WithdrawalMembers` | Per-member share of each withdrawal |
| `TripSettings` | Telegram notification config |
| `TripRatings` | Member ratings (ethics, participation, flexibility) |
| `TripRoles` | Custom roles per trip |
| `TripRolePermissions` | Permissions assigned to custom roles |
| `TripMemberPermissions` | Per-member permission overrides |

---

## 🔐 Permissions System

### Resolution Chain

```
admin       → all permissions (global bypass)
owner       → all permissions within trip (with membership check)
member      → custom role permissions → member defaults → explicit overrides
overrides   → explicit allow/deny per member (deny wins)
```

| Group | Permissions |
|-------|-------------|
| trip | create, update, delete |
| member | create, update, delete, view |
| deposit | create, update, delete, view |
| withdrawal | create, update, delete, view |
| settlement | create, update, delete, view |
| ratings | view, submit, update, delete |
| notifications | manage, send |
| settings | manage |
| permissions | manage |
| roles | manage |

---

## 🛣️ API Endpoints

All endpoints prefixed with `/api`. Auth via JWT in HttpOnly cookies.

### Auth & Trip
| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/auth/login` | — |
| POST | `/auth/logout` | — |
| GET | `/auth/me` | — |
| GET | `/trip/available` | — |
| POST | `/trip/select` | — |
| GET | `/trip` | — |
| POST | `/trip` | `trip.create` |
| PUT | `/trip/:id` | `trip.update` |
| DELETE | `/trip/delete/:id` | `trip.delete` |

### Members & Deposits
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/members` | `member.view` |
| POST | `/members` | `member.create` |
| PUT | `/members/:id` | `member.update` |
| DELETE | `/members/:id` | `member.delete` |
| GET | `/deposits` | `deposit.view` |
| POST | `/deposits` | `deposit.create` |
| PUT | `/deposits/:id` | `deposit.update` |
| DELETE | `/deposits/:id` | `deposit.delete` |

### Withdrawals & Settlements
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/withdrawals` | `withdrawal.view` |
| POST | `/withdrawals` | `withdrawal.create` |
| PUT | `/withdrawals/:id` | `withdrawal.update` |
| DELETE | `/withdrawals/:id` | `withdrawal.delete` |
| GET | `/settlements` | `settlement.view` |
| POST | `/settlements` | `settlement.create` |
| PUT | `/settlements/:id` | `settlement.update` |
| DELETE | `/settlements/:id` | `settlement.delete` |

### Ratings & Notifications
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/ratings/ratees` | `ratings.view` |
| POST | `/ratings` | `ratings.submit` |
| GET | `/ratings/results` | `ratings.view` |
| PUT | `/ratings/:id` | `ratings.update` |
| DELETE | `/ratings/:id` | `ratings.delete` |
| GET | `/notifications/settings` | `notifications.manage` |
| PUT | `/notifications/settings` | `notifications.manage` |
| POST | `/notifications/telegram/test` | `notifications.send` |

### Permissions & Roles
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/permissions` | `permissions.manage` |
| GET | `/permissions/registry` | — |
| GET | `/permissions/:memberId` | `permissions.manage` |
| PUT | `/permissions/:memberId` | `permissions.manage` |
| PUT | `/permissions/:memberId/role` | `permissions.manage` |
| GET | `/roles` | `roles.manage` |
| POST | `/roles` | `roles.manage` |
| PUT | `/roles/:roleId` | `roles.manage` |
| DELETE | `/roles/:roleId` | `roles.manage` |

---

## 🚢 Deployment

```bash
npx wrangler deploy
npx wrangler d1 execute jib-be-jib-db --remote --file=src/db/migrations/0012_roles.sql
```

---

Made with ❤️ by Emzi and MiMo

</div>

---

<div id="persian" dir="rtl">

## 🚀 شروع سریع

```bash
npm install
npx wrangler d1 execute jib-be-jib-db --local --file=src/db/schema.sql
npx wrangler d1 execute jib-be-jib-db --local --file=src/db/seed.sql
npx wrangler dev
```

API روی `http://localhost:8787/api` اجرا می‌شود

---

## 📁 ساختار پروژه

```
src/
├── index.ts                  # اپلیکیشن Hono، مونت تمام مسیرها
├── types/env.ts              # اینترفیس‌های Env و AuthenticatedUser
├── config/
│   └── permissions.ts        # رجیستری دسترسی‌ها (۲۹ دسترسی، ۹ گروه)
├── middleware/
│   ├── auth.ts               # احراز هویت JWT، اعتبارسنجی سفر
│   ├── permission.ts         # مiddleware RBAC دقیق
│   └── errorHandler.ts       # مدیریت خطا
├── routes/                   # یک فایل برای هر قابلیت
├── services/                 # لایه منطق کسب‌وکار
├── repositories/             # لایه کوئری D1
├── utils/
│   ├── response.ts           # successResponse / errorResponse
│   ├── password.ts           # PBKDF2 با WebCrypto
│   └── settlement.ts         # الگوریتم ساده‌سازی بدهی
└── db/
    ├── schema.sql            # DDL کامل
    ├── seed.sql              # داده‌های نمونه
    └── migrations/           # ۱۲ مایگریشن
```

---

## 🗄️ ساختار پایگاه داده

| جدول | هدف |
|------|-----|
| `Trips` | تعریف سفرها (نام، واحد پول) |
| `Members` | حساب‌های کاربری |
| `MemberTrips` | عضویت چند-به-چند با نقش هر سفر |
| `Deposits` | واریزی‌های هر عضو |
| `Withdrawals` | هزینه‌ها |
| `WithdrawalMembers` | سهم هر عضو از هر هزینه |
| `TripSettings` | تنظیمات اعلان تلگرام |
| `TripRatings` | ارزیابی اعضا |
| `TripRoles` | نقش‌های سفارشی هر سفر |
| `TripRolePermissions` | دسترسی‌های اختصاص داده شده به هر نقش |
| `TripMemberPermissions` | تغییرات دسترسی هر عضو |

---

## 🔐 سیستم دسترسی‌ها

### زنجیره رزولوشن

```
admin       → تمام دسترسی‌ها (بای‌پس سراسری)
owner       → تمام دسترسی‌ها در سفر (با بررسی عضویت)
member      → نقش سفارشی → پیش‌فرض عضو → تغییرات صریح
overrides   → allow/deny صریح (deny برنده می‌شود)
```

| گروه | دسترسی‌ها |
|------|----------|
| سفر | ایجاد، ویرایش، حذف |
| عضو | ایجاد، ویرایش، حذف، مشاهده |
| واریز | ایجاد، ویرایش، حذف، مشاهده |
| هزینه | ایجاد، ویرایش، حذف، مشاهده |
| تسویه | ایجاد، ویرایش، حذف، مشاهده |
| ارزیابی | مشاهده، ثبت، ویرایش، حذف |
| اعلان | مدیریت، ارسال |
| تنظیمات | مدیریت |
| دسترسی‌ها | مدیریت |
| نقش‌ها | مدیریت |

---

## 🛣️ اندپوینت‌های API

تمام اندپوینت‌ها با `/api` پیشوند دارند. احراز هویت از طریق JWT در کوکی‌های HttpOnly.

### احراز هویت و سفر
| متد | اندپوینت | دسترسی |
|-----|----------|--------|
| POST | `/auth/login` | — |
| POST | `/auth/logout` | — |
| GET | `/auth/me` | — |
| GET | `/trip/available` | — |
| POST | `/trip/select` | — |
| GET | `/trip` | — |
| POST | `/trip` | `trip.create` |
| PUT | `/trip/:id` | `trip.update` |
| DELETE | `/trip/delete/:id` | `trip.delete` |

### اعضا و واریزها
| متد | اندپوینت | دسترسی |
|-----|----------|--------|
| GET | `/members` | `member.view` |
| POST | `/members` | `member.create` |
| PUT | `/members/:id` | `member.update` |
| DELETE | `/members/:id` | `member.delete` |
| GET | `/deposits` | `deposit.view` |
| POST | `/deposits` | `deposit.create` |
| PUT | `/deposits/:id` | `deposit.update` |
| DELETE | `/deposits/:id` | `deposit.delete` |

### هزینه‌ها و تسویه‌ها
| متد | اندپوینت | دسترسی |
|-----|----------|--------|
| GET | `/withdrawals` | `withdrawal.view` |
| POST | `/withdrawals` | `withdrawal.create` |
| PUT | `/withdrawals/:id` | `withdrawal.update` |
| DELETE | `/withdrawals/:id` | `withdrawal.delete` |
| GET | `/settlements` | `settlement.view` |
| POST | `/settlements` | `settlement.create` |
| PUT | `/settlements/:id` | `settlement.update` |
| DELETE | `/settlements/:id` | `settlement.delete` |

### ارزیابی و اعلان
| متد | اندپوینت | دسترسی |
|-----|----------|--------|
| GET | `/ratings/ratees` | `ratings.view` |
| POST | `/ratings` | `ratings.submit` |
| GET | `/ratings/results` | `ratings.view` |
| PUT | `/ratings/:id` | `ratings.update` |
| DELETE | `/ratings/:id` | `ratings.delete` |
| GET | `/notifications/settings` | `notifications.manage` |
| PUT | `/notifications/settings` | `notifications.manage` |
| POST | `/notifications/telegram/test` | `notifications.send` |

### دسترسی‌ها و نقش‌ها
| متد | اندپوینت | دسترسی |
|-----|----------|--------|
| GET | `/permissions` | `permissions.manage` |
| GET | `/permissions/registry` | — |
| GET | `/permissions/:memberId` | `permissions.manage` |
| PUT | `/permissions/:memberId` | `permissions.manage` |
| PUT | `/permissions/:memberId/role` | `permissions.manage` |
| GET | `/roles` | `roles.manage` |
| POST | `/roles` | `roles.manage` |
| PUT | `/roles/:roleId` | `roles.manage` |
| DELETE | `/roles/:roleId` | `roles.manage` |

---

## 🚢 استقرار

```bash
npx wrangler deploy
npx wrangler d1 execute jib-be-jib-db --remote --file=src/db/migrations/0012_roles.sql
```

---

با ❤️ ساخته شده توسط Emzi و MiMo

</div>
