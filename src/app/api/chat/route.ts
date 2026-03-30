import { streamText, convertToModelMessages, UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { openaiClient } from "@/lib/openai";
import { pineconeIndex } from "@/lib/pinecone";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-session";
import { chatRatelimit } from "@/lib/ratelimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 requests per 60 seconds per user
  const { success } = await chatRatelimit.limit(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests — please slow down." },
      { status: 429 },
    );
  }

  const {
    messages,
    workspaceId,
    conversationId,
    documentId,
  }: {
    messages: UIMessage[];
    workspaceId: string;
    conversationId: string;
    documentId?: string;
  } = await req.json();

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  // Verify user is a member of this workspace
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this workspace." },
      { status: 403 },
    );
  }

  // Verify conversation ownership (if resuming an existing conversation)
  if (conversationId) {
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (
      existingConversation &&
      (existingConversation.userId !== session.user.id ||
        existingConversation.workspaceId !== workspaceId)
    ) {
      return NextResponse.json(
        { error: "You do not have access to this conversation." },
        { status: 403 },
      );
    }
  }

  // Embed the last user message
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  if (!lastUserMessage) {
    return NextResponse.json(
      { error: "No user message found" },
      { status: 400 },
    );
  }

  // Extract plain text from the UIMessage parts
  const lastMessageText = lastUserMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join(" ");
  console.log("Last message text:", lastMessageText);

  // Fetch selected document summary for query enhancement
  let queryText = lastMessageText;
  if (documentId) {
    const document = await prisma.document.findUnique({
      where: { id: documentId, workspaceId },
      select: { summary: true, title: true },
    });
    if (document?.summary) {
      const rewriteResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "system",
            content:
              "You rewrite user question into detailed search query for fetching relevant RAG chunks. Note query should be declarative phrases that would appear in a document. Use the document summary as context to make the query more specific. Return only the rewritten query — no explanation.",
          },
          {
            role: "user",
            content: `Document summary: ${document.summary}\n\nUser question: ${lastMessageText}`,
          },
        ],
      });
      queryText =
        rewriteResponse.choices[0]?.message?.content?.trim() ?? lastMessageText;
      console.log("Rewritten query text:", queryText);
    }
  }

  const embeddingResponse = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: queryText,
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Query Pinecone for top 5 relevant chunks in this workspace
  const index = pineconeIndex.namespace(workspaceId);

  const queryResult = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
    ...(documentId && { filter: { documentId: { $eq: documentId } } }),
  });

  const chunks = queryResult.matches
    .filter((m) => m.score && m.score > 0.2)
    .map((m) => ({
      ...(m.metadata as {
        text: string;
        title: string;
        documentId: string;
        pageNumber?: number;
        chunkIndex?: number;
      }),
      score: m.score ?? 0,
      vectorId: m.id,
    }));

  // Build system prompt with retrieved context
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

  // Stream the response
  const startTime = Date.now();
  const result = streamText({
    model: openai("gpt-5-nano"), // will use the cheapest available gpt-5 model
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 1500,
    onFinish: async ({ text, usage }) => {
      // Persist conversation and messages asynchronously (non-blocking)
      console.log(text);

      try {
        const userId = session.user.id;

        // Manual find-or-create (upsert uses transactions, not supported in HTTP mode)
        const existing = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        // Verify conversation belongs to this user and workspace
        if (
          existing &&
          (existing.userId !== userId || existing.workspaceId !== workspaceId)
        ) {
          console.error("Conversation ownership mismatch");
          return;
        }

        if (!existing) {
          await prisma.conversation.create({
            data: {
              id: conversationId,
              workspaceId,
              userId,
              title: lastMessageText.slice(0, 80),
            },
          });
        }
        // Only save the NEW messages — last user message + this assistant response

        // transaction is not supported in edge runtime, so we do sequential operations with best effort to maintain consistency
        await prisma.message.create({
          data: {
            role: "user",
            content: lastMessageText,
            conversationId,
            userId,
          },
        });

        await prisma.message.create({
          data: {
            role: "assistant",
            content: text,
            conversationId,
            sources: chunks.map((c) => ({
              title: c.title,
              documentId: c.documentId,
              pageNumber: c.pageNumber ?? null,
              chunkIndex: c.chunkIndex ?? null,
              score: c.score,
              text: c.text,
              vectorId: c.vectorId,
            })),
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        await prisma.queryLog.create({
          data: {
            query: lastMessageText,
            answeredSuccessfully: chunks.some((c) => c.score > 0.2),
            responseTimeMs: Date.now() - startTime,
            tokenCount: usage.totalTokens,
            workspaceId,
            userId: session.user.id,
          },
        });
      } catch (err) {
        console.error("Failed to persist conversation:", err);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) =>
      part.type === "text-start" ? { sources: chunks } : undefined,
  });
}
