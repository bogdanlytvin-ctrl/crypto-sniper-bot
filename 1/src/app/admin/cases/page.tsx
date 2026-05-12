import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { CasesClient } from "@/components/admin/CasesClient";

export default async function CasesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const items = await prisma.caseStudy.findMany({ orderBy: { order: "asc" } });
  const parsed = items.map((i) => ({ ...i, tags: JSON.parse(i.tags || "[]") as string[] }));

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Кейси</h1>
        <p className="text-white/40 text-[14px] mt-1">Кейси компанії на сторінці &quot;Кейси&quot;</p>
      </div>
      <CasesClient initialItems={parsed} />
    </AdminShell>
  );
}
