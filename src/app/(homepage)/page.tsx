import { TopNavbar } from "@/components/public-navbar/top-navbar";
import Link from "next/link";

export default async function HomePage() {


  return (
    <div className="flex min-h-screen flex-col">
      <TopNavbar />

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
