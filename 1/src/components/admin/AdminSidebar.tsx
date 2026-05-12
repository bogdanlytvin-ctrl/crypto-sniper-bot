"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  Inbox,
  Star,
  Briefcase,
  Newspaper,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Заявки", icon: Inbox },
  { href: "/admin/testimonials", label: "Відгуки", icon: Star },
  { href: "/admin/cases", label: "Кейси", icon: Briefcase },
  { href: "/admin/news", label: "Новини", icon: Newspaper },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  const NavContent = () => (
    <>
      <div className="px-4 py-5 border-b border-white/[0.06]">
        <div className="relative w-[120px] h-[30px]">
          <Image src="/TM.webp" alt="Oh My Grant" fill sizes="120px" className="object-contain brightness-0 invert" />
        </div>
        <p className="text-white/30 text-[11px] mt-1.5">Адмін-панель</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#00D4AA]/[0.12] text-[#00D4AA]"
                  : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-white/40 hover:text-red-400 hover:bg-red-400/[0.08] transition-all duration-200"
        >
          <LogOut size={17} />
          Вийти
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col bg-[#0B1120] border-r border-white/[0.06] min-h-screen">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[#0B1120] border-b border-white/[0.06] flex items-center justify-between px-4">
        <div className="relative w-[110px] h-[26px]">
          <Image src="/TM.webp" alt="Oh My Grant" fill sizes="110px" className="object-contain brightness-0 invert" />
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-white/60 hover:text-white">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-[220px] bg-[#0B1120] border-r border-white/[0.06] flex flex-col pt-14">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
