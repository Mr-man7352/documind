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
        where: { workspaceId, status: "INDEXED" },
        select: { title: true },
        take: 10,
      });

      const titles = documents.map((d) => d.title).join("\n");

      const response = await openaiClient.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
          {
            role: "user",
            content: `Based on these document titles, generate 3-5 specific questions a team member might ask. Return as a JSON object with a "questions" key containing an array of strings.\n\nDocuments:\n${titles}`,
          },
        ],
        response_format: { type: "json_object" },
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
