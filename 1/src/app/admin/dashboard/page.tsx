import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { Inbox, Star, Briefcase, Newspaper, ExternalLink } from "lucide-react";
import Link from "next/link";


export default async function DashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const [leadsCount, unreadLeads, testimonialsCount, casesCount, newsCount] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { read: false } }),
      prisma.testimonial.count(),
      prisma.caseStudy.count(),
      prisma.newsArticle.count(),
    ]);

  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "Нових заявок", value: unreadLeads, total: leadsCount, icon: Inbox, href: "/admin/leads", color: "text-[#00D4AA]", bg: "bg-[#00D4AA]/[0.08]" },
    { label: "Відгуки", value: testimonialsCount, icon: Star, href: "/admin/testimonials", color: "text-amber-400", bg: "bg-amber-400/[0.08]" },
    { label: "Кейси", value: casesCount, icon: Briefcase, href: "/admin/cases", color: "text-blue-400", bg: "bg-blue-400/[0.08]" },
    { label: "Новини", value: newsCount, icon: Newspaper, href: "/admin/news", color: "text-purple-400", bg: "bg-purple-400/[0.08]" },
  ];

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Dashboard</h1>
        <p className="text-white/40 text-[14px] mt-1">Огляд сайту Oh My Grant</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white/[0.04] border border-white/[0.07] rounded-[14px] p-5 hover:border-white/15 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-[10px] ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className={`text-[28px] font-bold ${s.color} leading-none mb-1`}>
              {s.value}
              {"total" in s && s.total !== s.value && (
                <span className="text-[16px] text-white/30 font-normal ml-1">/ {s.total}</span>
              )}
            </div>
            <div className="text-white/40 text-[13px]">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-white font-semibold text-[16px]">Останні заявки</h2>
          <Link href="/admin/leads" className="text-[#00D4AA] text-[13px] flex items-center gap-1 hover:underline">
            Всі заявки <ExternalLink size={13} />
          </Link>
        </div>
        {recentLeads.length === 0 ? (
          <div className="px-6 py-10 text-center text-white/30 text-[14px]">Заявок ще немає</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="px-6 py-4 flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${lead.read ? "bg-white/20" : "bg-[#00D4AA]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-[14px] font-medium">{lead.name}</span>
                    {lead.company && <span className="text-white/30 text-[13px]">· {lead.company}</span>}
                  </div>
                  <div className="text-white/40 text-[13px]">{lead.email}</div>
                  <div className="text-white/30 text-[13px] truncate mt-0.5">{lead.message}</div>
                </div>
                <div className="text-white/25 text-[12px] shrink-0">
                  {new Date(lead.createdAt).toLocaleDateString("uk-UA")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6">
        <a
          href="/"
          target="_blank"
          className="inline-flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors"
        >
          <ExternalLink size={14} />
          Відкрити сайт
        </a>
      </div>
    </AdminShell>
  );
}
