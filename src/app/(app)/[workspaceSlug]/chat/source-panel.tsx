import { X, ExternalLink, FileText } from "lucide-react";
import { Source } from "./source-chips";
import Link from "next/link";

interface SourcePanelProps {
  source: Source | null;
  index: number;
  onClose: () => void;
}

export function SourcePanel({ source, index, onClose }: SourcePanelProps) {
  if (!source) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-80 z-50 bg-background border-l shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-4 border-b">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{source.title}</p>
              <p className="text-xs text-muted-foreground">
                Source [{index + 1}]
                {source.pageNumber != null && ` · Page ${source.pageNumber}`}
                {" · "}
                {Math.round(source.score * 100)}% match
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chunk text */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {source.text}
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Link
            href={`/api/documents/${source.documentId}/view`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open Document
          </Link>
        </div>
      </div>
    </>
  );
}
