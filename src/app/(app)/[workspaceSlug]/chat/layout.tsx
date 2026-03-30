import { requireAuth } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getConversations } from "@/actions/conversation";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatSidebarProvider } from "./chat-sidebar-context";

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await requireAuth();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    include: { memberships: { where: { userId: session.user.id } } },
  });

  if (!workspace || workspace.memberships.length === 0) notFound();

  const conversations = await getConversations(workspace.id);

  return (
    <ChatSidebarProvider>
      <div className="flex h-full -mx-2 my-0">
        <ConversationSidebar
          conversations={conversations}
          workspaceSlug={workspaceSlug}
        />
        <div className="flex-1 overflow-hidden p-4 md:p-8 pb-[unset] w-full">
          {children}
        </div>
      </div>
    </ChatSidebarProvider>
  );
}
