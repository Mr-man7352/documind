import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { openaiClient } from "@/lib/openai";
import { pineconeIndex } from "@/lib/pinecone";
import { prisma } from "@/lib/prisma";
import { widgetRatelimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  // ── 1. Validate API key ──────────────────────────────────────
  const rawKey = req.headers.get("X-API-Key");
  // console.log("Received API key:", rawKey);

  if (!rawKey) {
    return NextResponse.json(
      { error: "Missing X-API-Key header" },
      { status: 401, headers: corsHeaders },
    );
  }

  // Find candidate keys by prefix (first 8 chars)
  const keyPrefix = rawKey.slice(0, 8);
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix, revokedAt: null },
  });

  // bcrypt compare against each candidate's stored hash
  let matchedKey = null;
  for (const candidate of candidates) {
    const valid = await bcrypt.compare(rawKey, candidate.keyHash);
    if (valid) {
      matchedKey = candidate;
      break;
    }
  }

  if (!matchedKey) {
    return NextResponse.json(
      { error: "Invalid or revoked API key" },
      { status: 401, headers: corsHeaders },
    );
  }

  // ── 2. Rate limit check ──────────────────────────────────────
  const { success, remaining } = await widgetRatelimit.limit(matchedKey.id);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests — slow down and try again in a moment." },
      { status: 429, headers: corsHeaders },
    );
  }

  // ── 3. Parse request body ────────────────────────────────────
  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return NextResponse.json(
      { error: "No user message found" },
      { status: 400, headers: corsHeaders },
    );
  }

  // ── 4. RAG pipeline (same as /api/chat) ─────────────────────
  const embeddingResponse = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: lastUserMessage.content,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  const index = pineconeIndex.namespace(matchedKey.workspaceId);
  const queryResult = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });

  const chunks = queryResult.matches
    .filter((m) => m.score && m.score > 0.35)
    .map((m) => ({
      ...(m.metadata as {
        text: string;
        title: string;
        documentId: string;
        pageNumber?: number;
      }),
      score: m.score ?? 0,
    }));

  console.log("Filtered chunks:", chunks[0]);
  const contextBlock =
    chunks.length > 0
      ? chunks
          .map((c, i) => `[${i + 1}] (from "${c.title}")\n${c.text}`)
          .join("\n\n")
      : "No relevant document context found.";

  const systemPrompt = `You are a helpful assistant that answers questions based on the user's documents.

Use the following document excerpts to answer the user's question. If the answer is not found in the context, say so honestly — do not make up information.

<context>
${contextBlock}
</context>`;

  // ── 5. Stream response ───────────────────────────────────────
  // Update lastUsedAt in the background (non-blocking)
  prisma.apiKey
    .update({
      where: { id: matchedKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  // const result = streamText({
  //   model: openai("gpt-5-nano"),
  //   system: systemPrompt,
  //   messages, // simple { role, content }[] works directly with streamText
  //   maxOutputTokens: 1000,
  // });

  // // toTextStreamResponse streams plain text tokens — easy to read in vanilla JS
  // const response = result.toTextStreamResponse();

  // // Attach CORS + sources as a header so the widget can display citations
  // const sourcesHeader = JSON.stringify(
  //   chunks.map((c) => ({ title: c.title, documentId: c.documentId })),
  // );

  // response.headers.set("Access-Control-Allow-Origin", "*");
  // response.headers.set("X-Sources", sourcesHeader);

  // return response;

  const sourcesHeader = JSON.stringify(
    chunks.map((c) => ({ title: c.title, documentId: c.documentId })),
  );

  const { textStream } = streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages,
    maxOutputTokens: 1000,
  });

  // Manually pipe the AI text stream into a proper byte stream
  // This avoids issues with toTextStreamResponse() in some Next.js setups
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "X-Sources", // ← required for JS to read custom headers
      "X-Sources": sourcesHeader,
    },
  });
}
