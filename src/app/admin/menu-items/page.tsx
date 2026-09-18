"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, ImageOff } from "lucide-react";
import { Button, Input, Textarea, Select, Toggle, Modal } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";

type Category = { id: string; name: string; icon: string | null };
type MenuItem = {
  id: string;
  categoryId: string;
  category: Category;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  discountedPrice: number | null;
  isHot: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isAvailable: boolean;
};

const emptyForm = {
  id: "",
  categoryId: "",
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  discountedPrice: "",
  isHot: false,
  isNew: false,
  isBestseller: false,
  isAvailable: true,
};

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    const [itemsRes, catsRes] = await Promise.all([
      fetch("/api/menu-items"),
      fetch("/api/categories"),
    ]);
    setItems(await itemsRes.json());
    setCategories(await catsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setModalOpen(true);
  }

  function openEdit(item: MenuItem) {
    setForm({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
      price: String(item.price),
      discountedPrice: item.discountedPrice != null ? String(item.discountedPrice) : "",
      isHot: item.isHot,
      isNew: item.isNew,
      isBestseller: item.isBestseller,
      isAvailable: item.isAvailable,
    });
    setModalOpen(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok) setForm((f: any) => ({ ...f, imageUrl: data.url }));
    else alert(data.error ?? "Upload failed");
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      categoryId: form.categoryId,
      name: form.name,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      price: parseFloat(form.price),
      discountedPrice: form.discountedPrice ? parseFloat(form.discountedPrice) : null,
      isHot: form.isHot,
      isNew: form.isNew,
      isBestseller: form.isBestseller,
      isAvailable: form.isAvailable,
    };

    const res = form.id
      ? await fetch(`/api/menu-items/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/menu-items", {
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
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (res.ok) loadData();
  }

  async function toggleAvailability(item: MenuItem) {
    await fetch(`/api/menu-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    loadData();
  }

  const filteredItems =
    categoryFilter === "all" ? items : items.filter((i) => i.categoryId === categoryFilter);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Menu Items</h1>
          <p className="mt-1 text-sm text-neutral-500">Add, edit, and manage all dishes and drinks.</p>
        </div>
        <Button onClick={openCreate} disabled={categories.length === 0}>
          <span className="flex items-center gap-1.5">
            <Plus size={16} /> Add Item
          </span>
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create a category first before adding menu items.
        </p>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        <FilterChip active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
          All
        </FilterChip>
        {categories.map((c) => (
          <FilterChip key={c.id} active={categoryFilter === c.id} onClick={() => setCategoryFilter(c.id)}>
            {c.icon} {c.name}
          </FilterChip>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">Loading…</td></tr>
            )}
            {!loading && filteredItems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No menu items yet.</td></tr>
            )}
            {filteredItems.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-300">
                        <ImageOff size={16} />
                      </div>
                    )}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{item.category?.name}</td>
                <td className="px-4 py-3">
                  {item.discountedPrice != null ? (
                    <span>
                      <span className="font-medium text-brand">{formatPrice(item.discountedPrice)}</span>{" "}
                      <span className="text-xs text-neutral-400 line-through">{formatPrice(item.price)}</span>
                    </span>
                  ) : (
                    formatPrice(item.price)
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {item.isHot && <Dot label="Hot" color="bg-orange-500" />}
                    {item.isNew && <Dot label="New" color="bg-blue-500" />}
                    {item.isBestseller && <Dot label="Best" color="bg-purple-500" />}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.isAvailable ? "Available" : "Out of Stock"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(item)} className="mr-2 text-neutral-500 hover:text-neutral-900">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="text-neutral-500 hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Menu Item" : "Add Menu Item"}>
        <div className="flex flex-col gap-3">
          <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </Select>

          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nasi Lemak Special" />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short, appetizing description" />

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Photo</label>
            {form.imageUrl && (
              <div className="mb-2 h-28 w-28 overflow-hidden rounded-lg bg-neutral-100">
                <Image src={form.imageUrl} alt="" width={112} height={112} className="h-full w-full object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="text-xs"
            />
            {uploading && <p className="mt-1 text-xs text-neutral-400">Uploading…</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input label="Discounted Price (optional)" type="number" step="0.01" min="0" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Toggle label="Hot Item" checked={form.isHot} onChange={(v) => setForm({ ...form, isHot: v })} />
            <Toggle label="New Item" checked={form.isNew} onChange={(v) => setForm({ ...form, isNew: v })} />
            <Toggle label="Bestseller" checked={form.isBestseller} onChange={(v) => setForm({ ...form, isBestseller: v })} />
            <Toggle label="Available" checked={form.isAvailable} onChange={(v) => setForm({ ...form, isAvailable: v })} />
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.price || !form.categoryId}>
              {saving ? "Saving…" : "Save Item"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-600"
      }`}
    >
      {children}
    </button>
  );
}

function Dot({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} /> {label}
    </span>
  );
}
