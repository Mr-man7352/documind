import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { pineconeIndex } from "@/lib/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";

import mammoth from "mammoth";

export const processDocument = inngest.createFunction(
  {
    id: "process-document",
    name: "Process Document Pipeline",
    retries: 3,
    triggers: [{ event: "document.uploaded" }],
  },
  async ({ event, step }) => {
    const { documentId } = event.data;

    // Fetch the document record from DB
    const document = await step.run("fetch-document", async () => {
      return prisma.document.findUniqueOrThrow({ where: { id: documentId } });
    });

    try {
      // ── Stage 1: PARSING ──────────────────────────────────────────
      const rawText = await step.run("parse-document", async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "PARSING" },
        });

        const response = await fetch(document.fileUrl, {
          headers: {
            Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch file: ${response.status} ${response.statusText}`,
          );
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        console.log("Fetched buffer size:", buffer.length, "bytes");

        if (document.fileType === "application/pdf") {
          const pdfParse = require("pdf-parse/lib/pdf-parse.js");
          const result = await pdfParse(buffer);
          return result.text;
        }

        if (document.fileType.includes("wordprocessingml")) {
          const result = await mammoth.extractRawText({ buffer });
          return result.value;
        }

        // TXT, MD, CSV — plain text
        return buffer.toString("utf-8");
      });

      // ── Stage 2: CHUNKING ─────────────────────────────────────────
      const chunks = await step.run("chunk-document", async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "CHUNKING" },
        });

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });

        return splitter.splitText(rawText);
      });

      // ── Stage 3: EMBEDDING ────────────────────────────────────────
      const embeddings = await step.run("embed-chunks", async () => {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "EMBEDDING" },
        });

        const embedder = new OpenAIEmbeddings({
          model: "text-embedding-3-small",
          apiKey: process.env.OPENAI_API_KEY,
        });

        return embedder.embedDocuments(chunks);
      });

      // ── Stage 4: INDEXING ─────────────────────────────────────────
      await step.run("index-vectors", async () => {
        const index = pineconeIndex.namespace(document.workspaceId);

        const vectors = embeddings.map((values, i) => ({
          id: `${documentId}-chunk-${i}`,
          values,
          metadata: {
            workspaceId: document.workspaceId,
            documentId,
            chunkIndex: i,
            title: document.title,
            text: chunks[i],
          },
        }));

        // Upsert in batches of 100 (Pinecone limit)
        const BATCH_SIZE = 100;
        for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
          await index.upsert({ records: vectors.slice(i, i + BATCH_SIZE) });
        }

        await prisma.document.update({
          where: { id: documentId },
          data: {
            status: "INDEXED",
          },
        });

        await inngest.send({
          name: "document.indexed",
          data: { documentId, workspaceId: document.workspaceId },
        });
      });
    } catch (error) {
      // If any stage fails after all retries, mark document as ERROR
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "ERROR",
          errorMessage:
            error instanceof Error ? error.message : "Processing failed",
        },
      });
      throw error; // re-throw so Inngest marks the run as failed
    }
  },
);
