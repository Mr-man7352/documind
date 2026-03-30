"use client";

import { useCallback, useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { cn, ACCEPTED_MIME } from "@/lib/utils";

const ACCEPTED_TYPES = [".pdf", ".docx", ".txt", ".md", ".csv"];
const MAX_SIZE_MB = 5;
const MAX_FILES = 5;

interface FileState {
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface UploadDropzoneProps {
  workspaceSlug: string;
  onUploadComplete?: () => void;
}

// Uploads one file and reports progress. Returns a promise that resolves on success.
function uploadFile(
  file: File,
  workspaceSlug: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("workspaceSlug", workspaceSlug);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    // This fires repeatedly as bytes are sent
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        const responseBody = JSON.parse(xhr.responseText || "{}");
        reject(new Error(responseBody.error || "Upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error — please try again"));
    xhr.send(body);
  });
}

export function UploadDropzone({
  workspaceSlug,
  onUploadComplete,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_MIME.includes(file.type)) {
      return `"${file.name}" is not a supported format. Use PDF, DOCX, TXT, MD, or CSV.`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `"${file.name}" exceeds the ${MAX_SIZE_MB} MB limit.`;
    }
    return null;
  }

  const handleFiles = useCallback(
    async (incoming: File[]) => {
      if (isUploading) return;

      const limited = incoming.slice(0, MAX_FILES);

      // Build initial state — mark invalid files as errors immediately
      const initial: FileState[] = limited.map((file) => {
        const error = validateFile(file);
        return error
          ? { file, progress: 0, status: "error", error }
          : { file, progress: 0, status: "uploading" };
      });

      setFileStates(initial);
      setIsUploading(true);

      // Only upload valid files
      const validFiles = limited.filter(
        (_, i) => initial[i].status === "uploading",
      );

      await Promise.allSettled(
        validFiles.map((file) =>
          uploadFile(file, workspaceSlug, (progress) => {
            setFileStates((prev) =>
              prev.map((fs) => (fs.file === file ? { ...fs, progress } : fs)),
            );
          })
            .then(() => {
              setFileStates((prev) =>
                prev.map((fs) =>
                  fs.file === file
                    ? { ...fs, status: "done", progress: 100 }
                    : fs,
                ),
              );
            })
            .catch((err: Error) => {
              setFileStates((prev) =>
                prev.map((fs) =>
                  fs.file === file
                    ? { ...fs, status: "error", error: err.message }
                    : fs,
                ),
              );
            }),
        ),
      );

      setIsUploading(false);
      onUploadComplete?.();
    },
    [isUploading, workspaceSlug, onUploadComplete],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          isUploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          onChange={onInputChange}
          className="sr-only"
        />
        <UploadCloud
          className={cn(
            "h-10 w-10",
            isDragging ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragging
              ? "Drop your files here"
              : "Drag & drop files here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD, CSV · up to {MAX_SIZE_MB} MB · max {MAX_FILES}{" "}
            files at once
          </p>
        </div>
      </label>

      {fileStates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Uploads
            </p>
            {!isUploading && (
              <button
                onClick={() => setFileStates([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          {fileStates.map(({ file, progress, status, error }) => (
            <div key={file.name} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-3">
                {status === "done" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
                {status === "error" && (
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {status === "uploading" && (
                  <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                {status === "uploading" && (
                  <span className="text-xs text-muted-foreground">
                    {progress}%
                  </span>
                )}
              </div>
              {status === "uploading" && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
