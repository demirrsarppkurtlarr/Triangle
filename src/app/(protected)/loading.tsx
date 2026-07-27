export default function ProtectedLoading() {
  return (
    <div className="page-pad mx-auto w-full max-w-6xl animate-pulse space-y-6 py-8">
      <div className="h-8 w-48 rounded-2xl bg-secondary/80" />
      <div className="h-40 rounded-[2rem] bg-secondary/60" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="h-24 rounded-3xl bg-secondary/50" />
        <div className="h-24 rounded-3xl bg-secondary/50" />
        <div className="h-24 rounded-3xl bg-secondary/50" />
      </div>
      <div className="h-64 rounded-[2rem] bg-secondary/40" />
    </div>
  );
}
