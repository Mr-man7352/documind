import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChatClient } from "./chat-client";

export default async function ChatPage({
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

  return (
    <div className="flex flex-col h-full -m-8 p-8">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about your documents.
        </p>
      </div>
      <ChatClient workspaceId={workspace.id} />
    </div>
  );
}
