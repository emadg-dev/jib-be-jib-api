# Jib-be-Jib API

Collaborative trip expense tracker backend. Cloudflare Workers + Hono + D1.

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Cloudflare Workers |
| Framework | Hono v4.2.7 |
| Database | Cloudflare D1 (SQLite, no ORM, raw SQL) |
| Validation | Zod + @hono/zod-validator |
| Auth | JWT (HS256) in HttpOnly cookies |
| Docs | OpenAPI 3.1 + Scalar UI |
| Testing | Vitest (Workers pool) |
| Deploy | `npx wrangler deploy` |

## Commands

| Command | Purpose |
|---------|---------|
| `npx wrangler dev` | Dev server on port 8787 |
| `npx wrangler deploy` | Deploy to Cloudflare |
| `npx wrangler types` | Regenerate worker-configuration.d.ts after binding changes |
| `npx wrangler d1 execute jib-be-jib-db --file=src/db/seed.sql` | Seed database |
| `npx vitest run` | Run tests |

## Architecture

Layered: **Routes → Services → Repositories → D1**

```
src/
├── index.ts              # Hono app, mounts all route groups under /api
├── types/env.ts          # Env, AuthenticatedUser interfaces
├── middleware/
│   ├── auth.ts           # authMiddleware, requireActiveTrip, requireOwner
│   ├── permission.ts     # requirePermission (fine-grained RBAC)
│   └── errorHandler.ts   # Global error handler
├── config/
│   └── permissions.ts    # Permission registry, role defaults, validation
├── routes/               # One file per feature
├── services/             # Business logic layer
├── repositories/         # D1 query layer (one per entity)
├── utils/
│   ├── response.ts       # successResponse / errorResponse helpers
│   ├── password.ts       # PBKDF2 via WebCrypto (not bcrypt)
│   └── settlement.ts     # Debt simplification algorithm
└── db/
    ├── schema.sql        # Full DDL
    ├── seed.sql          # Seed data
    └── migrations/       # 12 migrations (initial through roles)
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `Trips` | Trip definitions (name, currency) |
| `Members` | User accounts (name, password_hash, role, display_name) |
| `MemberTrips` | Many-to-many membership with per-trip role + custom_role_id |
| `Deposits` | Money deposits per member |
| `Withdrawals` | Expenses (amount, category, description) |
| `WithdrawalMembers` | Per-member share of each withdrawal |
| `TripSettings` | Telegram notification config per trip |
| `TripRatings` | Member ratings (ethics, participation, flexibility) |
| `TripMemberPermissions` | Per-member permission overrides (allow/deny) |
| `TripRoles` | Custom roles per trip |
| `TripRolePermissions` | Permissions assigned to each custom role |

## Permissions System

Fine-grained RBAC with 29 permissions across 9 groups:

- **admin**: Bypasses all permission checks
- **owner** (per-trip): Bypasses all permission checks within trip
- **member** (per-trip): Base permissions from `ROLE_DEFAULTS` or assigned custom role
- **Overrides**: Explicit `allow`/`deny` per member override role defaults (deny wins)

Permission resolution chain:
```
admin → all permissions
owner → all permissions (with trip membership check)
member → custom role permissions → member defaults → explicit deny/allow overrides
```

### Permission Groups

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

## Auth Flow

1. Login with name + password → JWT in HttpOnly cookie
2. JWT contains: `id, name, display_name, role, trip_id, exp` (7 days)
3. Multi-trip: login returns `requires_trip_selection: true` if user has >1 trip → client calls `/trip/select`
4. Middleware chain: `authMiddleware` → `requireActiveTrip` → `requirePermission`

## API Routes

All prefixed `/api`. See `src/routes/docs.ts` for full OpenAPI spec.

| Group | Endpoints | Required Permission |
|-------|-----------|-------------------|
| auth | POST /login, /logout, GET /me, POST /setup | None |
| trip | GET /available, POST /select, GET/POST/PUT/DELETE | trip.create/update/delete |
| members | GET, GET /:id, POST, POST /add, PUT /:id, DELETE /:id | member.create/update/delete |
| deposits | GET, POST, PUT /:id, DELETE /:id | deposit.create/update/delete |
| withdrawals | GET, POST, PUT /:id, DELETE /:id | withdrawal.create/update/delete |
| dashboard | GET | dashboard.view |
| ratings | GET /ratees, POST, GET /results, GET /status, GET /all, GET /mine, PUT /:id, DELETE /:id | ratings.submit/update/delete |
| settlements | GET, POST, PUT /:id, DELETE /:id | settlement.create/update/delete |
| notifications | GET /settings, PUT /settings, POST /test, POST /send, POST /members, POST /bank-stats, POST /settlements, POST /ratings | notifications.manage/send |
| permissions | GET /, GET /registry, GET /:memberId, PUT /:memberId, POST /:memberId/:permission, DELETE /:memberId/:permission, PUT /:memberId/role | permissions.manage |
| roles | GET /, GET /permissions, GET /:roleId, POST /, PUT /:roleId, DELETE /:roleId | roles.manage |

## Key Patterns

- **Trip-scoped multi-tenancy**: all financial data scoped to `trip_id` in JWT
- **Constructor-based DI**: services receive repos; repos receive D1 handle
- **Zod validation**: schemas in `src/validators/index.ts`, used via `zValidator` middleware
- **Permission middleware**: `requirePermission('permission.key')` checks RBAC chain
- **Settlement algorithm**: greedy debtor/creditor matching in `src/utils/settlement.ts`
- **Password hashing**: PBKDF2 via WebCrypto (100k iterations, SHA-256) — not bcrypt
- **Response format**: `{ success: true, data }` or `{ success: false, error: "message" }`
- **Bindings**: `DB` (D1Database), `JWT_SECRET` (string)

## Code Style

- Tabs for indentation, single quotes, semicolons
- 140 char line width
- Use `successResponse()` / `errorResponse()` from `src/utils/response.ts`
- D1 queries: `db.prepare(sql).bind(...).first()/.all()/.run()`
- Batch operations: `db.batch([stmt1, stmt2])`
