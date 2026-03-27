import { SidebarNav } from "@/components/layout/sidebar-nav";

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
      <aside className="w-64 border-r bg-sidebar p-4 flex flex-col">
        <h2 className="mb-6 text-lg font-bold px-3">DocuMind</h2>
        <SidebarNav workspaceSlug={workspaceSlug} />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
