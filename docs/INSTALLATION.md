# Installation Guide (Local Development)

## Prerequisites
- Node.js 18.18+ (Node 20 LTS recommended)
- npm (or pnpm/yarn — adjust commands accordingly)
- A PostgreSQL database — pick ONE:
  - Option A: Local Postgres (`brew install postgresql` / Docker)
  - Option B: [Supabase](https://supabase.com) free-tier project (recommended — gives you Postgres + Storage in one place)
  - Option C: Neon / Railway / RDS — any managed Postgres works

## 1. Install dependencies
```bash
cd qr-menu-system
npm install
```

## 2. Configure environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

If using **Supabase**: Project Settings → Database → Connection string (use the
"Transaction" pooler string for `DATABASE_URL` in serverless/production, or the direct
connection string for local dev).

## 3. Create the database schema
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 4. Seed demo data (optional but recommended)
```bash
npm run seed
```
This creates:
- A demo restaurant at `/menu/demo-restaurant`
- An admin login: **owner@demorestaurant.com / Admin123!**
- 3 categories (Food, Drinks, Desserts) and 6 sample menu items

⚠️ Change or remove this account before going to production.

## 5. Run the dev server
```bash
npm run dev
```
- Customer menu: http://localhost:3000/menu/demo-restaurant
- Admin login: http://localhost:3000/admin/login

## 6. Create your own restaurant (instead of the seed data)

The fastest path without building a full self-serve signup flow yet is via Prisma
Studio:
```bash
npx prisma studio
```
1. Create a row in `restaurants` (set a unique `slug`).
2. Create a row in `admin_users` linked to it — for `passwordHash`, generate one with:
   ```bash
   node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 10))"
   ```
3. Log in at `/admin/login` with that email/password, then use the dashboard for
   everything else (categories, items, promotions, settings, QR code) — no more
   direct DB editing needed.

> A proper "Sign up your restaurant" onboarding flow is a natural next feature —
> it would simply wrap the same three inserts above behind a public form + POST route.

## Troubleshooting
| Problem | Fix |
|---|---|
| `P1001: Can't reach database server` | Check `DATABASE_URL` host/port and that Postgres is running / firewall allows your IP (Supabase: allow all or add your IP under Database → Network Restrictions). |
| Images not showing after upload | Confirm `public/uploads/` is writable; on serverless hosts (Vercel) local disk is ephemeral — switch to Supabase Storage before deploying, see DEPLOYMENT.md. |
| `NEXTAUTH_URL` mismatch errors | Must exactly match the origin you're browsing from, including protocol and port. |
