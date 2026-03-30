"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  RotateCcw,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_HIERARCHY } from "@/lib/roles";
import { deleteDocument, reprocessDocument } from "@/actions/documents";

// ── Types ──────────────────────────────────────────────────

interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number | null;
  status: string;
  createdAt: Date;
  uploadedBy: { name: string } | null;
}

interface DocumentsClientProps {
  workspaceSlug: string;
  workspaceId: string;
  initialDocuments: Document[];
  userRole: string;
}

// ── Helpers (unchanged) ────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf")
    return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes("wordprocessingml"))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType === "text/csv")
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  if (mimeType === "text/plain" || mimeType === "text/markdown")
    return <FileCode className="h-4 w-4 text-gray-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  UPLOADED: { label: "Uploaded", className: "bg-gray-100 text-gray-600" },
  PARSING: { label: "Parsing…", className: "bg-blue-100 text-blue-700" },
  CHUNKING: { label: "Chunking…", className: "bg-blue-100 text-blue-700" },
  EMBEDDING: {
    label: "Embedding…",
    className: "bg-yellow-100 text-yellow-700",
  },
  INDEXED: { label: "Ready", className: "bg-green-100 text-green-700" },
  ERROR: { label: "Failed", className: "bg-red-100 text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────

export function DocumentsClient({
  workspaceSlug,
  workspaceId,
  initialDocuments,
  userRole,
}: DocumentsClientProps) {
  const router = useRouter();

  // ── Permissions (derived from role hierarchy) ──
  const canUpload =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >=
    ROLE_HIERARCHY["member"];
  const canDelete =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >=
    ROLE_HIERARCHY["admin"];
  const canReprocess =
    ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] >=
    ROLE_HIERARCHY["member"];

  // ── Local document list (used for optimistic updates) ──
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);

  // When the server re-fetches (router.refresh), sync local state
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  // ── Dropdown state ──
  // Tracks which row's three-dot menu is open (null = all closed)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Close the open dropdown when the user clicks anywhere outside it
  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-dropdown]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // ── Delete modal state ──
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  // While a delete is in-flight, this ID gets an opacity-0 CSS class (the fade)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // ── Re-process state ──
  // A Set of document IDs currently being re-processed (shows spinner)
  const [reprocessingIds, setReprocessingIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Upload complete ──
  function handleUploadComplete() {
    router.refresh();
  }

  // ── Delete handlers ──

  function openDeleteModal(doc: Document) {
    setDeleteTarget({ id: doc.id, title: doc.title });
    setConfirmText("");
    setOpenMenuId(null); // close the dropdown first
  }

  function closeDeleteModal() {
    if (isDeleting) return; // don't allow closing while in-flight
    setDeleteTarget(null);
    setConfirmText("");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { id: targetId } = deleteTarget;

    setIsDeleting(true);
    setDeleteTarget(null); // close the modal immediately
    setConfirmText("");
    setPendingDeleteId(targetId); // row starts fading out (CSS transition)

    const result = await deleteDocument(targetId, workspaceId);

    if (result?.error) {
      // Server failed — stop the fade, row comes back
      setPendingDeleteId(null);
      alert(`Could not delete document: ${result.error}`);
    } else {
      // Success — remove the row from local state
      setDocuments((prev) => prev.filter((d) => d.id !== targetId));
      setPendingDeleteId(null);
    }

    setIsDeleting(false);
  }

  // ── Re-process handler ──

  async function handleReprocess(doc: Document) {
    setOpenMenuId(null); // close the dropdown
    setReprocessingIds((prev) => new Set(prev).add(doc.id));

    const result = await reprocessDocument(doc.id, workspaceId);

    setReprocessingIds((prev) => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });

    if (result?.error) {
      alert(`Could not re-process: ${result.error}`);
    } else {
      router.refresh(); // refresh to show the new UPLOADED status
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload files to your knowledge base. The AI will learn from them once
          processed.
        </p>
      </div>

      {/* ── Upload zone (hidden for viewers) ── */}
      {canUpload && (
        <UploadDropzone
          workspaceSlug={workspaceSlug}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* ── Document list ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </h2>
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            No documents yet. Upload your first file above.
          </div>
        ) : (
          <div className="rounded-xl border overflow-visible">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    By
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr
                    key={doc.id}
                    className={cn(
                      "bg-card hover:bg-muted/30 transition-all duration-300",
                      // Fade out when this row's delete is in-flight
                      pendingDeleteId === doc.id && "opacity-0",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon mimeType={doc.fileType} />
                        {doc.status === "INDEXED" ? (
                          <Link
                            href={`/api/documents/${doc.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium max-w-[240px] hover:underline text-primary"
                          >
                            {doc.title}
                          </Link>
                        ) : (
                          <span className="truncate font-medium max-w-[240px]">
                            {doc.title}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                      {doc.uploadedBy?.name ?? "—"}
                    </td>

                    {/* ── Three-dot actions menu ── */}
                    <td className="px-4 py-3 text-right">
                      <div data-dropdown className="relative inline-block">
                        <button
                          data-dropdown
                          onClick={() =>
                            setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                          }
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          aria-label="Document actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown panel */}
                        {openMenuId === doc.id && (
                          <div
                            data-dropdown
                            className="absolute right-0 top-8 z-10 w-44 rounded-lg border bg-popover shadow-md py-1 text-sm"
                          >
                            {/* Re-process — only for INDEXED or ERROR, Member+ */}
                            {canReprocess &&
                              (doc.status === "INDEXED" ||
                                doc.status === "ERROR") && (
                                <button
                                  data-dropdown
                                  onClick={() => handleReprocess(doc)}
                                  disabled={reprocessingIds.has(doc.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-4 w-4",
                                      reprocessingIds.has(doc.id) &&
                                        "animate-spin",
                                    )}
                                  />
                                  {reprocessingIds.has(doc.id)
                                    ? "Queuing…"
                                    : "Re-process"}
                                </button>
                              )}

                            {/* Delete — Admin+ only */}
                            {canDelete && (
                              <button
                                data-dropdown
                                onClick={() => openDeleteModal(doc)}
                                className="flex w-full items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}

                            {/* Fallback if no actions available */}
                            {!canDelete &&
                              !(
                                canReprocess &&
                                (doc.status === "INDEXED" ||
                                  doc.status === "ERROR")
                              ) && (
                                <span className="block px-3 py-2 text-muted-foreground">
                                  No actions available
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Delete document
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will permanently remove the file and all its AI vectors.
                  This cannot be undone.
                </p>
              </div>
              <button
                onClick={closeDeleteModal}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  {deleteTarget.title}
                </span>{" "}
                to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={deleteTarget.title}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                autoFocus
                // Allow pressing Enter to confirm when text matches
                onKeyDown={(e) => {
                  if (e.key === "Enter" && confirmText === deleteTarget.title) {
                    handleDelete();
                  }
                  if (e.key === "Escape") closeDeleteModal();
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-md text-sm border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== deleteTarget.title || isDeleting}
                className="px-4 py-2 rounded-md text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
