"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export async function getConversations(workspaceId: string) {
  const session = await requireAuth();

  return prisma.conversation.findMany({
    where: {
      workspaceId,
      userId: session.user.id,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      updatedAt: true,
    },
  });
}

export async function deleteConversation(
  conversationId: string,
  workspaceSlug: string,
) {
  const session = await requireAuth();

  // Ownership check — only delete if this conversation belongs to the current user
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error("Not found or unauthorized");
  }

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  redirect(`/${workspaceSlug}/chat`);
}
