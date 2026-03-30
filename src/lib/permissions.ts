import { prisma } from "@/lib/prisma";
import { ROLE_HIERARCHY } from "@/lib/roles";

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
  const userRoleValue = ROLE_HIERARCHY[membership.role as keyof typeof ROLE_HIERARCHY];

  if (userRoleValue === undefined) {
    throw new Error(`Unrecognised role "${membership.role}" on membership.`);
  }

  if (userRoleValue < requiredRoleValue) {
    throw new Error(
      `This action requires ${requiredRole} permissions or above.`,
    );
  }

  return membership;
}
