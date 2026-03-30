import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";
import { ACCEPTED_MIME } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // 1. Auth check
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse the form data
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const workspaceSlug = formData.get("workspaceSlug") as string;

  if (!file || !workspaceSlug) {
    return NextResponse.json(
      { error: "Missing file or workspace" },
      { status: 400 },
    );
  }

  // 3. Validate type and size (server-side, can't trust the client)
  if (!ACCEPTED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large (max 10 MB)" },
      { status: 400 },
    );
  }

  // 4. Check workspace membership and role
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { memberships: { where: { userId: session.user.id } } },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const membership = workspace.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  if (membership.role === "viewer") {
    return NextResponse.json(
      { error: "Viewers cannot upload" },
      { status: 403 },
    );
  }

  // 5. Enforce 50-document limit
  const docCount = await prisma.document.count({
    where: { workspaceId: workspace.id },
  });
  if (docCount >= 10) {
    return NextResponse.json(
      { error: "Document limit reached. Please upgrade." },
      { status: 403 },
    );
  }

  // 6. Upload to Vercel Blob
  const blob = await put(file.name, file, {
    access: "private",
    allowOverwrite: true,
  });

  // 7. Create DB record
  const document = await prisma.document.create({
    data: {
      title: file.name,
      fileUrl: blob.url,
      fileType: file.type,
      fileSize: file.size,
      status: "UPLOADED",
      workspaceId: workspace.id,
      uploadedById: session.user.id,
    },
  });

  // 8. Trigger the processing pipeline
  await inngest.send({
    name: "document.uploaded",
    data: { documentId: document.id },
  });

  return NextResponse.json({ success: true });
}
