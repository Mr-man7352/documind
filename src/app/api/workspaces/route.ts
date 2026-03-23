import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string) {
  let slug = slugify(base);
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.workspace.findUnique({
      where: { slug: candidate },
    });
    if (!existing) return candidate;
    suffix++;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Workspace name must be at least 2 characters" },
      { status: 400 }
    );
  }

  const slug = await uniqueSlug(name.trim());

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "owner",
        },
      },
    },
  });

  return NextResponse.json({ slug: workspace.slug, name: workspace.name });
}
