import Link from "next/link";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const basePath = `/${workspaceSlug}`;

  const navItems = [
    { label: "Dashboard", href: `${basePath}/dashboard` },
    { label: "Documents", href: `${basePath}/documents` },
    { label: "Chat", href: `${basePath}/chat` },
    { label: "Analytics", href: `${basePath}/analytics` },
    { label: "Settings", href: `${basePath}/settings` },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-6 text-lg font-bold text-gray-900">DocuMind</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
