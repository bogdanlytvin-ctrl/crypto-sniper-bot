import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewsAdminClient } from "@/components/admin/NewsAdminClient";


export default async function NewsAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const items = await prisma.newsArticle.findMany({ orderBy: { date: "desc" } });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Новини</h1>
        <p className="text-white/40 text-[14px] mt-1">Статті на сторінці &quot;Новини&quot;</p>
      </div>
      <NewsAdminClient initialItems={items} />
    </AdminShell>
  );
}
