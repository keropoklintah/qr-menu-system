# QR Menu Management System

A full-stack, multi-tenant **QR Menu Management System**. Customers scan a QR code
and instantly see a restaurant's live menu on their phone. Restaurant owners manage
every piece of that menu — items, categories, prices, promotions, branding — through
a protected admin dashboard. **Nothing is hardcoded.**

## Stack
Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
NextAuth · `qrcode` + `pdf-lib`

## Feature checklist

**Customer Menu (`/menu/[slug]`)**
- [x] Mobile-first, fast (ISR-cached Server Component)
- [x] Categories incl. Food / Drinks / Desserts / Promotions
- [x] Photo, name, description, price, discounted price, Hot/New badges, availability
- [x] Search + category filter
- [x] Branded theme colors, logo, opening-hours + contact info sheet

**Admin Dashboard (`/admin`)**
- [x] Secure login (NextAuth + bcrypt), session-protected routes
- [x] Menu items: add/edit/delete, image upload, price, Hot/New/Bestseller/Out-of-Stock flags
- [x] Categories: add/edit/delete, reorder, show/hide
- [x] Promotions: discount %/fixed amount, coupon codes, start/end dates, per-item targeting
- [x] Settings: logo, name, theme colors, contact info, operating hours, social links
- [x] QR code: auto-generated, always points to the live menu, download PNG or print-ready PDF

## Quick start
```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, NEXTAUTH_SECRET, etc.
npx prisma migrate dev --name init
npm run seed               # optional demo data
npm run dev
```
Then visit:
- Customer menu → http://localhost:3000/menu/demo-restaurant
- Admin login → http://localhost:3000/admin/login (`owner@demorestaurant.com` / `Admin123!` if seeded)

Full guides: [`docs/INSTALLATION.md`](docs/INSTALLATION.md) · [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md)

## Project structure
```
src/app/menu/[restaurantSlug]/   Public customer menu (Server + Client component)
src/app/admin/                   Protected admin dashboard pages
src/app/api/                     REST API (menu-items, categories, promotions, settings, upload, qrcode, auth)
src/components/ui/                Design-system primitives
src/components/admin/             Sidebar, session provider
src/lib/                          Prisma client, NextAuth config, shared utils
prisma/schema.prisma              Database schema (+ commented future-feature models)
prisma/seed.ts                    Demo data
docs/                             Architecture, schema, install & deploy guides
```

## Built for future expansion
The database and API layer are deliberately designed so the next phase — online
ordering, table ordering, WhatsApp ordering, payments, multi-branch, inventory, a
kitchen display system, and analytics — are additive features, not rewrites. See
**"Future Expansion"** in `docs/ARCHITECTURE.md` for exactly how each maps onto the
existing schema.

## License
Provided as a starter/reference implementation for you to adapt and own.
