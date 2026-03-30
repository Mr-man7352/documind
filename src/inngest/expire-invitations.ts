import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";

export const expireInvitations = inngest.createFunction(
  {
    id: "expire-invitations",
    name: "Expire Stale Invitations",
    triggers: [{ cron: "0 0 * * *" }], // runs every day at midnight
  },
  async () => {
    const result = await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    return { expired: result.count };
  },
);
