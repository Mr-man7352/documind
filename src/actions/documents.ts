"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { checkUserPermission } from "@/lib/permissions";
import { inngest } from "@/lib/inngest";
import { pineconeIndex } from "@/lib/pinecone";

export async function deleteDocument(documentId: string, workspaceId: string) {
  const session = await requireAuth();

  // Confirm caller is Admin+ in this workspace
  await checkUserPermission(session.user.id, workspaceId, "admin");

  // Fetch the document — confirm it actually belongs to this workspace
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document || document.workspaceId !== workspaceId) {
    return { error: "Document not found." };
  }

  // Delete vectors from Pinecone (best-effort — log but don't block DB delete)
  try {
    const index = pineconeIndex.namespace(document.workspaceId);

    await index.deleteMany({
      filter: {
        documentId: documentId,
      },
    });
  } catch (err) {
    console.error("[deleteDocument] Pinecone delete failed:", err);
    // Acceptable: we still delete the DB record (eventual consistency)
  }
  // Delete document record from Postgres
  await prisma.document.delete({ where: { id: documentId } });

  return { success: true };
}

export async function reprocessDocument(
  documentId: string,
  workspaceId: string,
) {
  const session = await requireAuth();

  // Confirm caller is Member+ in this workspace
  await checkUserPermission(session.user.id, workspaceId, "member");

  // Fetch the document — confirm it belongs to this workspace
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document || document.workspaceId !== workspaceId) {
    return { error: "Document not found." };
  }

  console.log(
    `[reprocessDocument] User ${session.user.id} requested re-processing for document ${document.status} in workspace ${workspaceId}`,
  );
  if (document.status !== "INDEXED" && document.status !== "ERROR") {
    return { error: "Document is not in a re-processable state." };
  }
  // Reset status so the UI shows it's queued again
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "UPLOADED", errorMessage: null },
  });

  // Fire the Inngest event — this re-runs the full pipeline
  await inngest.send({
    name: "document.uploaded",
    data: { documentId },
  });

  return { success: true };
}
