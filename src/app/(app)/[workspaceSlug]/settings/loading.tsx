export default function SettingsLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Page heading */}
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-md bg-muted" />
        <div className="h-4 w-64 rounded-md bg-muted" />
      </div>
      {/* Invite form section */}
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="flex gap-3">
          <div className="h-9 w-64 rounded-md bg-muted" />
          <div className="h-9 w-32 rounded-md bg-muted" />
          <div className="h-9 w-28 rounded-md bg-muted" />
        </div>
      </div>
      {/* Members list */}
      <div className="space-y-4">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="rounded-xl border border-border overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
