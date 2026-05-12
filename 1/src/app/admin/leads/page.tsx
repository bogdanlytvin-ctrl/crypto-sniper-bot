import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { LeadsClient } from "@/components/admin/LeadsClient";


export default async function LeadsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Заявки</h1>
        <p className="text-white/40 text-[14px] mt-1">Запити з контактної форми сайту</p>
      </div>
      <LeadsClient initialLeads={leads} />
    </AdminShell>
  );
}
