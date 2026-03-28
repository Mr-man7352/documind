export default function DocumentsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header row: title + upload button */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-md bg-muted" />
          <div className="h-4 w-56 rounded-md bg-muted" />
        </div>
        <div className="h-9 w-36 rounded-md bg-muted" />
      </div>
      {/* Document rows */}
      <div className="rounded-xl border border-border overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0"
          >
            <div className="h-9 w-9 rounded-md bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
