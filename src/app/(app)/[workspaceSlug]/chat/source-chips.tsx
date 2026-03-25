import { FileText } from "lucide-react";

export type Source = {
  title: string;
  documentId: string;
  pageNumber?: number | null;
  chunkIndex?: number | null;
  score: number;
  text: string;
  vectorId: string;
};

interface SourceChipsProps {
  sources: Source[];
  onSourceClick: (source: Source, index: number) => void;
}

export function SourceChips({ sources, onSourceClick }: SourceChipsProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((source, i) => (
        <button
          key={source.vectorId ?? i}
          onClick={() => onSourceClick(source, i)}
          title={`Relevance: ${Math.round(source.score * 100)}%`}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted transition-colors"
        >
          <FileText className="h-3 w-3 shrink-0" />
          <span className="max-w-[140px] truncate">
            [{i + 1}] {source.title}
          </span>
          {source.pageNumber != null && (
            <span className="opacity-60">· p{source.pageNumber}</span>
          )}
        </button>
      ))}
    </div>
  );
}
