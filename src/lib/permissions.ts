import { prisma } from "@/lib/prisma";

export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export async function checkUserPermission(
  userId: string,
  workspaceId: string,
  requiredRole: "viewer" | "member" | "admin" | "owner",
) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this workspace.");
  }
  const requiredRoleValue = ROLE_HIERARCHY[requiredRole];
  const userRoleValue = ROLE_HIERARCHY[membership.role];

  if (userRoleValue < requiredRoleValue) {
    throw new Error(
      `This action requires ${requiredRole} permissions or above.`,
    );
  }

  return membership;
}
