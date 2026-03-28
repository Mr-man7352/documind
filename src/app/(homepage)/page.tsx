import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Users,
  Quote,
  BarChart2,
  Puzzle,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Document Upload",
    description:
      "Upload PDFs and documents in seconds. DocuMind processes and indexes them automatically.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    description:
      "Ask questions in plain English and get accurate answers drawn directly from your documents.",
  },
  {
    icon: Quote,
    title: "Source Citations",
    description:
      "Every answer links back to the exact page and document it came from — no hallucinations.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description:
      "Invite your team, set roles, and collaborate on a shared knowledge base together.",
  },
  {
    icon: BarChart2,
    title: "Usage Analytics",
    description:
      "See which documents are used most and what questions your team is asking.",
  },
  {
    icon: Puzzle,
    title: "Embeddable Widget",
    description:
      "Add a chat widget to any website with a single script tag — powered by your own documents.",
  },
];

const steps = [
  {
    icon: FileText,
    title: "Upload your documents",
    description:
      "Drag and drop PDFs or upload files directly. DocuMind accepts any document your team works with.",
  },
  {
    icon: BarChart2,
    title: "We process & index them",
    description:
      "Our AI reads, chunks, and indexes every document automatically — usually in under a minute.",
  },
  {
    icon: MessageSquare,
    title: "Chat and get answers",
    description:
      "Ask anything in plain English. Get precise answers with source citations your team can verify.",
  },
];

const testimonials = [
  {
    quote:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    name: "Jone K.",
    role: "Engineering Lead",
    initials: "JK",
  },
  {
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    name: "Samantha T.",
    role: "Head of Customer Success",
    initials: "ST",
  },
  {
    quote:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    name: "Priya M.",
    role: "Product Manager",
    initials: "PM",
  },
];

export const metadata = {
  title: "DocuMind — Chat with Your Documents Using AI",
  description:
    "Upload PDFs, build a shared knowledge base, and get instant AI-powered answers with source citations your team can trust.",
  openGraph: {
    title: "DocuMind — Chat with Your Documents Using AI",
    description:
      "Upload PDFs, build a shared knowledge base, and get instant AI-powered answers with source citations your team can trust.",
    url: "https://documind-lac.vercel.app",
    siteName: "DocuMind",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocuMind — Chat with Your Documents Using AI",
    description:
      "Upload PDFs, build a shared knowledge base, and get instant AI-powered answers with source citations.",
  },
};
export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Chat with your documents,{" "}
            <span className="text-blue-600">instantly</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Upload PDFs, build a shared knowledge base, and get instant
            AI-powered answers — with source citations your team can trust.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Get Started Free →
            </Link>

            <a
              href="#how-it-works"
              className="text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Hero Demo Card */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-400">DocuMind Chat</span>
          </div>
          <div className="space-y-3 text-left text-sm">
            <div className="flex gap-3">
              <span className="shrink-0 font-medium text-gray-500">You</span>
              <p className="rounded-lg bg-white border border-gray-200 px-4 py-2 text-gray-700">
                What are the key findings in Q3 report?
              </p>
            </div>
            <div className="flex gap-3">
              <span className="shrink-0 font-medium text-blue-600">AI</span>
              <p className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2 text-gray-700">
                The Q3 report highlights a 24% revenue increase, driven by
                enterprise adoption...{" "}
                <span className="text-blue-600 underline cursor-pointer">
                  [Source: Q3_Report.pdf, p.4]
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything your team needs
            </h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto">
              DocuMind brings AI-powered search and chat to your documents — so
              your team stops hunting and starts finding.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
            <p className="mt-4 text-gray-600 max-w-xl mx-auto">
              Get from zero to AI-powered answers in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="flex flex-col items-center text-center"
              >
                {/* Step number bubble */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold mb-6">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <step.icon className="h-6 w-6 text-blue-600" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Connector line — visible only on desktop */}
          <div className="hidden sm:block relative -mt-48 mb-16 pointer-events-none">
            <div className="absolute inset-x-0 top-7 mx-auto max-w-lg border-t-2 border-dashed border-blue-200" />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Loved by teams who live in documents
            </h2>
            <p className="mt-4 text-gray-600">
              Here&apos;s what early users are saying.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-gray-600 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-blue-600 px-6 py-12 sm:px-8 sm:py-16 text-center shadow-lg">
          <h2 className="text-3xl font-bold text-white">
            Ready to make your documents talk?
          </h2>
          <p className="mt-4 text-blue-100 text-lg">
            Join teams who use DocuMind to find answers in seconds, not hours.
            Free to start — no credit card required.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Get Started Free →
          </Link>
        </div>
      </section>
    </>
  );
}
