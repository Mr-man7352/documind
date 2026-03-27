import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { expireInvitations } from "@/inngest/expire-invitations";
import { processDocument } from "@/inngest/process-document";
import { generateSuggestions } from "@/inngest/generate-suggestions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [expireInvitations, processDocument, generateSuggestions],
});
