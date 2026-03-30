"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { Resend } from "resend";
import { checkUserPermission } from "@/lib/permissions";

import InviteEmail from "@/emails/invite-email";

const resend = new Resend(process.env.RESEND_API_KEY);

const INVITABLE_ROLES = ["member", "viewer"] as const;
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function sendInvitation(
  email: string,
  workspaceId: string,
  role: string,
) {
  // 0. Validate the role — only "member" and "viewer" can be invited
  if (!INVITABLE_ROLES.includes(role as (typeof INVITABLE_ROLES)[number])) {
    return { error: "Invalid role. You can only invite members or viewers." };
  }

  const session = await requireAuth();
  const userId = session.user.id;

  // 1. Check the current user is Owner or Admin in this workspace
  try {
    await checkUserPermission(userId, workspaceId, "admin");
  } catch {
    return { error: "You don't have permission to invite members." };
  }

  // 2. Check if this person is already a member
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { memberships: { include: { user: true } } },
  });

  if (!workspace) {
    return { error: "Workspace not found." };
  }

  const alreadyMember = workspace.memberships.some(
    (m) => m.user.email === email,
  );

  if (alreadyMember) {
    return { error: "This person is already a member of the workspace." };
  }

  // 3. Handle duplicate pending invite — resend instead of erroring

  const existing = await prisma.invitation.findUnique({
    where: { email_workspaceId: { email, workspaceId } },
  });

  if (existing && existing.status === "PENDING") {
    //  update the existing invite's token and expiry
    const updatedInvite = await prisma.invitation.update({
      where: { id: existing.id },
      data: {
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS), // 7 days
      },
    });

    // resend the email with the new token
    try {
      await sendInviteEmail({
        email,
        workspaceName: workspace.name,
        inviterName: session.user.name ?? "Someone",
        token: updatedInvite.token,
        role,
      });
    } catch {
      return { error: "Failed to send invitation email. Please try again." };
    }

    return { success: true, resent: true };
  }

  // 4. Create a fresh invitation record

  const invitation = await prisma.invitation.create({
    data: {
      email,
      workspaceId,
      role,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS), // 7 days
      status: "PENDING",
    },
  });

  // 5. Send the email
  try {
    await sendInviteEmail({
      email,
      workspaceName: workspace.name,
      inviterName: session.user.name ?? "Someone",
      token: invitation.token,
      role,
    });
  } catch {
    // Email failed — delete the orphan invitation so user can retry
    await prisma.invitation.delete({ where: { id: invitation.id } });
    return { error: "Failed to send invitation email. Please try again." };
  }

  return { success: true, resent: false };
}

// ─── Revoke Invitation ─────────────────────────────────────

export async function revokeInvitation(invitationId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation) {
    return { error: "Invitation not found." };
  }

  // Only Owner/Admin can revoke
  try {
    await checkUserPermission(userId, invitation.workspaceId, "admin");
  } catch {
    return { error: "You don't have permission to revoke this invitation." };
  }

  await prisma.invitation.delete({
    where: { id: invitationId },
  });

  return { success: true };
}

// ─── Helper: Send the actual email ────────────────────────
async function sendInviteEmail({
  email,
  workspaceName,
  inviterName,
  token,
  role,
}: {
  email: string;
  workspaceName: string;
  inviterName: string;
  token: string;
  role: string;
}) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`;

  const { data, error } = await resend.emails.send({
    from: "DocuMind <onboarding@resend.dev>",
    to: email,
    subject: `${inviterName} invited you to join ${workspaceName} on DocuMind`,
    react: InviteEmail({
      workspaceName,
      inviterName,
      inviteUrl,
      role,
      expiresInDays: INVITE_EXPIRY_MS / (24 * 60 * 60 * 1000),
    }),
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

}
