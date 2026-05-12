"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";

const SECTIONS = [
  {
    title: "Контактна інформація",
    fields: [
      { key: "email", label: "Email", type: "email", placeholder: "hello@ohmygrant.com" },
      { key: "phone", label: "Телефон", placeholder: "+38 (044) 123-45-67" },
      { key: "address", label: "Адреса", placeholder: "Київ, Україна" },
    ],
  },
  {
    title: "Calendly",
    fields: [
      { key: "calendly", label: "Посилання Calendly", placeholder: "https://calendly.com/ohmygrant/30min" },
    ],
  },
  {
    title: "Соціальні мережі",
    fields: [
      { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/ohmygrant" },
      { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/ohmygrant" },
      { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/ohmygrant" },
      { key: "telegram", label: "Telegram", placeholder: "https://t.me/ohmygrant" },
    ],
  },
  {
    title: "Ключові метрики (Hero/Stats)",
    fields: [
      { key: "stats_clients", label: "Кількість клієнтів", placeholder: "80+" },
      { key: "stats_funding", label: "Залучено фінансування", placeholder: "€15 000 000+" },
      { key: "stats_guarantee", label: "Текст гарантії", placeholder: "Повернення коштів" },
    ],
  },
];

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className="bg-white/[0.04] border border-white/[0.07] rounded-[16px] p-6">
          <h2 className="text-white font-semibold text-[15px] mb-5">{section.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[12px] font-medium text-white/40 mb-1.5">{field.label}</label>
                <input
                  type={field.type || "text"}
                  value={settings[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full h-10 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] font-semibold text-[14px] transition-all ${
            saved
              ? "bg-green-500/[0.15] text-green-400 border border-green-500/20"
              : "bg-[#00D4AA] text-[#0B1120] hover:bg-[#00D4AA]/90"
          } disabled:opacity-60`}
        >
          {saved ? (
            <><Check size={16} /> Збережено</>
          ) : (
            <><Save size={16} /> {saving ? "Зберігаю..." : "Зберегти"}</>
          )}
        </button>
      </div>
    </div>
  );
}
