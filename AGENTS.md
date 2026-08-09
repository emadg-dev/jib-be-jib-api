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
│   └── errorHandler.ts   # Global error handler
├── routes/               # One file per feature (auth, trip, members, deposits, withdrawals, dashboard, profile, docs)
├── services/             # AuthService, TripService, MemberService, DepositService, WithdrawalService, DashboardService
├── repositories/         # D1 query layer (one per entity)
├── validators/index.ts   # All Zod schemas
├── utils/
│   ├── response.ts       # successResponse / errorResponse helpers
│   ├── password.ts       # PBKDF2 via WebCrypto (not bcrypt)
│   └── settlement.ts     # Debt simplification algorithm
└── db/
    ├── schema.sql        # Full DDL
    ├── seed.sql          # Seed data
    └── migrations/       # 3 migrations (initial, member_trips, date_columns)
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `Trips` | Trip definitions (name, currency) |
| `Members` | User accounts (name, password_hash, role, display_name) |
| `MemberTrips` | Many-to-many membership (authoritative) |
| `Deposits` | Money deposits per member |
| `Withdrawals` | Expenses (amount, category, description) |
| `WithdrawalMembers` | Per-member share of each withdrawal |

## Auth Flow

1. Login with name + password → JWT in HttpOnly cookie
2. JWT contains: `id, name, display_name, role, trip_id, exp` (7 days)
3. Multi-trip: login returns `requires_trip_selection: true` if user has >1 trip → client calls `/trip/select`
4. Middleware chain: `authMiddleware` → `requireActiveTrip` → `requireOwner`

Roles: `owner` (full CRUD) | `member` (read + create withdrawals)

## API Routes

All prefixed `/api`. See `src/routes/docs.ts` for full OpenAPI spec.

| Group | Endpoints | Owner-only |
|-------|-----------|-----------|
| auth | POST /login, /logout, GET /me, POST /setup | No |
| trip | GET /available, POST /select, GET/POST/PUT/DELETE | POST/PUT/DELETE |
| members | GET, GET /:id, POST, POST /add, PUT /:id, DELETE /:id | POST/PUT/DELETE |
| deposits | GET, POST, PUT /:id, DELETE /:id | All writes |
| withdrawals | GET, POST, PUT /:id, DELETE /:id | POST (any member), PUT/DELETE (owner) |
| dashboard | GET | No |
| profile | GET, PUT /password | No |

## Key Patterns

- **Trip-scoped multi-tenancy**: all financial data scoped to `trip_id` in JWT
- **Constructor-based DI**: services receive repos; repos receive D1 handle
- **Zod validation**: schemas in `src/validators/index.ts`, used via `zValidator` middleware
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
