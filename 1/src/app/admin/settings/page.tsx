import { getAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsClient } from "@/components/admin/SettingsClient";


const DEFAULT_SETTINGS: Record<string, string> = {
  email: "hello@ohmygrant.com",
  phone: "+38 (044) 123-45-67",
  address: "Київ, Україна",
  linkedin: "#",
  facebook: "#",
  instagram: "#",
  telegram: "#",
  calendly: "#",
  stats_clients: "80+",
  stats_funding: "€15 000 000+",
  stats_guarantee: "Повернення коштів",
};

export default async function SettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin");

  const configs = await prisma.siteConfig.findMany();
  const saved: Record<string, string> = {};
  for (const c of configs) saved[c.key] = c.value;

  const settings = { ...DEFAULT_SETTINGS, ...saved };

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-white text-[24px] font-bold">Налаштування</h1>
        <p className="text-white/40 text-[14px] mt-1">Контактна інформація, посилання та ключові метрики</p>
      </div>
      <SettingsClient initialSettings={settings} />
    </AdminShell>
  );
}
