export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <div className="h-12 w-12 rounded-2xl border border-line bg-surface flex items-center justify-center">
        <span className="text-accent text-xl font-bold">CL</span>
      </div>
      <h1 className="font-display text-xl font-semibold text-text">
        You are offline
      </h1>
      <p className="max-w-xs text-sm text-muted">
        Coach Log saved your data on this device. Reconnect and it will sync
        automatically.
      </p>
    </main>
  );
}