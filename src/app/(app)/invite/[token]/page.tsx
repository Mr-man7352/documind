import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 1. Look up the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: true },
  });

  // 2. Invalid token
  if (!invitation) {
    return (
      <InviteError message="This invitation link is invalid or has already been used." />
    );
  }

  // 3. Expired — update status only if it hasn't been marked yet
  const isExpired =
    invitation.status === "EXPIRED" || invitation.expiresAt < new Date();

  if (isExpired) {
    if (invitation.status !== "EXPIRED") {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
    }
    return (
      <InviteError message="This invitation has expired. Please ask the workspace owner to send a new one." />
    );
  }

  // 4. Check if user is logged in
  const session = await getSession();

  if (!session?.user?.id) {
    // Not logged in → send them to login, then come back here
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const userId = session.user.id;

  // 5. Check if user is already a member
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: invitation.workspaceId,
      },
    },
  });

  if (existingMembership) {
    // Already a member — just send them to the workspace
    redirect(`/${invitation.workspace.slug}/dashboard`);
  }

  // 6. Accept the invitation — create membership + mark invite accepted
  await prisma.membership.create({
    data: {
      userId,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
    },
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED" },
  });

  // 7. Redirect to the workspace
  redirect(`/${invitation.workspace.slug}/dashboard`);
}

// ─── Error UI ─────────────────────────────────────────────

function InviteError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Invalid Invitation
        </h1>
        <p className="text-gray-500 text-sm">{message}</p>

        <Link
          href="/login"
          className="mt-6 inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}
