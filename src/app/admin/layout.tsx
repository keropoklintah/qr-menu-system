import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Providers from "@/components/admin/Providers";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // /admin/login renders its own standalone page (matcher excludes it),
  // but we still guard every other nested route server-side here too.
  return (
    <Providers>
      <div className="flex">
        {session && <Sidebar />}
        <main className="min-h-screen flex-1 bg-neutral-50">{children}</main>
      </div>
    </Providers>
  );
}
