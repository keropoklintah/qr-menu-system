"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button, Input } from "@/components/ui/primitives";

export default function QrCodePage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [table, setTable] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setRestaurant);
  }, []);

  useEffect(() => {
    setPreviewUrl(`/api/qrcode?format=png${table ? `&table=${encodeURIComponent(table)}` : ""}&_=${Date.now()}`);
  }, [table]);

  if (!restaurant) return <div className="p-8 text-sm text-neutral-400">Loading…</div>;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const menuUrl = `${baseUrl}/menu/${restaurant.slug}${table ? `?table=${table}` : ""}`;

  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-bold">QR Code</h1>
      <p className="mt-1 text-sm text-neutral-500">
        This QR code always points to your live menu — updates to items, prices, or
        availability show up instantly without reprinting.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 text-center">
        <img src={previewUrl} alt="QR Code" className="mx-auto h-56 w-56 rounded-lg border border-neutral-100" />
        <p className="mt-3 break-all text-xs text-neutral-400">{menuUrl}</p>

        <div className="mt-4">
          <Input
            label="Optional table / location label"
            placeholder="e.g. Table 5"
            value={table}
            onChange={(e) => setTable(e.target.value)}
          />
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href={`/api/qrcode?format=png${table ? `&table=${encodeURIComponent(table)}` : ""}`} download>
            <Button variant="secondary"><span className="flex items-center gap-1.5"><Download size={15} /> PNG</span></Button>
          </a>
          <a href={`/api/qrcode?format=pdf${table ? `&table=${encodeURIComponent(table)}` : ""}`} download>
            <Button variant="secondary"><span className="flex items-center gap-1.5"><Download size={15} /> PDF (Printable)</span></Button>
          </a>
          <a href={`/menu/${restaurant.slug}`} target="_blank">
            <Button><span className="flex items-center gap-1.5"><ExternalLink size={15} /> Open Menu</span></Button>
          </a>
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Tip: generate a separate labeled QR per table if you want per-table ordering later —
        the link already supports a <code>?table=</code> parameter for that future feature.
      </p>
    </div>
  );
}
