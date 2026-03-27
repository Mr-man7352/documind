import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import {
  getDashboardStats,
  getQueriesPerDay,
  getUnansweredQuestions,
  getRecentActivity,
} from "@/lib/dashboard-data";
import { StatsCards } from "./stats-cards";
import { QueriesChart } from "./queries-chart";
import { UnansweredQuestions } from "./unanswered-questions";
import { RecentActivity } from "./recent-activity";

async function DashboardContent({ workspaceId }: { workspaceId: string }) {
  const [stats, chartData, unansweredQuestions, recentActivity] =
    await Promise.all([
      getDashboardStats(workspaceId),
      getQueriesPerDay(workspaceId),
      getUnansweredQuestions(workspaceId),
      getRecentActivity(workspaceId),
    ]);

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      <QueriesChart data={chartData} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UnansweredQuestions questions={unansweredQuestions} />
        <RecentActivity events={recentActivity} />
      </div>
    </div>
  );
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">Workspace not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{workspace.name}</h1>
        <p className="text-sm text-muted-foreground">Workspace overview</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent workspaceId={workspace.id} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
