"use client";

import { useState } from "react";
import { createApiKey, revokeApiKey } from "@/actions/api-keys";

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  rateLimit: number;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

type Props = {
  workspaceId: string;
  isOwner: boolean;
  initialKeys: ApiKey[];
};

export function ApiKeysClient({ workspaceId, isOwner, initialKeys }: Props) {
  const [keys, setKeys] = useState(initialKeys);
  const [loading, setLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null); // shown once in modal
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const activeKeys = keys.filter((k) => !k.revokedAt);
  const atLimit = activeKeys.length >= 3;

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!keyName.trim()) return;
    setLoading(true);
    try {
      const result = await createApiKey(workspaceId, keyName.trim());
      // Add to list with masked display (keyPrefix only)
      setKeys((prev) => [
        {
          id: crypto.randomUUID(), // temp id until page refreshes
          name: keyName.trim(),
          keyPrefix: result.keyPrefix,
          rateLimit: 100,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
          revokedAt: null,
        },
        ...prev,
      ]);
      setKeyName("");
      setNewKey(result.key); // show in modal — only time it's visible
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to create key.",
        "error",
      );
    }
    setLoading(false);
  }

  async function handleRevoke(keyId: string, prefix: string) {
    try {
      await revokeApiKey(keyId, workspaceId);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k,
        ),
      );
      showToast(`Key ${prefix}••• revoked.`, "success");
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to revoke key.",
        "error",
      );
    }
  }

  function handleCopy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-10 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Widget API Keys</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate keys to authenticate the embeddable chat widget on your
          website. Maximum 3 active keys per workspace.
        </p>
      </div>

      {/* ── Create Key Form ── */}
      {isOwner && (
        <form
          onSubmit={handleCreate}
          className="flex gap-3 items-end flex-wrap"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Key name</label>
            <input
              type="text"
              required
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g. Production website"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || atLimit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating…" : "Generate key"}
          </button>
          {atLimit && (
            <p className="text-xs text-amber-600 self-center">
              3 active keys reached. Revoke one to create a new key.
            </p>
          )}
        </form>
      )}

      {/* ── Keys Table ── */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {keys.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-6 text-center">
            No API keys yet. Generate one above to get started.
          </p>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  {k.keyPrefix}•••••••••••••••••••••••
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Created{" "}
                  {new Date(k.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {k.lastUsedAt && (
                    <>
                      {" "}
                      · Last used{" "}
                      {new Date(k.lastUsedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {k.revokedAt ? (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                    Revoked
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                )}
                {isOwner && !k.revokedAt && (
                  <button
                    onClick={() => handleRevoke(k.id, k.keyPrefix)}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── New Key Modal (shown once) ── */}
      {newKey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Your new API key
            </h3>
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
              ⚠ Copy this key now. You won&apos;t be able to see it again after
              closing this window.
            </p>
            <div className="flex gap-2 items-center mb-6">
              <code className="flex-1 bg-gray-100 rounded-md px-3 py-2 text-sm font-mono break-all text-gray-800">
                {newKey}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setNewKey(null);
                  setCopied(false);
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                I've saved it, close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
