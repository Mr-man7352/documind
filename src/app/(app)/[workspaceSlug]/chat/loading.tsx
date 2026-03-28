export default function ChatLoading() {
  return (
    <div className="flex h-full gap-4 animate-pulse">
      {/* Conversation sidebar skeleton */}
      <div className="w-56 shrink-0 space-y-3">
        <div className="h-9 w-full rounded-md bg-muted" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted" />
        ))}
      </div>
      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col justify-end space-y-4 pb-4">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="h-16 w-2/3 rounded-xl bg-muted" />
          </div>
          <div className="flex gap-3 justify-end">
            <div className="h-10 w-1/2 rounded-xl bg-muted" />
          </div>
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="h-24 w-3/4 rounded-xl bg-muted" />
          </div>
        </div>
        {/* Input skeleton */}
        <div className="h-12 w-full rounded-xl bg-muted" />
      </div>
    </div>
  );
}
