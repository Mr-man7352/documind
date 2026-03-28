"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ─── Helper: check caller is Owner of this workspace ──────────
async function requireOwner(workspaceId: string) {
  const session = await requireAuth();

  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
  });

  if (!membership || membership.role !== "owner") {
    throw new Error("Only workspace owners can manage API keys.");
  }

  return session;
}

// ─── Create API Key ────────────────────────────────────────────
export async function createApiKey(workspaceId: string, name: string) {
  await requireOwner(workspaceId);

  // Enforce max 3 active keys per workspace
  const activeCount = await prisma.apiKey.count({
    where: { workspaceId, revokedAt: null },
  });

  if (activeCount >= 3) {
    throw new Error("Maximum of 3 active API keys allowed per workspace.");
  }

  // Generate key: dk_ + 32 random alphanumeric chars (base64url = URL-safe)
  const rawKey = "dk_" + crypto.randomBytes(24).toString("base64url");

  // Store only the first 8 chars for display (e.g. "dk_a1b2c3")
  const keyPrefix = rawKey.slice(0, 8);

  // Hash the full key — this is what goes in the DB
  const keyHash = await bcrypt.hash(rawKey, 10);

  await prisma.apiKey.create({
    data: {
      name,
      keyPrefix,
      keyHash,
      workspaceId,
    },
  });

  // Return the full key ONCE — caller must show it to the user immediately
  // After this function returns, the raw key is gone forever
  return { key: rawKey, keyPrefix };
}

// ─── Revoke API Key ────────────────────────────────────────────
export async function revokeApiKey(apiKeyId: string, workspaceId: string) {
  await requireOwner(workspaceId);

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { revokedAt: new Date() },
  });
}

// ─── List API Keys (for settings page) ────────────────────────
export async function listApiKeys(workspaceId: string) {
  await requireOwner(workspaceId);

  return prisma.apiKey.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      rateLimit: true,
      lastUsedAt: true,
      createdAt: true,
      revokedAt: true,
      // ← keyHash is intentionally excluded — never send it to the client
    },
    orderBy: { createdAt: "desc" },
  });
}
