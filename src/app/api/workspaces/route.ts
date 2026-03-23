import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Free tier: max 3 workspaces per user
  const workspaceCount = await prisma.membership.count({
    where: { userId: session.user.id },
  });

  if (workspaceCount >= 3) {
    return NextResponse.json(
      {
        error:
          "Free plan is limited to 3 workspaces. Please upgrade to create more.",
      },
      { status: 403 },
    );
  }

  const { name, slug } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Workspace name must be at least 2 characters" },
      { status: 400 },
    );
  }

  if (
    !slug ||
    typeof slug !== "string" ||
    !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)
  ) {
    return NextResponse.json(
      { error: "Invalid workspace URL format" },
      { status: 400 },
    );
  }

  // Final uniqueness check (race condition guard)
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json(
      { error: "This URL is already taken" },
      { status: 409 },
    );
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
    },
  });

  await prisma.membership.create({
    data: {
      userId: session.user.id,
      workspaceId: workspace.id,
      role: "owner",
    },
  });

  return NextResponse.json({
    slug: workspace.slug,
    name: workspace.name,
  });
}
