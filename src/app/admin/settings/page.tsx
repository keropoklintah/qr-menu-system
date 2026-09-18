"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Input, Textarea } from "@/components/ui/primitives";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function SettingsPage() {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const hours =
          data.operatingHours ||
          Object.fromEntries(DAYS.map((d) => [d, { open: "09:00", close: "22:00", closed: false }]));
        const social = data.socialLinks || { facebook: "", instagram: "", whatsapp: "", tiktok: "" };
        setForm({ ...data, operatingHours: hours, socialLinks: social });
      });
  }, []);

  async function handleLogoUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm({ ...form, logoUrl: data.url });
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        logoUrl: form.logoUrl,
        themeColor: form.themeColor,
        themeColorDark: form.themeColorDark,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        address: form.address,
        operatingHours: form.operatingHours,
        socialLinks: form.socialLinks,
        currency: form.currency,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  }

  if (!form) return <div className="p-8 text-sm text-neutral-400">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-bold">Restaurant Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">Controls branding and info shown on your customer menu page.</p>

      <div className="mt-6 flex flex-col gap-6">
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Branding</h2>
          <div className="flex flex-col gap-3">
            {form.logoUrl && (
              <Image src={form.logoUrl} alt="logo" width={64} height={64} className="rounded-full object-cover" />
            )}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} className="text-xs" />
            {uploading && <p className="text-xs text-neutral-400">Uploading…</p>}

            <Input label="Restaurant Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Primary Theme Color</label>
                <input type="color" value={form.themeColor} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} className="h-10 w-full rounded-lg border border-neutral-300" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Secondary Color</label>
                <input type="color" value={form.themeColorDark} onChange={(e) => setForm({ ...form, themeColorDark: e.target.value })} className="h-10 w-full rounded-lg border border-neutral-300" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Contact Information</h2>
          <div className="flex flex-col gap-3">
            <Input label="Phone" value={form.contactPhone ?? ""} onChange={(e: any) => setForm({ ...form, contactPhone: e.target.value })} />
            <Input label="Email" value={form.contactEmail ?? ""} onChange={(e: any) => setForm({ ...form, contactEmail: e.target.value })} />
            <Textarea label="Address" rows={2} value={form.address ?? ""} onChange={(e: any) => setForm({ ...form, address: e.target.value })} />
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Operating Hours</h2>
          <div className="flex flex-col gap-2">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-medium capitalize text-neutral-600">{day}</span>
                <input
                  type="checkbox"
                  checked={!form.operatingHours[day].closed}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingHours: {
                        ...form.operatingHours,
                        [day]: { ...form.operatingHours[day], closed: !e.target.checked },
                      },
                    })
                  }
                />
                <input
                  type="time"
                  value={form.operatingHours[day].open}
                  disabled={form.operatingHours[day].closed}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingHours: { ...form.operatingHours, [day]: { ...form.operatingHours[day], open: e.target.value } },
                    })
                  }
                  className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                />
                <span className="text-xs text-neutral-400">to</span>
                <input
                  type="time"
                  value={form.operatingHours[day].close}
                  disabled={form.operatingHours[day].closed}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingHours: { ...form.operatingHours, [day]: { ...form.operatingHours[day], close: e.target.value } },
                    })
                  }
                  className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">Social Media Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {["facebook", "instagram", "whatsapp", "tiktok"].map((key) => (
              <Input
                key={key}
                label={key[0].toUpperCase() + key.slice(1)}
                value={form.socialLinks[key] ?? ""}
                onChange={(e: any) => setForm({ ...form, socialLinks: { ...form.socialLinks, [key]: e.target.value } })}
                placeholder="https://…"
              />
            ))}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Settings"}</Button>
          {savedMsg && <span className="text-xs font-medium text-green-600">Saved ✓</span>}
        </div>
      </div>
    </div>
  );
}
