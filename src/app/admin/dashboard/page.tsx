import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/primitives";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session!.user as any).restaurantId;

  const [restaurant, itemCount, categoryCount, activePromoCount, outOfStockCount] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: restaurantId } }),
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.category.count({ where: { restaurantId } }),
    prisma.promotion.count({
      where: { restaurantId, isActive: true, endDate: { gte: new Date() } },
    }),
    prisma.menuItem.count({ where: { restaurantId, isAvailable: false } }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">
        Welcome back{restaurant ? `, ${restaurant.name}` : ""} 👋
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Here's what's happening with your menu today.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Menu Items" value={itemCount} />
        <StatCard label="Categories" value={categoryCount} />
        <StatCard label="Active Promotions" value={activePromoCount} />
        <StatCard label="Out of Stock" value={outOfStockCount} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/menu-items" className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white">
          + Add Menu Item
        </Link>
        <Link href="/admin/qrcode" className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium">
          View / Download QR Code
        </Link>
        {restaurant && (
          <Link
            href={`/menu/${restaurant.slug}`}
            target="_blank"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium"
          >
            Preview Customer Menu ↗
          </Link>
        )}
      </div>
    </div>
  );
}
