import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

// This page runs after Google/GitHub OAuth completes.
// It checks if the user already has a workspace and routes them accordingly.
export default async function AuthCallbackPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Find the first workspace this user is a member of
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (membership) {
    redirect(`/${membership.workspace.slug}/dashboard`);
  }

  // New user with no workspace → go to onboarding
  redirect("/onboarding");
}
