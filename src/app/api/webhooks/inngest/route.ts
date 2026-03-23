import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { expireInvitations } from "@/inngest/expire-invitations";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [expireInvitations],
});
