# Deployment Guide

## Recommended stack for production
- **Hosting:** Vercel (first-class Next.js support) — or any Node host (Railway, Render, Fly.io, a VPS with PM2/Docker).
- **Database:** Supabase Postgres (or Neon/RDS).
- **File storage:** Supabase Storage or S3 — **not local disk** once you're on serverless (see below).

## 1. Database
1. Create a Supabase project (or any managed Postgres).
2. Copy the connection string into `DATABASE_URL` in your host's environment
   variables. Use the **pooled/transaction** connection string for serverless hosts.
3. Run migrations against production once, from your local machine or CI:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```

## 2. Environment variables (set on your host)
```
DATABASE_URL=
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```
`NEXT_PUBLIC_BASE_URL` is what gets embedded inside every generated QR code — get
this right before printing anything.

## 3. Swapping to Supabase Storage (required for serverless hosts)
Vercel/serverless filesystems are read-only or ephemeral outside `/tmp`, so the default
local-disk upload adapter (`src/app/api/upload/route.ts`) won't persist files. Swap it:

```ts
// src/app/api/upload/route.ts (replace the write-to-disk section)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key, never expose to client
);

const { data, error } = await supabase.storage
  .from("menu-images")
  .upload(filename, buffer, { contentType: file.type, upsert: false });

if (error) return NextResponse.json({ error: error.message }, { status: 500 });

const { data: pub } = supabase.storage.from("menu-images").getPublicUrl(filename);
return NextResponse.json({ url: pub.publicUrl }, { status: 201 });
```
Add `@supabase/supabase-js` to `package.json`, create a public "menu-images" bucket in
the Supabase dashboard, and set `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
No other code changes are needed — every caller only ever consumes the returned `url`.

## 4. Deploy to Vercel
```bash
npm i -g vercel
vercel
```
Or connect the Git repo in the Vercel dashboard → set the environment variables above
→ deploy. Vercel auto-detects Next.js; no build config needed.

## 5. Post-deploy checklist
- [ ] Visit `/admin/login`, confirm you can sign in.
- [ ] Change the seeded demo password / delete the demo restaurant.
- [ ] Add your real categories, items, and settings.
- [ ] Go to `/admin/qrcode`, download the **PDF**, print it, and physically test-scan it
      with a phone on mobile data (not just office WiFi) before rolling out to tables.
- [ ] Confirm `NEXT_PUBLIC_BASE_URL` matches your real domain (re-generate/re-print the
      QR if you deployed to a temporary URL first).
- [ ] Set up DB backups (Supabase does daily backups on paid tiers — enable it).

## 6. Scaling to multiple restaurants (SaaS mode)
The schema is already multi-tenant. To onboard a new restaurant without touching the
database manually, build a lightweight signup route that does what
`docs/INSTALLATION.md` §6 does manually: create one `Restaurant` row + one `AdminUser`
row in a transaction. Everything downstream (menu, categories, QR, promotions) already
works per-tenant with no further changes.

## 7. Custom domains per restaurant (optional, later)
Since routing is `/menu/[slug]`, you can either:
- keep one domain with `/menu/<slug>` paths (simplest), or
- map custom domains to specific slugs via a rewrite in `next.config.js` using the
  `Host` header — worth doing once you have paying, branded customers.
