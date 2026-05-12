"use client";

import { useState } from "react";
import { Trash2, Mail, Eye, EyeOff, Search } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  read: boolean;
  createdAt: Date | string;
}

export function LeadsClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggleRead = async (id: string, read: boolean) => {
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read }),
    });
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, read } : l)));
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Видалити заявку?")) return;
    await fetch("/api/admin/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const unread = leads.filter((l) => !l.read).length;

  return (
    <div>
      {/* Search + stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <div className="relative flex-1 w-full sm:max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за ім'ям, email..."
            className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-white/[0.05] border border-white/[0.08] text-white text-[14px] placeholder:text-white/25 focus:outline-none focus:border-[#00D4AA]/40"
          />
        </div>
        {unread > 0 && (
          <span className="px-3 py-1.5 bg-[#00D4AA]/[0.12] text-[#00D4AA] text-[13px] font-semibold rounded-full">
            {unread} непрочитаних
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-[16px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-[14px]">Заявок не знайдено</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((lead) => (
              <div key={lead.id}>
                <div
                  className={`px-5 py-4 flex items-start gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors ${
                    !lead.read ? "bg-[#00D4AA]/[0.03]" : ""
                  }`}
                  onClick={() => setExpanded((prev) => (prev === lead.id ? null : lead.id))}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${lead.read ? "bg-white/20" : "bg-[#00D4AA]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[14px] font-semibold ${lead.read ? "text-white/70" : "text-white"}`}>
                        {lead.name}
                      </span>
                      {lead.company && <span className="text-white/30 text-[13px]">· {lead.company}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Mail size={12} className="text-white/30" />
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[13px] text-white/40 hover:text-[#00D4AA] transition-colors"
                      >
                        {lead.email}
                      </a>
                    </div>
                    <div className="text-white/30 text-[13px] truncate mt-1">{lead.message}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white/25 text-[12px]">
                      {new Date(lead.createdAt).toLocaleDateString("uk-UA")}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleRead(lead.id, !lead.read); }}
                      className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/30 hover:text-white/70 transition-colors"
                      title={lead.read ? "Позначити непрочитаним" : "Позначити прочитаним"}
                    >
                      {lead.read ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-400/[0.1] text-white/30 hover:text-red-400 transition-colors"
                      title="Видалити"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded message */}
                {expanded === lead.id && (
                  <div
                    className="px-5 pb-5 ml-6 border-t border-white/[0.04]"
                    onClick={() => { if (!lead.read) toggleRead(lead.id, true); }}
                  >
                    <p className="text-white/60 text-[14px] leading-relaxed whitespace-pre-wrap pt-4">
                      {lead.message}
                    </p>
                    <a
                      href={`mailto:${lead.email}?subject=Re: Oh My Grant`}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#00D4AA]/[0.1] text-[#00D4AA] text-[13px] font-medium rounded-[8px] hover:bg-[#00D4AA]/[0.18] transition-colors"
                    >
                      <Mail size={14} />
                      Відповісти на {lead.email}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
