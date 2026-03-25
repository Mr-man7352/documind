import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch the private blob server-side using the token
  const blobResponse = await fetch(document.fileUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!blobResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch file" },
      { status: 502 },
    );
  }

  const contentType =
    blobResponse.headers.get("Content-Type") ?? "application/octet-stream";

  return new NextResponse(blobResponse.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${document.title}"`,
    },
  });
}
