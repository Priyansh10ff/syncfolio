export default function SyncPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-2">Sync</h1>
      <p className="text-sm text-[var(--loom-muted)]">
        Review queue for AI-suggested updates (from GitHub activity) and
        external-edit reconciliation diffs. Nothing writes automatically —
        you approve or reject each one here.
      </p>
      <p className="text-xs text-[var(--loom-muted)] mt-4">Coming in Phase 5.</p>
    </div>
  );
}
