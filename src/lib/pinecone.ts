import { Pinecone } from "@pinecone-database/pinecone";

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX;

if (!apiKey) throw new Error("Missing environment variable: PINECONE_API_KEY");
if (!indexName) throw new Error("Missing environment variable: PINECONE_INDEX");

const pinecone = new Pinecone({ apiKey });

export const pineconeIndex = pinecone.index({ name: indexName });
