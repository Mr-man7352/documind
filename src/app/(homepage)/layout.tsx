import { TopNavbar } from "@/components/public-navbar/top-navbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNavbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} DocuMind. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
