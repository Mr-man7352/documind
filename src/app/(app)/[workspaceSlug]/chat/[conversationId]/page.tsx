import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ChatClient } from "../chat-client";
import type { UIMessage } from "ai";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; conversationId: string }>;
}) {
  const { workspaceSlug, conversationId } = await params;
  const session = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { memberships: { where: { userId: session.user.id } } },
  });

  if (!workspace || workspace.memberships.length === 0) notFound();

  // Load conversation — security: must belong to this user AND this workspace
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (conversation && conversation.userId !== session.user.id) notFound();
  if (conversation && conversation.workspaceId !== workspace.id) notFound();

  const documents = await prisma.document.findMany({
    where: { workspaceId: workspace.id, status: "INDEXED" },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
  // Convert DB messages → UIMessage format that the AI SDK's useChat expects
  const initialMessages: UIMessage[] = (conversation?.messages ?? []).map(
    (msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts: [{ type: "text" as const, text: msg.content }],
      metadata: msg.sources ? { sources: msg.sources } : undefined,
    }),
  );

  return (
    <div className="flex flex-col h-full ">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions about your documents. This conversation is saved, so you
          can come back to it later.
        </p>
      </div>
      <ChatClient
        workspaceId={workspace.id}
        hasDocuments={documents.length > 0}
        documents={documents}
        conversationId={conversationId}
        workspaceSlug={workspace.slug}
        initialMessages={initialMessages}
      />
    </div>
  );
}
