import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement in US-15 — widget chat endpoint
  // Will validate X-API-Key header, check rate limit, then run RAG pipeline
  return NextResponse.json({
    message: "Widget endpoint — not yet implemented",
  });
}
