import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CORS headers — widget is called from third-party websites
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Browsers send a preflight OPTIONS request before the real GET
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Missing key" },
      { status: 400, headers: corsHeaders },
    );
  }

  // keyPrefix is the first 8 chars of the full key (e.g. "dk_a1b2c3")
  // It's safe to query by prefix — config data is not sensitive
  const keyPrefix = key.slice(0, 8);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyPrefix,
      revokedAt: null, // ignore revoked keys
    },
    select: {
      workspaceId: true,
      primaryColor: true,
      welcomeMessage: true,
      suggestedQuestions: true,
    },
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: "Invalid or revoked key" },
      { status: 404, headers: corsHeaders },
    );
  }

  return NextResponse.json(apiKey, { headers: corsHeaders });
}
