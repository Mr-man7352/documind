import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";
import { QueryChart } from "./query-chart";
import { UnansweredTable } from "./unanswered-table";
import { DateRangeFilter } from "./date-range-filter";
import Link from "next/link";

type Range = "7d" | "30d" | "90d";

function getRangeDate(range: Range): Date {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  const { workspaceSlug } = await params;
  const { range: rangeParam } = await searchParams;

  const session = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { memberships: { where: { userId: session.user.id } } },
  });

  if (!workspace || workspace.memberships.length === 0) redirect("/");

  const role = workspace.memberships[0].role;
  if (!["owner", "admin"].includes(role)) {
    redirect(`/${workspaceSlug}/dashboard`);
  }

  const range = (
    ["7d", "30d", "90d"].includes(rangeParam ?? "") ? rangeParam : "30d"
  ) as Range;
  const since = getRangeDate(range);

  // ── Fetch all logs in range ──────────────────────────────
  const logs = await prisma.queryLog.findMany({
    where: { workspaceId: workspace.id, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });

  // ── Summary stats ─────────────────────────────────────────
  const totalQueries = logs.length;
  const successCount = logs.filter((l) => l.answeredSuccessfully).length;
  const successRate =
    totalQueries > 0 ? Math.round((successCount / totalQueries) * 100) : 0;

  const logsWithTime = logs.filter((l) => l.responseTimeMs != null);
  const avgResponseTime =
    logsWithTime.length > 0
      ? Math.round(
          logsWithTime.reduce((sum, l) => sum + (l.responseTimeMs ?? 0), 0) /
            logsWithTime.length,
        )
      : null;

  // ── Daily breakdown for chart ─────────────────────────────
  const dailyMap = new Map<string, { success: number; failure: number }>();
  for (const log of logs) {
    const day = log.createdAt.toISOString().slice(0, 10); // "2025-01-15"
    const entry = dailyMap.get(day) ?? { success: 0, failure: 0 };
    if (log.answeredSuccessfully) entry.success++;
    else entry.failure++;
    dailyMap.set(day, entry);
  }
  const dailyData = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  // ── Top unanswered questions ──────────────────────────────
  const questionMap = new Map<
    string,
    { count: number; first: Date; last: Date }
  >();
  for (const log of logs.filter((l) => !l.answeredSuccessfully)) {
    const existing = questionMap.get(log.query);
    if (existing) {
      existing.count++;
      if (log.createdAt < existing.first) existing.first = log.createdAt;
      if (log.createdAt > existing.last) existing.last = log.createdAt;
    } else {
      questionMap.set(log.query, {
        count: 1,
        first: log.createdAt,
        last: log.createdAt,
      });
    }
  }
  const unansweredQuestions = Array.from(questionMap.entries())
    .map(([query, data]) => ({ query, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // ── Render (placeholder UI for now) ──────────────────────
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-gray-600">
            Track usage, popular queries, and document performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter current={range} />

          <Link
            href={`/api/analytics/export?workspaceId=${workspace.id}&range=${range}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <AnalyticsClient
          totalQueries={totalQueries}
          successRate={successRate}
          avgResponseTime={avgResponseTime}
        />
      </div>
      <div className="mt-6">
        <UnansweredTable questions={unansweredQuestions} />
      </div>
    </div>
  );
}
