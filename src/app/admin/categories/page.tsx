"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button, Input, Modal, Toggle } from "@/components/ui/primitives";

type Category = {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { menuItems: number };
};

const emptyForm = { id: "", name: "", icon: "", isActive: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setForm({ id: cat.id, name: cat.name, icon: cat.icon ?? "", isActive: cat.isActive });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { name: form.name, icon: form.icon || null, isActive: form.isActive };
    const res = form.id
      ? await fetch(`/api/categories/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/categories", {
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
      alert(data.error?.formErrors?.[0] ?? "Failed to save category");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) loadData();
    else alert(data.error);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = categories[index + direction];
    const current = categories[index];
    if (!target) return;

    // swap sortOrder values
    await Promise.all([
      fetch(`/api/categories/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/categories/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
    loadData();
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Organize your menu into sections. Use the arrows to control display order.
          </p>
        </div>
        <Button onClick={openCreate}>
          <span className="flex items-center gap-1.5"><Plus size={16} /> Add Category</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {loading && <p className="text-sm text-neutral-400">Loading…</p>}
        {!loading && categories.length === 0 && (
          <p className="text-sm text-neutral-400">No categories yet — add your first one (e.g. Food, Drinks, Desserts).</p>
        )}
        {categories.map((cat, i) => (
          <div key={cat.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{cat.icon || "🍽️"}</span>
              <div>
                <p className="text-sm font-medium">{cat.name}</p>
                <p className="text-xs text-neutral-400">
                  {cat._count.menuItems} item{cat._count.menuItems !== 1 ? "s" : ""}
                  {!cat.isActive && " · Hidden"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ArrowUp size={14} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === categories.length - 1} className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30">
                <ArrowDown size={14} />
              </button>
              <button onClick={() => openEdit(cat)} className="ml-2 rounded p-1.5 text-neutral-500 hover:bg-neutral-100">
                <Pencil size={14} />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Edit Category" : "Add Category"}>
        <div className="flex flex-col gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Food, Drinks, Desserts" />
          <Input label="Icon (emoji, optional)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🍔" maxLength={4} />
          <Toggle label="Visible on menu" checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? "Saving…" : "Save Category"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
