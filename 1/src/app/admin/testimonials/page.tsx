import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { TestimonialsClient } from "@/components/admin/TestimonialsClient";


export default async function TestimonialsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const items = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Відгуки</h1>
        <p className="text-white/40 text-[14px] mt-1">Відгуки клієнтів на головній сторінці</p>
      </div>
      <TestimonialsClient initialItems={items} />
    </AdminShell>
  );
}
