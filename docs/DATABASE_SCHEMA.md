# Database Schema

Full source of truth: `prisma/schema.prisma`. This document is a human-readable
companion to it.

## Entity Relationship Summary

```
Restaurant 1───* AdminUser
Restaurant 1───* Category
Restaurant 1───* MenuItem
Restaurant 1───* Promotion
Restaurant 1───* Branch
Restaurant 1───* QrCode

Category   1───* MenuItem

Promotion  *───* MenuItem   (via PromotionItem join table)

Branch     1───* QrCode
```

## Tables

### `restaurants`
The tenant root. One row per restaurant/business.
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | PK |
| slug | string | unique, used in public URL `/menu/[slug]` |
| name, logoUrl | | branding |
| themeColor, themeColorDark | string (hex) | drives customer menu theming |
| contactPhone, contactEmail, address | | |
| operatingHours | JSON | `{ mon: {open, close, closed}, ... }` |
| socialLinks | JSON | `{ facebook, instagram, whatsapp, tiktok }` |
| currency | string | ISO 4217, default `MYR` |
| isActive | boolean | soft-disable a tenant |

### `admin_users`
| Field | Notes |
|---|---|
| restaurantId | FK → restaurants, cascade delete |
| email | unique, login identifier |
| passwordHash | bcrypt |
| role | `OWNER` \| `MANAGER` \| `STAFF` — role gate example: only OWNER/MANAGER can PATCH `/api/settings` |

### `categories`
| Field | Notes |
|---|---|
| restaurantId | FK |
| name, slug, icon | slug auto-generated from name |
| sortOrder | drives display + tab order on the customer menu |
| isActive | hide without deleting |
| `@@unique([restaurantId, slug])` | two restaurants can both have a "food" category |

### `menu_items`
| Field | Notes |
|---|---|
| restaurantId, categoryId | FKs |
| name, description, imageUrl | |
| price | `Decimal(10,2)` |
| discountedPrice | nullable `Decimal(10,2)`; when set and lower than `price`, the customer UI shows a strike-through + "on sale" styling |
| isHot, isNew, isBestseller | independent boolean badges |
| isAvailable | false = "Out of Stock" badge, item dimmed but still visible (transparency > hiding) |
| sortOrder | manual ordering within a category |
| tags | string array, reserved for future filters (spicy/vegan/halal/allergens) |

### `promotions`
| Field | Notes |
|---|---|
| restaurantId | FK |
| discountType | `PERCENT` \| `FIXED_AMOUNT` |
| discountValue | Decimal |
| couponCode | optional, unique |
| startDate, endDate | promotion only shows as "Live" in admin and only affects pricing within this window |
| isActive | manual kill-switch independent of dates |

### `promotion_items`
Join table — a promotion can target many menu items; creating a promotion writes
`discountedPrice` onto each targeted `MenuItem` so the **public menu read path stays
simple** (no runtime promotion-resolution logic needed on every page view). Deleting
a promotion clears `discountedPrice` back to `null` on its items.

### `qr_codes`
Stores a label + the exact target URL that was generated (audit trail of what was
printed), optionally scoped to a `Branch`. The **live** QR image is always generated
on demand from `/api/qrcode`, which always points at the current canonical
`/menu/[slug]` URL — so old printed codes never break even if you regenerate new ones.

### `branches` (future-ready, implemented now)
Lets one restaurant operate multiple physical locations, each able to have its own
QR codes, while still sharing one menu/brand by default.

## Commented future models

`RestaurantTable`, `Order`, `OrderItem`, `PaymentTransaction`, `InventoryItem`,
`KitchenTicket` are drafted at the bottom of `schema.prisma` as comments. They're not
migrated yet — uncomment + `prisma migrate dev` when you're ready to build online
ordering, payments, inventory, or a kitchen display system. See
`docs/ARCHITECTURE.md` §7 for how each maps to already-existing schema and UI hooks.

## Running migrations

```bash
npx prisma migrate dev --name init   # creates tables from schema.prisma
npx prisma generate                  # regenerates the typed client
npm run seed                         # loads demo data (optional)
```
