"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white">
            <LockKeyhole size={20} />
          </div>
          <h1 className="text-lg font-bold">Admin Sign In</h1>
          <p className="text-sm text-neutral-500">Manage your restaurant's menu content</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              placeholder="owner@restaurant.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
