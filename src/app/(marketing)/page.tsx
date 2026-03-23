import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";

export default async function HomePage() {
  const session = await getSession();

  // Signed-in users go straight to their workspace
  if (session?.user) {
    redirect("/auth/callback");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">DocuMind</h1>
          <Link
            href="/login"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h2 className="max-w-3xl text-5xl font-bold tracking-tight text-gray-900">
          Chat with your documents using AI
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-gray-600">
          Upload documents, build a knowledge base, and get instant answers
          powered by AI. DocuMind makes your team&apos;s knowledge searchable
          and conversational.
        </p>
        <Link
          href="/login"
          className="mt-8 rounded-lg bg-gray-900 px-8 py-3 text-base font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Get Started Free
        </Link>
      </main>
    </div>
  );
}
