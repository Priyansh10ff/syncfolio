export default function PortfolioPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-2">Portfolio</h1>
      <p className="text-sm text-[var(--loom-muted)]">
        Your profile is already live at <code>/api/profile</code> — point any
        portfolio site at it. A publish/revalidate flow for common frameworks
        lands here.
      </p>
      <p className="text-xs text-[var(--loom-muted)] mt-4">Coming in Phase 4.</p>
    </div>
  );
}
