import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { isValidSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
  }

  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (existingWorkspace) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true });
}
