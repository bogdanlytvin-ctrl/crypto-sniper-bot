"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  position: string;
  text: string;
  amount: string;
  order: number;
  active: boolean;
}

const EMPTY: Omit<Testimonial, "id"> = {
  name: "",
  position: "",
  text: "",
  amount: "",
  order: 0,
  active: true,
};

export function TestimonialsClient({ initialItems }: { initialItems: Testimonial[] }) {
  const [items, setItems] = useState(initialItems);
  const [modal, setModal] = useState<null | "create" | "edit">(null);
  const [form, setForm] = useState<Omit<Testimonial, "id"> & { id?: string }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => { setForm(EMPTY); setError(""); setModal("create"); };
  const openEdit = (item: Testimonial) => { setForm(item); setError(""); setModal("edit"); };
  const closeModal = () => { setModal(null); setError(""); };

  const handleSave = async () => {
    if (!form.name || !form.position || !form.text) {
      setError("Заповніть обов'язкові поля");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        const res = await fetch("/api/admin/testimonials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const item = await res.json();
        setItems((prev) => [...prev, item]);
      } else {
        const res = await fetch(`/api/admin/testimonials/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const item = await res.json();
        setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      }
      closeModal();
    } catch {
      setError("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: Testimonial) => {
    const res = await fetch(`/api/admin/testimonials/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, active: !item.active }),
    });
    const updated = await res.json();
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Видалити відгук?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-[#0B1120] rounded-[10px] font-semibold text-[14px] hover:bg-[#00D4AA]/90 transition-colors"
        >
          <Plus size={16} /> Додати відгук
        </button>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.07] rounded-[16px] overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-[14px]">Відгуків ще немає</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[14px] font-semibold ${item.active ? "text-white" : "text-white/40"}`}>
                      {item.name}
                    </span>
                    <span className="text-white/30 text-[13px]">· {item.position}</span>
                    {item.amount && (
                      <span className="px-2 py-0.5 bg-[#00D4AA]/[0.1] text-[#00D4AA] text-[11px] font-semibold rounded-full">
                        {item.amount}
                      </span>
                    )}
                    {!item.active && (
                      <span className="px-2 py-0.5 bg-white/[0.06] text-white/30 text-[11px] rounded-full">
                        прихований
                      </span>
                    )}
                  </div>
                  <p className="text-white/40 text-[13px] mt-1 line-clamp-2">{item.text}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(item)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors" title={item.active ? "Приховати" : "Показати"}>
                    {item.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-400/[0.1] text-white/30 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#131E30] border border-white/[0.1] rounded-[18px] w-full max-w-[520px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-[18px]">
                {modal === "create" ? "Новий відгук" : "Редагувати відгук"}
              </h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {[
                { key: "name", label: "Ім'я *", placeholder: "Іван Петренко" },
                { key: "position", label: "Посада / Компанія *", placeholder: "CEO, Tech Startup" },
                { key: "amount", label: "Сума гранту", placeholder: "€250 000" },
                { key: "order", label: "Порядок", type: "number", placeholder: "0" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    value={String((form as Record<string, unknown>)[f.key] ?? "")}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? +e.target.value : e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">Текст відгуку *</label>
                <textarea
                  rows={4}
                  value={form.text}
                  onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                  placeholder="Текст відгуку клієнта..."
                  className="w-full px-3.5 py-3 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#00D4AA]"
                />
                <span className="text-white/60 text-[14px]">Показувати на сайті</span>
              </label>

              {error && <p className="text-red-400 text-[13px] bg-red-400/10 rounded-lg py-2 px-3">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 h-10 rounded-[10px] bg-white/[0.06] text-white/60 text-[14px] font-medium hover:bg-white/[0.1] transition-colors">
                  Скасувати
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 rounded-[10px] bg-[#00D4AA] text-[#0B1120] text-[14px] font-semibold hover:bg-[#00D4AA]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Check size={15} />
                  {saving ? "Зберігаю..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
