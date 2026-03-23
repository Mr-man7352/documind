import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { TeamSettingsClient } from "./team-settings-client";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await requireAuth();

  // Load workspace
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
  });

  if (!workspace) redirect("/onboarding");

  // Check current user's role
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId: workspace.id,
      },
    },
  });

  const canInvite =
    membership?.role === "owner" || membership?.role === "admin";

  // Load current members
  const members = await prisma.membership.findMany({
    where: { workspaceId: workspace.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  // Load pending invitations
  const invitations = await prisma.invitation.findMany({
    where: { workspaceId: workspace.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-gray-500">
        Manage workspace members and invitations.
      </p>

      <TeamSettingsClient
        workspaceId={workspace.id}
        canInvite={canInvite}
        members={members.map((m) => ({
          id: m.id,
          name: m.user.name ?? "Unknown",
          email: m.user.email ?? "",
          role: m.role,
          image: m.user.image ?? null,
        }))}
        invitations={invitations.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          createdAt: inv.createdAt.toISOString(),
          expiresAt: inv.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
