# System Architecture

## 1. Overview

This is a **multi-tenant SaaS-style QR Menu Management System**. A single deployment
can serve many restaurants (`Restaurant` is the tenant root), each with its own menu,
categories, promotions, branding, and admin users.

```
┌─────────────────┐        ┌───────────────────────────────┐        ┌──────────────┐
│  Customer phone  │  QR →  │        Next.js App             │  SQL  │  PostgreSQL  │
│  /menu/[slug]     │ ─────▶ │  App Router (RSC + API routes) │ ────▶ │  (Supabase/  │
│  (public, no      │        │                                 │       │   self-host) │
│   auth needed)     │        │  ┌───────────┐  ┌────────────┐ │        └──────────────┘
└─────────────────┘        │  │ Customer  │  │   Admin    │ │
                              │  │ Menu UI   │  │ Dashboard  │ │        ┌──────────────┐
                              │  │ (RSC)     │  │ (protected)│ │  ────▶ │ File storage │
                              │  └───────────┘  └────────────┘ │        │ (local disk /│
                              │  ┌────────────────────────────┐│        │  Supabase/S3)│
                              │  │ REST API routes (/api/*)   ││        └──────────────┘
                              │  │ NextAuth session guard      ││
                              │  └────────────────────────────┘│
                              └───────────────────────────────┘
```

## 2. Why this stack

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend + Backend | **Next.js 14 (App Router)** | One codebase for the public menu (Server Components, fast, SEO/QR-friendly) and the admin dashboard (Client Components), plus built-in API routes — no separate backend service needed for MVP, but the API layer is a clean REST boundary that could be extracted later. |
| Styling | **Tailwind CSS** | Rapid, consistent, mobile-first utility styling; theme color is CSS-variable driven so each restaurant can have a branded look without a rebuild. |
| ORM / DB | **Prisma + PostgreSQL** | Strong typing, safe migrations, and PostgreSQL is production-grade and Supabase-compatible — `DATABASE_URL` is the only thing that changes if you move from self-hosted Postgres to Supabase. |
| Auth | **NextAuth (Credentials provider) + bcrypt** | Session-based admin auth with JWT sessions, `middleware.ts` guards every `/admin/*` route server-side. Each `AdminUser` belongs to exactly one `Restaurant`, enforcing tenant isolation at the query layer. |
| File storage | **Local disk by default, swappable to Supabase Storage / S3** | Keeps the starter project dependency-free. The upload API's contract (`POST multipart/form-data` → `{ url }`) is storage-agnostic, so swapping the implementation is a single-file change (see DEPLOYMENT.md). |
| QR generation | **`qrcode` + `pdf-lib`**, generated server-side on demand | The QR always encodes `{BASE_URL}/menu/{slug}`, i.e. a **stable URL**, not a snapshot of the menu — so menu edits go live instantly without ever reprinting the QR code. |

## 3. Multi-tenancy model

- `Restaurant` is the tenant root. Every other business table (`Category`, `MenuItem`,
  `Promotion`, `QrCode`, `Branch`, `AdminUser`) has a `restaurantId` foreign key.
- Every API route resolves `restaurantId` from the authenticated session
  (`session.user.restaurantId`), **never from client input**, so one restaurant's
  admin can never read or mutate another restaurant's data.
- The public menu route is keyed by `slug`, not by ID, for clean URLs
  (`/menu/mama-kitchen`).

## 4. Data flow

**Customer path (no auth):**
`QR code → /menu/[slug] (Server Component) → Prisma query → render → client-side search/filter/category state`

The page uses **ISR (`revalidate = 30`)**: the very next request after any admin edit
regenerates the page, so changes appear within seconds without customers ever seeing
a stale cache, while still getting the speed benefit of static rendering between edits.

**Admin path (session-protected):**
`Admin login → NextAuth issues JWT session → middleware guards /admin/* → Client components call /api/* → Prisma mutates → UI re-fetches`

## 5. Folder structure

See `docs/` sibling files and the repository root; summarized:

```
src/
  app/
    menu/[restaurantSlug]/     # PUBLIC customer menu (Server + Client component pair)
    admin/                     # PROTECTED dashboard (layout enforces session)
    api/                       # REST endpoints, one folder per resource
  components/
    ui/                        # Design-system primitives (Button, Input, Modal…)
    admin/                     # Admin-only composite components (Sidebar, Providers)
  lib/                         # prisma client, auth config, shared utils
prisma/
  schema.prisma                # source of truth for the DB
  seed.ts                      # demo data
```

## 6. Security notes

- Passwords hashed with bcrypt (never stored in plaintext).
- All admin API routes call `getServerSession` and reject with 401 if absent.
- Ownership is re-checked per-record (`restaurantId` match) before every update/delete,
  so a stolen/guessed record ID from another tenant still can't be modified.
- `middleware.ts` blocks unauthenticated access to `/admin/*` at the edge before any
  page code runs.
- Zod schemas validate every write payload server-side (never trust client validation
  alone).

## 7. Future Expansion — designed in, not bolted on

The Prisma schema already contains **commented-out models** for the next phase of
features so they're additive migrations, not redesigns:

| Feature | Schema readiness |
|---|---|
| Multiple branches | `Branch` model **already implemented**, linked to `Restaurant` and `QrCode` (so you can print a distinct QR per branch/table today). |
| Table ordering | `QrCode.targetUrl` already supports a `?table=` query param end-to-end (see `/admin/qrcode`). `RestaurantTable` and `Order`/`OrderItem` models are stubbed in `schema.prisma`. |
| Online / WhatsApp ordering | `Restaurant.socialLinks.whatsapp` is already collected in Settings; an "Order via WhatsApp" deep link (`wa.me/...?text=`) can be added to `MenuClient.tsx` without any schema change. |
| Payment gateway | `PaymentTransaction` stub model; API route can be added under `src/app/api/payments/` following the same session + zod pattern as existing routes. |
| Inventory control | `InventoryItem` stub model; would connect to `MenuItem` via a join table to auto out-of-stock items. |
| Kitchen display system | `KitchenTicket` stub model, `station` field ready for routing by category. |
| Sales analytics | Every mutation is already timestamped (`createdAt`/`updatedAt`); once `Order` ships, analytics is a read-model over existing tables — no retrofitting needed. |

To activate any of these: uncomment the relevant model block in `prisma/schema.prisma`,
run `npx prisma migrate dev`, and add the corresponding `src/app/api/.../route.ts` +
admin page following the existing CRUD pattern.
