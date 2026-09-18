"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button, Input, Select, Modal } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";

type MenuItem = { id: string; name: string; price: number };
type Promotion = {
  id: string;
  name: string;
  description: string | null;
  discountType: "PERCENT" | "FIXED_AMOUNT";
  discountValue: number;
  couponCode: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: { menuItem: MenuItem }[];
};

const emptyForm = {
  name: "",
  description: "",
  discountType: "PERCENT",
  discountValue: "",
  couponCode: "",
  startDate: "",
  endDate: "",
  menuItemIds: [] as string[],
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [promoRes, itemsRes] = await Promise.all([
      fetch("/api/promotions"),
      fetch("/api/menu-items"),
    ]);
    setPromotions(await promoRes.json());
    setMenuItems(await itemsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      discountValue: parseFloat(form.discountValue),
      couponCode: form.couponCode || null,
    };
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      loadData();
    } else {
      const data = await res.json();
      alert(JSON.stringify(data.error));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this promotion? Affected item prices will revert to normal.")) return;
    const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  }

  function toggleItem(id: string) {
    setForm((f: any) => ({
      ...f,
      menuItemIds: f.menuItemIds.includes(id)
        ? f.menuItemIds.filter((x: string) => x !== id)
        : [...f.menuItemIds, id],
    }));
  }

  const now = new Date();

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Promotions</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Run time-boxed discounts and coupon codes on specific menu items.
          </p>
        </div>
        <Button onClick={openCreate} disabled={menuItems.length === 0}>
          <span className="flex items-center gap-1.5"><Plus size={16} /> New Promotion</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-neutral-400">Loading…</p>}
        {!loading && promotions.length === 0 && (
          <p className="text-sm text-neutral-400">No promotions yet.</p>
        )}
        {promotions.map((promo) => {
          const isLive = promo.isActive && new Date(promo.startDate) <= now && new Date(promo.endDate) >= now;
          return (
            <div key={promo.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                    <Tag size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{promo.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isLive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                        {isLive ? "Live" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {promo.discountType === "PERCENT" ? `${promo.discountValue}% off` : `${formatPrice(promo.discountValue)} off`}
                      {promo.couponCode && ` · Code: ${promo.couponCode}`}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {new Date(promo.startDate).toLocaleDateString()} – {new Date(promo.endDate).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Applies to: {promo.items.map((i) => i.menuItem.name).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(promo.id)} className="text-neutral-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Promotion">
        <div className="flex flex-col gap-3">
          <Input label="Promotion Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Special" />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="PERCENT">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount</option>
            </Select>
            <Input
              label={form.discountType === "PERCENT" ? "Discount (%)" : "Discount Amount"}
              type="number"
              step="0.01"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
            />
          </div>

          <Input label="Coupon Code (optional)" value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })} placeholder="e.g. SAVE10" />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Applies to items</label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-neutral-200 p-2">
              {menuItems.map((item) => (
                <label key={item.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={form.menuItemIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  {item.name} <span className="text-neutral-400">({formatPrice(item.price)})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.discountValue || !form.startDate || !form.endDate || form.menuItemIds.length === 0}
            >
              {saving ? "Saving…" : "Create Promotion"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
