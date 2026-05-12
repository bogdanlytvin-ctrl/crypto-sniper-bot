import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F1626] flex">
      <AdminSidebar />
      <main className="flex-1 lg:min-h-screen pt-14 lg:pt-0 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
