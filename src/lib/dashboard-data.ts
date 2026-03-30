import { prisma } from "@/lib/prisma";

// ── 1. Stats Cards ──────────────────────────────────────────

export async function getDashboardStats(workspaceId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalDocuments, totalChunks, totalQueries, queriesToday] =
    await Promise.all([
      prisma.document.count({
        where: { workspaceId },
      }),

      prisma.document.aggregate({
        where: { workspaceId },
        _sum: { chunkCount: true },
      }),

      prisma.queryLog.count({
        where: { workspaceId },
      }),

      prisma.queryLog.count({
        where: {
          workspaceId,
          createdAt: { gte: today },
        },
      }),
    ]);

  return {
    totalDocuments,
    totalChunks: totalChunks._sum.chunkCount ?? 0,
    totalQueries,
    queriesToday,
  };
}

// ── 2. Queries Per Day (last 30 days) ───────────────────────

export async function getQueriesPerDay(workspaceId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const logs = await prisma.queryLog.findMany({
    where: {
      workspaceId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date string "YYYY-MM-DD"
  const grouped: Record<string, number> = {};
  for (const log of logs) {
    const key = log.createdAt.toISOString().slice(0, 10);
    grouped[key] = (grouped[key] ?? 0) + 1;
  }

  // Fill in missing days with 0
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, queries: grouped[key] ?? 0 });
  }

  return result;
}

// ── 3. Unanswered Questions (top 10) ────────────────────────

export async function getUnansweredQuestions(workspaceId: string) {
  const logs = await prisma.queryLog.findMany({
    where: {
      workspaceId,
      answeredSuccessfully: false,
    },
    orderBy: { createdAt: "desc" },
    select: { query: true },
    take: 10, // cap rows fetched — we only need top 10 after grouping
  });

  // Count occurrences of each query
  const counts: Record<string, number> = {};
  for (const log of logs) {
    const key = log.query.toLowerCase().trim();
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));
}

// ── 4. Recent Activity Feed (last 10) ───────────────────────

export async function getRecentActivity(workspaceId: string) {
  const [recentDocuments, recentConversations, recentMembers] =
    await Promise.all([
      prisma.document.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          title: true,
          createdAt: true,
          uploadedBy: { select: { name: true } },
        },
      }),

      prisma.conversation.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          title: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),

      prisma.membership.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);

  const events = [
    ...recentDocuments.map((d) => ({
      type: "upload" as const,
      label: `${d.uploadedBy?.name ?? "Someone"} uploaded "${d.title}"`,
      at: d.createdAt,
    })),
    ...recentConversations.map((c) => ({
      type: "chat" as const,
      label: `${c.user?.name ?? "Someone"} started a conversation`,
      at: c.createdAt,
    })),
    ...recentMembers.map((m) => ({
      type: "join" as const,
      label: `${m.user?.name ?? "Someone"} joined the workspace`,
      at: m.createdAt,
    })),
  ];

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 10);
}
