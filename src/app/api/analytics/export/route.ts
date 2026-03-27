import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const range = searchParams.get("range") ?? "30d";

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  // Check membership + role
  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const logs = await prisma.queryLog.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const headers = [
    "id",
    "query",
    "answeredSuccessfully",
    "responseTimeMs",
    "tokenCount",
    "createdAt",
  ];
  const rows = logs.map((l) => [
    l.id,
    `"${l.query.replace(/"/g, '""')}"`, // escape quotes inside query text
    l.answeredSuccessfully,
    l.responseTimeMs ?? "",
    l.tokenCount ?? "",
    l.createdAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="query-log-${range}.csv"`,
    },
  });
}
