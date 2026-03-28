import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { OfflineBanner } from "@/components/layout/offline-banner";
import Link from "next/link";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-sidebar p-4 flex-col">
        <div className="mb-6 flex items-center justify-between px-3">
          <h2 className="text-lg font-bold">
            <Link href="/">DocuMind</Link>
          </h2>
          <ThemeToggle />
        </div>
        <SidebarNav workspaceSlug={workspaceSlug} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <MobileSidebar workspaceSlug={workspaceSlug} />
            <span className="text-sm font-semibold">
              <Link href="/">DocuMind</Link>
            </span>
          </div>
          <ThemeToggle />
        </div>

        <OfflineBanner />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 md:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
