"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────
interface Document {
  id: string;
  title: string;
  fileType: string;
  fileSize: number | null;
  status: string;
  createdAt: Date;
}

interface DocumentsClientProps {
  workspaceSlug: string;
  initialDocuments: Document[];
  userRole: string;
}

// ── Helpers ────────────────────────────────────────────────

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
  initialDocuments,
  userRole,
}: DocumentsClientProps) {
  const router = useRouter();
  const canUpload = userRole !== "viewer";

  // Called by the dropzone when all files finish uploading
  function handleUploadComplete() {
    router.refresh(); // tells Next.js to re-run the server component and re-fetch the document list
  }

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
            {initialDocuments.length} document
            {initialDocuments.length !== 1 ? "s" : ""}
          </h2>
          <button
            onClick={() => router.refresh()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {initialDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
            No documents yet. Upload your first file above.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
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
                </tr>
              </thead>
              <tbody className="divide-y">
                {initialDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="bg-card hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon mimeType={doc.fileType} />
                        <span className="truncate font-medium max-w-[240px]">
                          {doc.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
