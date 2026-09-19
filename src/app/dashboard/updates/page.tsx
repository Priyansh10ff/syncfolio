export default function UpdatesPage() {
  return <ComingSoon title="Updates" note="Chat-style natural language updates, parsed into structured profile diffs by the AI layer." />;
}

function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-2">{title}</h1>
      <p className="text-sm text-[var(--loom-muted)]">{note}</p>
      <p className="text-xs text-[var(--loom-muted)] mt-4">Coming in Phase 2.</p>
    </div>
  );
}
