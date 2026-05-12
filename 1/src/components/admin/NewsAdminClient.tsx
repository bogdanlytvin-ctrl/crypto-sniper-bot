"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Check } from "lucide-react";

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  date: Date | string;
  active: boolean;
}

const EMPTY: Omit<NewsArticle, "id"> = {
  title: "",
  excerpt: "",
  content: "",
  category: "Новини",
  image: "/images/news-featured.png",
  date: new Date().toISOString().split("T")[0],
  active: true,
};

const IMAGES = [
  "/images/news-featured.png",
  "/images/news-eic.png",
  "/images/news-office.png",
  "/images/news-success.png",
  "/images/news-trends.png",
  "/images/news-consortium.png",
  "/images/news-cleantech.png",
];

const CATEGORIES = ["Новини", "Horizon Europe", "EIC", "Гранти", "Аналітика", "Кейс", "Партнерство"];

export function NewsAdminClient({ initialItems }: { initialItems: NewsArticle[] }) {
  const [items, setItems] = useState(initialItems);
  const [modal, setModal] = useState<null | "create" | "edit">(null);
  const [form, setForm] = useState<Omit<NewsArticle, "id"> & { id?: string }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ ...EMPTY, date: new Date().toISOString().split("T")[0] });
    setError(""); setModal("create");
  };
  const openEdit = (item: NewsArticle) => {
    setForm({ ...item, date: new Date(item.date).toISOString().split("T")[0] });
    setError(""); setModal("edit");
  };
  const closeModal = () => { setModal(null); setError(""); };

  const handleSave = async () => {
    if (!form.title || !form.excerpt || !form.category) {
      setError("Заповніть обов'язкові поля");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        const res = await fetch("/api/admin/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const item = await res.json();
        setItems((prev) => [item, ...prev]);
      } else {
        const res = await fetch(`/api/admin/news/${form.id}`, {
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

  const toggleActive = async (item: NewsArticle) => {
    const res = await fetch(`/api/admin/news/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, active: !item.active }),
    });
    const updated = await res.json();
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Видалити новину?")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-[#0B1120] rounded-[10px] font-semibold text-[14px] hover:bg-[#00D4AA]/90 transition-colors">
          <Plus size={16} /> Додати новину
        </button>
      </div>

      <div className="bg-white/[0.04] border border-white/[0.07] rounded-[16px] overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-[14px]">Новин ще немає</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[14px] font-semibold ${item.active ? "text-white" : "text-white/40"}`}>{item.title}</span>
                    <span className="px-2 py-0.5 bg-purple-400/[0.1] text-purple-400 text-[11px] font-semibold rounded-full">{item.category}</span>
                    {!item.active && <span className="px-2 py-0.5 bg-white/[0.06] text-white/30 text-[11px] rounded-full">прихований</span>}
                  </div>
                  <p className="text-white/40 text-[13px] mt-1 line-clamp-1">{item.excerpt}</p>
                  <p className="text-white/25 text-[12px] mt-0.5">{new Date(item.date).toLocaleDateString("uk-UA")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(item)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors" title={item.active ? "Приховати" : "Показати"}>
                    {item.active ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-400/[0.1] text-white/30 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#131E30] border border-white/[0.1] rounded-[18px] w-full max-w-[580px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white font-bold text-[18px]">{modal === "create" ? "Нова новина" : "Редагувати новину"}</h2>
              <button onClick={closeModal} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">Заголовок *</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Назва новини" className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5">Категорія *</label>
                  <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] focus:outline-none focus:border-[#00D4AA]/50">
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#131E30]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-white/40 mb-1.5">Дата</label>
                  <input type="date" value={String(form.date).split("T")[0]} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] focus:outline-none focus:border-[#00D4AA]/50" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">Короткий опис *</label>
                <textarea rows={2} value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} placeholder="Анонс статті..." className="w-full px-3.5 py-3 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 resize-none" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">Повний текст</label>
                <textarea rows={5} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Повний текст статті..." className="w-full px-3.5 py-3 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 resize-none" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">Зображення</label>
                <select value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] focus:outline-none focus:border-[#00D4AA]/50">
                  {IMAGES.map((img) => <option key={img} value={img} className="bg-[#131E30]">{img.split("/").pop()}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="w-4 h-4 rounded accent-[#00D4AA]" />
                <span className="text-white/60 text-[14px]">Показувати на сайті</span>
              </label>

              {error && <p className="text-red-400 text-[13px] bg-red-400/10 rounded-lg py-2 px-3">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} className="flex-1 h-10 rounded-[10px] bg-white/[0.06] text-white/60 text-[14px] font-medium hover:bg-white/[0.1] transition-colors">Скасувати</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-[10px] bg-[#00D4AA] text-[#0B1120] text-[14px] font-semibold hover:bg-[#00D4AA]/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <Check size={15} />{saving ? "Зберігаю..." : "Зберегти"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
