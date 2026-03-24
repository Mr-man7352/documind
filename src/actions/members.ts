"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { checkUserPermission } from "@/lib/permissions";

// change role of a member

export async function changeRole(
  targetMembershipId: string,
  newRole: string,
  workspaceId: string,
) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Only admins and above can change roles
  await checkUserPermission(userId, workspaceId, "admin");

  const target = await prisma.membership.findUnique({
    where: {
      id: targetMembershipId,
    },
  });
  if (!target || target.workspaceId !== workspaceId) {
    throw new Error("Member not found.");
  }

  // Prevent an owner from demoting themselves if they're the last owner
  if (target.userId === userId && target.role === "owner") {
    const ownerCount = await prisma.membership.count({
      where: {
        workspaceId,
        role: "owner",
      },
    });
    if (ownerCount <= 1) {
      return { error: "You are the last owner. Transfer ownership first." };
    }
  }

  await prisma.membership.update({
    where: {
      id: targetMembershipId,
    },
    data: {
      role: newRole,
    },
  });

  return { success: true };
}

// remove a member from workspace

export async function removeMember(
  targetMembershipId: string,
  workspaceId: string,
) {
  const session = await requireAuth();
  const userId = session.user.id;

  // Only admins and above can remove members
  await checkUserPermission(userId, workspaceId, "admin");

  const target = await prisma.membership.findUnique({
    where: { id: targetMembershipId },
  });

  if (!target || target.workspaceId !== workspaceId) {
    return { error: "Member not found." };
  }

  // Cannot remove the last owner
  if (target.role === "owner") {
    const ownerCount = await prisma.membership.count({
      where: { workspaceId, role: "owner" },
    });
    if (ownerCount <= 1) {
      return { error: "Cannot remove the last owner of the workspace." };
    }
  }

  await prisma.membership.delete({
    where: { id: targetMembershipId },
  });

  return { success: true };
}
