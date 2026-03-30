import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { openaiClient } from "@/lib/openai";

export const SUGGESTIONS_TTL = 60 * 60 * 24; // 24 hours

export function suggestionsKey(workspaceId: string) {
  return `suggestions:${workspaceId}`;
}

export const generateSuggestions = inngest.createFunction(
  {
    id: "generate-suggestions",
    name: "Generate Starter Questions",
    triggers: [{ event: "document.indexed" }],
  },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    const questions = await step.run("generate-via-llm", async () => {
      // Grab up to 10 document titles from this workspace
      const documents = await prisma.document.findMany({
        select: { title: true, summary: true },
        where: { workspaceId, status: "INDEXED" },
        orderBy: { createdAt: "desc" },
        take: 3,
      });

      const context = documents
        .map((d) => `Title: ${d.title}\nSummary: ${d.summary ?? "N/A"}`)
        .join("\n\n");

      const response = await openaiClient.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "user",
            content: `Based on these documents, generate upto 4 specific questions a team member might ask. Questions should be short declarative phrases that would appear in a document. Return as a JSON object with a "questions" key containing an array of strings.\n\nDocuments:\n${context}`,
          },
        ],
        response_format: {
          type: "json_object",
        },
      });

      const raw = response.choices[0].message.content ?? "{}";
      const parsed = JSON.parse(raw);

      // The model may return { questions: [...] } or just an array
      const list: string[] = Array.isArray(parsed)
        ? parsed
        : (parsed.questions ?? []);

      return list.slice(0, 5);
    });

    await step.run("cache-in-redis", async () => {
      await redis.set(suggestionsKey(workspaceId), questions, {
        ex: SUGGESTIONS_TTL,
      });
    });

    return { workspaceId, count: questions.length };
  },
);
