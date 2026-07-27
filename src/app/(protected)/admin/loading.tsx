export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-11 w-28 shrink-0 rounded-2xl bg-secondary/70" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-secondary/50" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-3xl bg-secondary/40" />
        <div className="h-72 rounded-3xl bg-secondary/40" />
      </div>
    </div>
  );
}
