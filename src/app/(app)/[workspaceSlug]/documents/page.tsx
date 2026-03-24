import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await requireAuth();

  // Make sure the workspace exists and this user is a member
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { memberships: { where: { userId: session.user.id } } },
  });

  if (!workspace || workspace.memberships.length === 0) notFound();

  // Fetch documents newest-first
  const documents = await prisma.document.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DocumentsClient
      workspaceSlug={workspaceSlug}
      initialDocuments={documents}
      userRole={workspace.memberships[0].role}
    />
  );
}
