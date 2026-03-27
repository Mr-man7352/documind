import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { openaiClient } from "@/lib/openai";
import { getSession } from "@/lib/auth-session";
import {
  suggestionsKey,
  SUGGESTIONS_TTL,
} from "@/inngest/generate-suggestions";

const FALLBACK_QUESTIONS = [
  "What documents should I upload to get started?",
  "How can this workspace help my team?",
  "What kinds of questions can I ask the AI?",
  "How do I invite team members to this workspace?",
  "What file types are supported for upload?",
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  // 1. Cache hit → return immediately
  const cached = await redis.get<string[]>(suggestionsKey(workspaceId));
  if (cached) {
    return NextResponse.json({ questions: cached, cached: true });
  }

  // 2. No documents yet → return onboarding prompts
  const docCount = await prisma.document.count({
    where: { workspaceId, status: "INDEXED" },
  });

  if (docCount === 0) {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS, cached: false });
  }

  // 3. Cache miss but docs exist → generate on-the-fly and cache
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
  const questions: string[] = Array.isArray(parsed)
    ? parsed
    : (parsed.questions ?? []);
  const final = questions.slice(0, 5);

  await redis.set(suggestionsKey(workspaceId), final, { ex: SUGGESTIONS_TTL });

  return NextResponse.json({ questions: final, cached: false });
}
