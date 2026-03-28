import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";

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
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 border-r bg-sidebar p-4 flex-col">
        <h2 className="mb-6 text-lg font-bold px-3">DocuMind</h2>
        <SidebarNav workspaceSlug={workspaceSlug} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar — only visible below md breakpoint */}
        <div className="flex items-center gap-3 border-b bg-sidebar px-4 py-3 md:hidden">
          <MobileSidebar workspaceSlug={workspaceSlug} />
          <span className="text-sm font-semibold">DocuMind</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 md:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
