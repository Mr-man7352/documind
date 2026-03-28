import Link from "next/link";

export function TopNavbar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">DocuMind</h1>
        <Link
          href="/login"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
